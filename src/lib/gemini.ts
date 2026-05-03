import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleAIFileManager } from "@google/generative-ai/server";

const apiKey = process.env.GOOGLE_API_KEY;

if (!apiKey) {
  throw new Error(
    "GOOGLE_API_KEY is not set. Get a free key at https://aistudio.google.com"
  );
}

/** Shared Gemini generative client (for chat/content generation). */
export const genAI = new GoogleGenerativeAI(apiKey);

/** Shared Gemini File Manager (for uploading/managing PDF files). */
export const fileManager = new GoogleAIFileManager(apiKey);
