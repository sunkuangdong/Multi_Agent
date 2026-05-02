# LLM Multi-Agent Learning Notes

This project documents code practices and learning notes for Large Language Models (LLM), the LangChain framework, RAG (Retrieval-Augmented Generation), and MCP (Model Context Protocol).

## Directory Structure & Learning Topics

Click on the file links below to navigate directly to the corresponding code files.

### 1. LangChain Basics
- [src/hello_langchain.mjs](./src/hello_langchain.mjs): **First Experience with LangChain**. Demonstrates how to initialize an OpenAI model (configuring API Key and Base URL) and make the most basic conversational calls.
- [src/tool-file-read.mjs](./src/tool-file-read.mjs): **Tool Calling Mechanism**. Learns how to equip the LLM with "hands and feet." Defines a tool to read local files and uses `bindTools` to let the model autonomously decide when to call the tool to fetch external information.

### 2. Tokens & Text Splitters
Understanding Tokens and splitting long texts into appropriate chunks is a crucial step when processing long documents or building RAG systems.
- [src/tiktoken-test.mjs](./src/tiktoken-test.mjs): **Token Calculation Principles**. Learns to use the `js-tiktoken` library to intuitively observe how the underlying LLM calculates Tokens, specifically understanding the massive difference in Token consumption between English and Chinese.
- [src/CharacterTextSplitter-test.mjs](./src/CharacterTextSplitter-test.mjs): **Basic Character Splitting**. Learns `CharacterTextSplitter`, which performs hard splits based on a specified single character (like the `\n` newline character).
- [src/RecursiveCharacterTextSplitter-test.mjs](./src/RecursiveCharacterTextSplitter-test.mjs): **Recursive Character Splitting (Most Common)**. Learns `RecursiveCharacterTextSplitter`, which tries different separators (like paragraphs, sentences, words) in priority order to maximize semantic integrity while satisfying length constraints.
- [src/TokenTextSplitter-test.mjs](./src/TokenTextSplitter-test.mjs): **Splitting by Token Count**. Learns `TokenTextSplitter`, which strictly splits according to the underlying Token count of the LLM, ensuring the resulting chunks absolutely never exceed the model's context window limit.
- [src/recursive-splitter-markdown.mjs](./src/recursive-splitter-markdown.mjs): **Structured Markdown Splitting**. Learns how to specifically split Markdown-formatted documents, intelligently recognizing hierarchy markers (like `##`) to preserve the document's structural features.
- [src/recursive-splitter-code.mjs](./src/recursive-splitter-code.mjs): **Code Syntax Splitting**. Learns how to split code files (like JavaScript). It recognizes code syntax and tries to avoid truncating complete classes or functions in the middle.

### 3. RAG (Retrieval-Augmented Generation) Core Workflow
- [src/loader-and-splitter.mjs](./src/loader-and-splitter.mjs): **Data Loading (Document Loaders)**. Learns how to use `CheerioWebBaseLoader` combined with CSS selectors to precisely scrape and extract main body content from real web pages (like Juejin blogs).
- [rag-test/hello-rag.mjs](./rag-test/hello-rag.mjs): **RAG Principles (Educational Demo)**. This is a classic "white-box" educational code that demonstrates the complete RAG loop from scratch: Text Vectorization (Embedding) -> Storing in Memory Vector Database (`MemoryVectorStore`) -> Similarity Retrieval & Scoring -> Building Prompt with Context -> LLM Generating Final Answer.
- [rag-test/RAG.mjs](./rag-test/RAG.mjs): **Advanced RAG Practice**. Combines external document loaders and vector retrieval to implement an "Article Reading Assistant" that can answer user questions based on specified article content.

### 4. MCP (Model Context Protocol) Exploration
- [src/my-mcp-server.mjs](./src/my-mcp-server.mjs): Learns how to create a custom MCP Server from scratch.
- [src/mcp-test.mjs](./src/mcp-test.mjs): Tests basic connection and interaction with an MCP Server.
- [src/langchain-mcp-test.mjs](./src/langchain-mcp-test.mjs): Learns how to seamlessly integrate the cutting-edge MCP protocol with the LangChain framework.