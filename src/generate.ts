import "dotenv/config";
import OpenAI from "openai";
import { readFile } from "node:fs/promises";
import { testCaseSchema } from "./schema";

const client = new OpenAI({
  baseURL: process.env.AZURE_OPENAI_BASE_URL,
  apiKey: process.env.AZURE_OPENAI_API_KEY,
});

const systemPrompt = await readFile("prompts/system.md", "utf-8");

const requirement = await readFile("requirements/login.md", "utf-8");

const response = await client.chat.completions.create({
  model: process.env.AZURE_OPENAI_DEPLOYMENT!,
  messages: [
    { role: "system", content: systemPrompt },
    { role: "user", content: requirement },
  ],
  response_format: {
  type: "json_schema",
  json_schema: {
    name: "test_cases",
    strict: true,
    schema: testCaseSchema,
  },
},
});

console.log(response.choices[0].message.content);