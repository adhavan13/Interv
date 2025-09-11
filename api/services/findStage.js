const { GoogleGenerativeAI } = require("@google/generative-ai");
const { STAGE_FIND, INTERVIEW_STAGES } = require("../utils/constants");
require("dotenv").config();

// Gemini setup
const genAI = new GoogleGenerativeAI("AIzaSyA_7aHUr4SysEZjE6Ee3Nv6Pmsc_y_PT5Q");
// const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

function buildMessages(userMessage) {
  const messages = [
    {
      role: "user", // Gemini doesn’t accept "system" directly
      parts: [{ text: STAGE_FIND }],
    },
  ];

  if (userMessage) {
    messages.push({
      role: "user",
      parts: [{ text: userMessage }],
    });
  }

  return messages;
}

function findNextStage(currentStage) {
  for (let i = 0; i < INTERVIEW_STAGES.length; i++) {
    if (INTERVIEW_STAGES[i].trim() === currentStage.trim()) {
      return i == INTERVIEW_STAGES.length - 1 ? -1 : INTERVIEW_STAGES[i + 1];
    }
  }
  return null;
}

async function findStage(userMessage) {
  try {
    const message = buildMessages(userMessage);
    const result = await model.generateContent({ contents: message });
    const currentStage = result.response.candidates[0].content.parts[0].text;
    const nextStage = findNextStage(currentStage);
    console.log(currentStage, nextStage);
    return { currentStage, nextStage };
  } catch (error) {
    console.error("Error in chatWithAI:", error);
    return "Sorry, something went wrong. Please try again later.";
  }
}

module.exports = { findStage };
