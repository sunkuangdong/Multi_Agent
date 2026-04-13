import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import * as z from 'zod/v4';

const database = {
  users: {
    '001': {
      id: '001',
      name: 'John Doe',
      email: 'john.doe@example.com',
      role: 'admin',
    },
    '002': {
      id: '002',
      name: 'Jane Smith',
      email: 'jane.smith@example.com',
      role: 'user',
    },
    '003': {
      id: '003',
      name: 'Jim Beam',
      email: 'jim.beam@example.com',
      role: 'user',
    },
  },
};

const mcpServer = new McpServer({
  name: 'my-mcp-server',
  version: '1.0.0',
});

mcpServer.registerTool(
  'query_user',
  {
    description: 'Query a user in the database by id and return name, email, and role.',
    inputSchema: {
      userId: z.string().describe('The id of the user'),
    },
  },
  async ({ userId }) => {
    const user = database.users[userId];
    if (!user) {
      return {
        content: [
          {
            type: 'text',
            text: `User with id ${userId} not found.`,
          },
        ],
        isError: true,
      };
    }

    return {
      content: [
        {
          type: 'text',
          text: `user information: name: ${user.name}, email: ${user.email}, role: ${user.role}`,
        },
      ],
    };
  }
);

mcpServer.registerResource(
  'operating-guide',
  'docs://guide',
  {
    description: 'The operating guide for the MCP server',
    mimeType: 'text/plain',
  },
  async () => ({
    contents: [
      {
        uri: 'docs://guide',
        mimeType: 'text/plain',
        text: `The operating guide functions:
1. query_user: Provide tools for querying user information.

Usage:
Communicate in natural language in an MCP client (Cursor, etc.).`,
      },
    ],
  })
);

async function main() {
  const transport = new StdioServerTransport();
  await mcpServer.connect(transport);
  console.error('my-mcp-server is running on stdio');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
