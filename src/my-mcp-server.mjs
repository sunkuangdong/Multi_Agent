import { McpServer } from '@langchain/core/mcp';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio';
import { z } from 'zod';
import { describe } from 'zod/v4/core';

const database = {
    users: {
        "001": {
            id: "001",
            name: "John Doe",
            email: "john.doe@example.com",
            role: "admin",
        },
        "002":{
            id: "002",
            name: "Jane Smith",
            email: "jane.smith@example.com",
            role: "user",
        },
        "003": {
            id: "003",
            name: "Jim Beam",
            email: "jim.beam@example.com",
            role: "user",
        },
    }
};
// create the MCP server instance
const mcpServer = new McpServer({
    name: "my-mcp-server",
    version: "1.0.0",
});

// register the tools
mcpServer.registerTool('query_user',
    {
        description: 'Query a user in the database by id, and return the user information(name, email, role)',
        inputSchema: {
            userId: z.string().describe("The id of the user"),
        }
    },
    async ({ userId }) => {
        const user = database.users[userId];
        if (!user) {
            return {
                content: [
                    {
                        type: "text",
                        text: `User with id ${userId} not found`,
                    }
                ]
            }
        }
        return {
            content: [
                {
                    type: "text",
                    text: `user information: name: ${user.name}, email: ${user.email}, role: ${user.role}`,
                }
            ]
        }
    }
);

// register the operating guide resource
mcpServer.registerResource('operating guide', 'docs://guide', {
    description: 'The operating guide for the MCP server',
    mimeType: 'text/plain',
    }, async () => {
        return {
            content: [
                {
                    uri: 'docs://guide',
                    mimeType: 'text/plain',
                    content: `
                        The operating guide functions:
                            1. query_user: Provide the tools for querying user information.
                        Usage:
                            Communication by natural language in MCP client that is the Cursor IDE, etc. Cursor will automatically call the tools for you.
                    `,
                }
            ],
        };
    }
);

// connect the MCP server to the transport
const transport = new StdioClientTransport();
// connect the MCP server to the transport
await mcpServer.connect(transport);