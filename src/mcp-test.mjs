import 'dotenv/config';
import { MultiServerMCPClient } from '@langchain/mcp-adapters';
import { ChatOpenAI } from '@langchain/openai';
import chalk from 'chalk';
import { HumanMessage, SystemMessage, ToolMessage } from '@langchain/core/messages';

const model = new ChatOpenAI({
    modelName: process.env.MODEL_NAME || 'gpt-4o-mini',
    apiKey: process.env.OPENAI_API_KEY,
    temperature: 0.0,
    configuration: {
      baseURL: process.env.BASE_URL || "https://api.chatanywhere.org",
    },
});

const mcpClient = new MultiServerMCPClient({
  mcpServers: {
    'my-mcp-server': {
      command: 'node',
      args: ['/Users/sunkuangdong/Desktop/LLM_Learn/Multi_Agent/src/my-mcp-server.mjs'],
    },
    'amap-maps-streamableHTTP': {
      url: process.env.AMAP_MAPS_STREAMABLE_HTTP_URL,
    },
  },
});

const tools = await mcpClient.getTools();
const modelWithTools = model.bindTools(tools);

async function runAgentWithTools(query, maxIterations = 5) {
    let messages = [new HumanMessage(query)];
    
    // Add a loop to let the model think for up to maxIterations
    for (let i = 0; i < maxIterations; i++) {
        console.log(chalk.bgGreen(`\n--- Iteration ${i + 1} ---`));
        console.log(chalk.bgGreen('Waiting for the model response...'));
        
        const response = await modelWithTools.invoke(messages);
        messages.push(response);

        // If the model does not return tool calls, it means it has all the information, return final response
        if (!response.tool_calls || response.tool_calls.length === 0) {
            console.log(chalk.bgGreen(`\n[Final Response]:`));
            console.log(response.content);
            return response.content;
        }

        console.log(chalk.bgBlue(`${response.tool_calls.length} tool calls found, preparing to execute...`));
        
        for (const toolCall of response.tool_calls) {
            const tool = tools.find((item) => item.name === toolCall.name);
            if (!tool) {
                throw new Error(`Tool ${toolCall.name} not found`);
            }

            console.log(chalk.yellow(`\n-> Calling tool: [${toolCall.name}]`));
            console.log(chalk.yellow(`-> With arguments:`, JSON.stringify(toolCall.args)));
            
            try {
                const toolResult = await tool.invoke(toolCall.args);
                
                let safeResult = String(toolResult);
                // Address ChatAnywhere free account 4096 tokens limit: if the result is too long, force truncate
                if (safeResult.length > 1500) {
                    safeResult = safeResult.substring(0, 1500) + "... [Data too long, truncated by system to save Tokens]";
                }
                
                console.log(chalk.gray(`<- Successfully received result from [${toolCall.name}].`));
                
                messages.push(
                    new ToolMessage({
                        content: safeResult,
                        tool_call_id: toolCall.id,
                    })
                );
            } catch (err) {
                console.log(chalk.bgRed(`Tool execution failed:`, err.message));
                messages.push(
                    new ToolMessage({
                        content: `Error calling tool: ${err.message}`,
                        tool_call_id: toolCall.id,
                    })
                );
            }
        }
    }

    console.log(chalk.bgRed('\nMax iterations reached, forced termination!'));
    return messages[messages.length - 1].content;
}

await runAgentWithTools('The hotel of 7 days in the city of Beijing, China. How to get there? Please give me the plan for traveling.');

await mcpClient.close();
