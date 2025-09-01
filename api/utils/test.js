const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize client with your API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function listModels() {
  try {
    const response = await genAI.models.list();
    console.log("Available Gemini models:\n");
    response.models.forEach((model) => {
      console.log(`- ${model.name}`);
    });
  } catch (err) {
    console.error("Error listing models:", err);
  }
}

listModels();
