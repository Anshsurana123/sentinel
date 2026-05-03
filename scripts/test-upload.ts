import { GoogleAIFileManager } from "@google/generative-ai/server";
import 'dotenv/config';

async function testListFiles() {
  const fileManager = new GoogleAIFileManager(process.env.GOOGLE_API_KEY!);
  const files = await fileManager.listFiles();
  console.log("Total files:", files.files.length);
  for (const f of files.files.slice(0, 3)) {
    console.log(f.displayName, f.name, f.uri);
  }
}
testListFiles();
