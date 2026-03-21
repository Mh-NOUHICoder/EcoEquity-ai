import axios from "axios";
import fs from "fs";

// Manually parse .env.local
const env = fs.readFileSync(".env.local", "utf8");
const match = env.match(/NEXT_PUBLIC_GEMINI_API_KEY=["']?([^"'\s]+)["']?/) || env.match(/GEMINI_API_KEY=["']?([^"'\s]+)["']?/);
const apiKey = match ? match[1] : "";

if (!apiKey) {
  console.error("API Key not found in .env.local");
  process.exit(1);
}

console.log("Using API Key:", apiKey.substring(0, 5) + "...");

async function listModels() {
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    const response = await axios.get(url);
    
    console.log("--- Available Models ---");
    response.data.models.forEach((m) => {
      console.log(`- ${m.name}`);
    });
    console.log("------------------------");
  } catch (error) {
    console.error("Error listing models:", error.response?.data || error.message);
  }
}

listModels();
