import 'dotenv/config';
import { MultiServerMCPClient } from '@langchain/mcp-adapters';
import { ChatOpenAI } from '@langchain/openai';
import chalk from 'chalk';
import { HumanMessage, SystemMessage, ToolMessage } from '@langchain/core/messages';

const mcpClient = new MultiServerMCPClient({
  mcpServers: {
    'amap-maps-streamableHTTP': {
      url: process.env.AMAP_MAPS_STREAMABLE_HTTP_URL,
    },
  },
});

