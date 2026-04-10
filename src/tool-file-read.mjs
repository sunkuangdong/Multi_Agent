import 'dotenv/config';
import { ChatOpenAI } from "@langchain/openai";
import { tool } from '@langchain/core/tools';
import { SystemMessage, HumanMessage, ToolMessage } from '@langchain/core/messages';
import { z } from 'zod';
import fs from 'fs/promises';


const model = new ChatOpenAI({
  modelName: process.env.MODEL_NAME || 'gpt-4o-mini',
  apiKey: process.env.OPENAI_API_KEY,
  temperature: 0.0,
  configuration: {
    baseURL: process.env.BASE_URL || "https://api.chatanywhere.org",
  },
});

const readFileTool = tool(
  async ({filePath}) => {
  const content = await fs.readFile(filePath, 'utf-8');
  return `Content of the file: ${content}`;
}, {
  name: 'read_File',
  description: 'Read a file and return the content',
  schema: z.object({
    filePath: z.string().describe('The path to the file to read'),
  }),
});

const tools = [readFileTool];

const modelWithTools = model.bindTools(tools);

const messages = [
  new SystemMessage(
    `
      You are a helpful assistant that can read files and return the content.

      Work flow:
        1. While you are reading the file, call the read_File tool to read the file.
        2. Wait for the tool to return the content.
        3. Analyze and explain the content based on the file content.
      
      You can use these tools to help you:
        - read_File: Read a file and return the content.
          - Input: The path to the file to read.
          - Output: The content of the file.
    `
  ),
  new HumanMessage(`Please read the file src/tool-file-read.mjs and explain the content.`),
]


const toolsByName = { read_File: readFileTool };

// first call to the model to decide which tool to call
let response = await modelWithTools.invoke(messages);
messages.push(response);

// call the tool and get the result
while (response.tool_calls && response.tool_calls.length > 0) {
  const toolResults = await Promise.all(
    response.tool_calls.map(async (toolCall) => {
      const tool = tools.find((tool) => tool.name === toolCall.name);
      if (!tool) {
        throw new Error(`Tool ${toolCall.name} not found`);
      }
      console.log(`The number of tool calls is ${response.tool_calls.length}`);

      try {
        return await tool.invoke(toolCall.args);
      } catch (error) {
        return `Error calling tool ${toolCall.name}: ${error}`;
      }

    })
  );
  response.tool_calls.forEach((toolCall, index) => {
    messages.push(
        new ToolMessage({
            content: toolResults[index],
            tool_call_id: toolCall.id,
        })
    );
  });

  response = await modelWithTools.invoke(messages);
}

console.log(response.content);