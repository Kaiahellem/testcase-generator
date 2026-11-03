import "dotenv/config";
import OpenAI from "openai";

const client = new OpenAI({
  baseURL: process.env.AZURE_OPENAI_BASE_URL,
  apiKey: process.env.AZURE_OPENAI_API_KEY,
});

const response = await client.chat.completions.create({
  model: process.env.AZURE_OPENAI_DEPLOYMENT!,
  messages: [
    { role: "system", content: "You are a helpful assistant." },
    { role: "user", content: "Say hello in Norwegian." },
  ],
});

console.log(response.choices[0].message.content);