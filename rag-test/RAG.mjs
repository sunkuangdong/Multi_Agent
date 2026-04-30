import { config as loadEnv } from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { ChatOpenAI, OpenAIEmbeddings } from"@langchain/openai";
import { Document } from"@langchain/core/documents";
import { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";
import { chunks } from "../src/loader-and-splitter.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Prefer a local rag-test/.env, then fall back to the repo root .env.
loadEnv({ path: resolve(__dirname, ".env") });
loadEnv({ path: resolve(__dirname, "../.env") });

if (!process.env.OPENAI_API_KEY) {
  throw new Error(
    "Missing OPENAI_API_KEY. Add it to rag-test/.env or the repository root .env.",
  );
}

const model = new ChatOpenAI({
  modelName: process.env.MODEL_NAME || 'gpt-4o-mini',
  apiKey: process.env.OPENAI_API_KEY,
  temperature: 0.0,
  configuration: {
    baseURL: process.env.BASE_URL || "https://api.chatanywhere.org",
  },
});

const embeddings = new OpenAIEmbeddings({
    apiKey: process.env.OPENAI_API_KEY,
    modelName: process.env.EMBEDDINGS_MODEL_NAME || 'text-embedding-3-small',
    configuration: {
        baseURL: process.env.BASE_URL || "https://api.chatanywhere.org",
    },
});

// change from documents to chunks to vector store
const vectorStore = await MemoryVectorStore.fromDocuments(
    chunks,
    embeddings,
);

const retriever = vectorStore.asRetriever({k: 2});

const questions = [
    "How did the father's passing fundamentally reverse the author's attitude towards life?"
];

for (const question of questions) {
    console.log("=".repeat(80));
    console.log(`Question: ${question}`);
    console.log("=".repeat(80));
    
    // Retrieve relevant documents with the retriever.
    const retrievedDocs = await retriever.invoke(question);
    
    // Fetch similarity scores for the retrieved documents.
    const scoredResults = await vectorStore.similaritySearchWithScore(question, 2);
    
    // Print the retrieved documents alongside their similarity scores.
    console.log("\n[Retrieved Documents and Similarity Scores]");
    retrievedDocs.forEach((doc, i) => {
        // Match each retrieved document with its score.
        const scoredResult = scoredResults.find(([scoredDoc]) =>
            scoredDoc.pageContent === doc.pageContent
        );
        const score = scoredResult ? scoredResult[1] : null;
        const similarity = score !== null ? (1 - score).toFixed(4) : "N/A";

        console.log(`\n[Document ${i + 1}] Similarity: ${similarity}`);
        console.log(`Content: ${doc.pageContent}`);
    });
    
    // Build the prompt from the retrieved context.
    const context = retrievedDocs
        .map((doc, i) =>`[Passage ${i + 1}]\n${doc.pageContent}`)
        .join("\n\n━━━━━\n\n");
    
        const prompt = `You are an article reading assistant. Answer the question based on the article content:

        Article Content:
        ${context}
        
        Question: ${question}
        
        Your Answer:`;
    
    console.log("\n[AI Answer]");
    const response = await model.invoke(prompt);
    console.log(response.content);
    console.log("\n");
}
