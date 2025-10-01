const { GoogleGenerativeAI } = require("@google/generative-ai");
const ADVANCE_ANALYTICS_PROMPT =
  require("../utils/constants").ADVANCE_ANALYTICS_PROMPT;

// Gemini setup
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

async function advanceAnalyticsReport(userMessage, problemId) {
  try {
    // combine system prompt + user input
    const prompt = `${ADVANCE_ANALYTICS_PROMPT}\nProblem ID: ${"658. Find K Closest Elements"}\nUser: ${userMessage}`;

    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
    });

    const aiMessage =
      result?.response?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "⚠️ No response from AI.";

    return { aiMessage };
  } catch (error) {
    console.error("Error in chatWithAI:", error);
    return {
      aiMessage: "Sorry, something went wrong. Please try again later.",
    };
  }
}

module.exports = { advanceAnalyticsReport };
