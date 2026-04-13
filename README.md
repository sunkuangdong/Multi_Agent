# Multi_Agent Learning Notes (MCP + LangChain)

This repo is a hands-on learning project focused on:

1. Building an MCP server
2. Calling MCP tools/resources from LangChain
3. Understanding protocol vs transport vs business logic
4. Understanding why cross-language communication works

---

## 1. Code Map (Jump Links)

Core files:

- [MCP server: `src/my-mcp-server.mjs](./src/my-mcp-server.mjs)`
- [LangChain + MCP client demo: `src/langchain-mcp-test.mjs](./src/langchain-mcp-test.mjs)`
- [Basic LangChain call: `src/hello_langchain.mjs](./src/hello_langchain.mjs)`
- [Tool call demo (file read): `src/tool-file-read.mjs](./src/tool-file-read.mjs)`

Important sections:

- Register tool `query_user`: [my-mcp-server.mjs#L33](./src/my-mcp-server.mjs)
- Register resource `docs://guide`: [my-mcp-server.mjs#L66](./src/my-mcp-server.mjs)
- Start stdio transport: [my-mcp-server.mjs#L88](./src/my-mcp-server.mjs#L88)
- Create `MultiServerMCPClient`: [langchain-mcp-test.mjs#L16](./src/langchain-mcp-test.mjs)
- List/read resources: [langchain-mcp-test.mjs#L29](./src/langchain-mcp-test.mjs)
- Tool-loop agent logic: [langchain-mcp-test.mjs#L44](./src/langchain-mcp-test.mjs)

---

## 2. Quick Start

### 2.1 Install

```bash
pnpm install
```

### 2.2 Configure `.env`

Use your own values:

```bash
OPENAI_API_KEY=your_key
MODEL_NAME=your_model_name
BASE_URL=your_base_url
```

### 2.3 Run MCP server only

```bash
npm run mcp:start
```

Expected output:

```text
my-mcp-server is running on stdio
```

### 2.4 Run LangChain + MCP demo

```bash
node ./src/langchain-mcp-test.mjs
```

---

## 3. What MCP Is Doing Here

In this project, MCP is the standard protocol between:

- MCP client (LangChain side)
- MCP server (`my-mcp-server.mjs`)

### 3.1 Data flow

1. `langchain-mcp-test.mjs` starts `my-mcp-server.mjs` as a child process
2. Communication happens over stdio
3. Client requests capabilities/tools/resources using MCP messages
4. Server executes local logic (query object database / return guide resource)
5. Results return to client in MCP format

### 3.2 Very important distinction

- MCP is not "smart query logic"
- MCP is protocol and lifecycle standardization
- Real business logic is your code in server callbacks

Example:

- User query id `001` is resolved by this code:  
`const user = database.users[userId];`  
in [my-mcp-server.mjs](./src/my-mcp-server.mjs)

---

## 4. Why Cross-Language Works

Cross-language communication works because processes exchange bytes, not source language.

As long as both sides agree on:

1. Message structure (protocol)
2. Transport (stdio/http/websocket/etc.)

they can communicate.

So:

- JavaScript server + Python client: yes
- Python server + JavaScript client: yes

MCP is one standard protocol choice.  
You could design your own protocol (for example "SCP"), and it can also be cross-language if both sides implement it consistently.

---

## 5. Transport vs Protocol vs Business Logic

Use this mental model:

1. Transport layer: how bytes move (`stdio`, `http`, `socket`)
2. Protocol layer: how messages are organized (MCP / JSON-RPC style structure)
3. Business layer: your app logic (`query_user`, `readResource`, etc.)

This separation is why:

- changing language does not break communication
- changing protocol does break compatibility
- changing business logic changes behavior but not transport/protocol

---

## 6. Lessons Learned from Real Errors

### 6.1 `ERR_PACKAGE_PATH_NOT_EXPORTED: @langchain/core/mcp`

Symptom:

```text
Package subpath './mcp' is not defined by "exports"
```

Cause:

- Imported `McpServer` from `@langchain/core/mcp` (unsupported export in installed version)

Fix:

- Use official MCP SDK server import:
  - `@modelcontextprotocol/sdk/server/mcp.js`
  - `@modelcontextprotocol/sdk/server/stdio.js`

See fixed code: [my-mcp-server.mjs](./src/my-mcp-server.mjs)

---

### 6.2 `Connection closed` from `@langchain/mcp-adapters`

Symptom:

```text
Failed to connect to stdio server ... Connection closed
```

Cause:

- MCP server process crashed during startup (upstream import/runtime error)

Fix:

- Fix server startup errors first
- Then reconnect via `MultiServerMCPClient`

---

### 6.3 `mcpClient.getResource is not a function`

Cause:

- Wrong method name

Fix:

- Use `readResource(serverName, uri)`  
Method usage appears in [langchain-mcp-test.mjs#L34](./src/langchain-mcp-test.mjs#L34)

---

### 6.4 `resourceContent is not defined` / `SystemMessage is not defined`

Cause:

- Variable not initialized
- Class not imported

Fix:

- Initialize `resourceContent`
- Import `SystemMessage` from `@langchain/core/messages`

See:

- [langchain-mcp-test.mjs#L5](./src/langchain-mcp-test.mjs#L5)
- [langchain-mcp-test.mjs#L27](./src/langchain-mcp-test.mjs#L27)

---

## 7. Current Demo Behavior

`langchain-mcp-test.mjs` now does:

1. Connect to MCP server
2. Read resource `docs://guide`
3. Put guide content into a `SystemMessage`
4. Let model decide whether to call tools
5. Loop tool calls until final answer

This is a compact pattern for "RAG-lite + tool use":

- lightweight context from resources
- dynamic actions from tools

---

## 8. Useful Commands

```bash
# start only MCP server
npm run mcp:start

# run full langchain+mcp flow
node ./src/langchain-mcp-test.mjs

# syntax check
node --check src/my-mcp-server.mjs
node --check src/langchain-mcp-test.mjs
```

---

## 9. Next Suggested Enhancements

1. Make MCP server path relative (remove machine-specific absolute path)
2. Add timeout/retry for model calls
3. Add a second tool (for example `list_users`)
4. Add tests for tool behavior
5. Add a Python MCP client demo to prove cross-language in practice

---

## 10. One-Sentence Summary

This project demonstrates that MCP standardizes process-to-process AI tool communication, while actual app intelligence remains in your own server-side business logic.