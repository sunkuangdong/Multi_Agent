import { config as loadEnv } from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { ChatOpenAI, OpenAIEmbeddings } from"@langchain/openai";
import { Document } from"@langchain/core/documents";
import { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";

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

const documents = [
    new Document({
        pageContent:`Guangguang is a lively and cheerful little boy. He has bright eyes and is always wearing a radiant smile. What Guangguang loves most is playing with his friends, and he is especially good at soccer. Whenever he runs across the field, he is as energetic as a beam of sunshine.`,
        metadata: {
            chapter: 1,
            character:"Guangguang",
            type:"Character Introduction",
            mood:"Lively"
        },
    }),
    new Document({
        pageContent:`Dongdong is Guangguang's best friend. He is a quiet and intelligent boy who loves reading and drawing, and his artwork is always full of imagination. Although their personalities are different, Dongdong and Guangguang have known each other since kindergarten, and they have shared countless happy moments together.`,
        metadata: {
            chapter: 2,
            character:"Dongdong",
            type:"Character Introduction",
            mood:"Warm"
        },
    }),
    new Document({
        pageContent:`One day, the school announced that it would hold a soccer match. Guangguang was thrilled and invited Dongdong to join him. But Dongdong had never played soccer before, and he worried that he would hold Guangguang back. Sensing his concern, Guangguang patted Dongdong on the shoulder and said, "It's okay. We can practice together, and I know you can do it!"`,
        metadata: {
            chapter: 3,
            character:"Guangguang and Dongdong",
            type:"Friendship Plot",
            mood:"Encouraging",
        },
    }),
    new Document({
        pageContent:`In the days that followed, Guangguang taught Dongdong how to play soccer after school every day. He patiently showed him how to control the ball, pass, and shoot. Although Dongdong struggled at first, he never gave up. Dongdong also found his own way to return Guangguang's kindness: he drew a picture for him showing two little boys playing soccer together on the field.`,
        metadata: {
            chapter: 4,
            character:"Guangguang and Dongdong",
            type:"Friendship Plot",
            mood:"Mutual Support",
        },
     }),
    new Document({
        pageContent:`At last, the day of the match arrived, and Guangguang and Dongdong stood on the field together. Although Dongdong's skills were still developing, he worked incredibly hard and used his keen observation to help Guangguang spot the other team's weakness. At the crucial moment, Dongdong made a beautiful pass, and Guangguang scored with a powerful shot. They won the game, and more importantly, their friendship grew even deeper.`,
        metadata: {
            chapter: 5,
            character:"Guangguang and Dongdong",
            type:"Climax",
            mood:"Excited",
        },
    }),
    new Document({
        pageContent:`From then on, Guangguang and Dongdong became the closest friends in school. Guangguang taught Dongdong sports, and Dongdong taught Guangguang how to draw. They learned from each other and grew together. Whenever someone asked about their friendship, they would smile and say, "A true friend is someone who helps you and grows better with you."`,
        metadata: {
            chapter: 6,
            character:"Guangguang and Dongdong",
            type:"Ending",
            mood:"Joyful",
        },
    }),
    new Document({
        pageContent:`Many years later, Guangguang became a professional soccer player, and Dongdong became an outstanding illustrator. Even though they followed different paths, their friendship never changed. Dongdong designed the artwork on Guangguang's jersey, and Guangguang called Dongdong after every match to share his joy. Together, they proved that true friendship can shine forever across time and distance.`,
        metadata: {
            chapter: 7,
            character:"Guangguang and Dongdong",
            type:"Epilogue",
            mood:"Warm",
        },
    }),
];

const vectorStore = await MemoryVectorStore.fromDocuments(
    documents,
    embeddings,
);

const retriever = vectorStore.asRetriever(3);

const questions = [
    "How did Dongdong and Guangguang become friends?"
];

for (const question of questions) {
    console.log("=".repeat(80));
    console.log(`Question: ${question}`);
    console.log("=".repeat(80));
    
    // Retrieve relevant documents with the retriever.
    const retrievedDocs = await retriever.invoke(question);
    
    // Fetch similarity scores for the retrieved documents.
    const scoredResults = await vectorStore.similaritySearchWithScore(question, 3);
    
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
        console.log(`Metadata: chapter=${doc.metadata.chapter}, character=${doc.metadata.character}, type=${doc.metadata.type}, mood=${doc.metadata.mood}`);
    });
    
    // Build the prompt from the retrieved context.
    const context = retrievedDocs
        .map((doc, i) =>`[Passage ${i + 1}]\n${doc.pageContent}`)
        .join("\n\n━━━━━\n\n");
    
    const prompt = `You are a teacher telling a story about friendship. Answer the question based on the story passages below using warm and vivid language. If the detail is not mentioned in the story, say "This detail has not been mentioned in the story yet."
    
    Story Passages:
    ${context}
    
    Question: ${question}
    
    Teacher's Answer:`;
    
    console.log("\n[AI Answer]");
    const response = await model.invoke(prompt);
    console.log(response.content);
    console.log("\n");
}
