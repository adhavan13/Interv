const { GoogleGenerativeAI } = require("@google/generative-ai");
const Message = require("../model/message");
// Gemini setup
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

// System prompt (role definition)
const SYSTEM_PROMPT = `
You are an AI interviewer that evaluates coding skills.
Follow this flow strictly:
1. Ask for the candidate's approach.
2. If unclear, ask for clarification. Otherwise ask for pseudocode.
3. After pseudocode, ask for edge cases.
4. Then ask for time and space complexity.
5. Finally, ask for code.
Always keep track of progress and do not repeat previous steps.`;

// Fetch history for a session
async function getHistory(sessionId) {
  return await Message.find({ sessionId }).sort({ timestamp: 1 }).toArray();
}

// Convert MongoDB history to Gemini messages
function buildMessages(history) {
  const messages = [
    {
      role: "system",
      parts: [{ text: SYSTEM_PROMPT }],
    },
  ];

  history.forEach((h) => {
    messages.push({
      role: h.role, // "user" or "model"
      parts: [{ text: h.message }],
    });
  });

  return messages;
}

// Chat handler

export async function chatWithAI(sessionId, userMessage) {
  try {
    // Save user message
    await Message.insertOne({
      sessionId,
      role: "user",
      message: userMessage,
      timestamp: new Date(),
    });

    // Fetch history
    const history = await getHistory(sessionId);
    const messages = buildMessages(history);

    // Call Gemini API
    const result = await model.generateContent({ contents: messages });
    const aiMessage = result.response.candidates[0].content.parts[0].text;

    // Save AI reply
    await Message.insertOne({
      sessionId,
      role: "model",
      message: aiMessage,
      timestamp: new Date(),
    });

    return aiMessage;
  } catch (error) {
    console.error("Error in chatWithAI:", error);
    // Optionally, you can save the error to DB or return a friendly message
    return "Sorry, something went wrong. Please try again later.";
  }
}
