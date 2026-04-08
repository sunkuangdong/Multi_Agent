import 'dotenv/config';
import { ChatOpenAI } from "@langchain/openai";


const model = new ChatOpenAI({
  modelName: "gpt-4o-mini",
  apiKey: process.env.OPENAI_API_KEY,
  configuration: {
    baseURL: "https://api.chatanywhere.org",
  },
});

const response = await model.invoke("What is the capital of France?");
console.log(response.content);