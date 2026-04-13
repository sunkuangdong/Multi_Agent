import 'dotenv/config';
import { MultiServerMCPClient } from '@langchain/mcp-adapters';
import { ChatOpenAI } from '@langchain/openai';
import chalk from 'chalk';
import { HumanMessage, ToolMessage } from '@langchain/core/messages';

const model = new ChatOpenAI({
  modelName: process.env.MODEL_NAME || 'gpt-4o-mini',
  apiKey: process.env.OPENAI_API_KEY,
  temperature: 0.0,
  configuration: {
    baseURL: process.env.BASE_URL || 'https://api.chatanywhere.org',
  },
});

const mcpClient = new MultiServerMCPClient({
  mcpServers: {
    'my-mcp-server': {
      command: 'node',
      args: ['/Users/sunkuangdong/Desktop/LLM_Learn/Multi_Agent/src/my-mcp-server.mjs'],
    },
  },
});

const tools = await mcpClient.getTools();
const modelWithTools = model.bindTools(tools);

async function runAgentWithTools(query, maxIterations = 30) {
  const messages = [new HumanMessage(query)];

  for (let i = 0; i < maxIterations; i++) {
    console.log(chalk.bgGreen('Waiting for the tool call to complete...'));
    const response = await modelWithTools.invoke(messages);
    messages.push(response);

    if (!response.tool_calls || response.tool_calls.length === 0) {
      console.log(chalk.bgGreen('No tool calls found, returning the final response...'));
      return response.content;
    }

    console.log(chalk.bgBlue(`${response.tool_calls.length} tools found, calling the tools...`));
    console.log(
      chalk.bgBlue(`Tool calls: ${response.tool_calls.map((toolCall) => toolCall.name).join(', ')}`)
    );

    for (const toolCall of response.tool_calls) {
      const tool = tools.find((item) => item.name === toolCall.name);
      if (!tool) {
        throw new Error(`Tool ${toolCall.name} not found`);
      }

      const toolResult = await tool.invoke(toolCall.args);
      const toolContent =
        typeof toolResult === 'string' ? toolResult : JSON.stringify(toolResult, null, 2);

      messages.push(
        new ToolMessage({
          content: toolContent,
          tool_call_id: toolCall.id,
        })
      );
    }
  }

  throw new Error(`Max iterations (${maxIterations}) reached without a final response.`);
}

try {
//   const answer = await runAgentWithTools('What is the user information of the user with id 002?');
  const res = await mcpClient.listResources();
  console.log(chalk.green('\nResources:\n'), res);
  await mcpClient.close();
} catch (error) {
  console.error(chalk.red('Error:'), error);
  await mcpClient.close();
}
