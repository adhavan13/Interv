const { GoogleGenerativeAI } = require("@google/generative-ai");
const Message = require("../model/message");

// Gemini setup
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

// System prompt
const SYSTEM_PROMPT = `
You are an AI interviewer that evaluates coding skills.
Follow this flow strictly:
1. Ask for the candidate's approach.
2. If unclear, ask for clarification. Otherwise ask for pseudocode.
3. After pseudocode, ask for edge cases.
4. Then ask for time and space complexity.
5. Finally, ask for code.
6. After the candidate completes the code correctly, if they ask for a report, generate a detailed evaluation report highlighting:
   - Where they did well in previous steps.
   - Where they need improvement.
   - Suggestions for future improvement.
Always keep track of progress and do not repeat previous steps.`;

// Fetch history for a session
async function getHistory(sessionId) {
  return await Message.find({ sessionId })
    .sort({ timestamp: 1 }) // oldest first
    .lean()
    .exec();
}

// Convert MongoDB history to Gemini messages
function buildMessages(history) {
  const messages = [
    {
      role: "user", // Gemini doesn’t accept "system" directly
      parts: [{ text: SYSTEM_PROMPT }],
    },
  ];

  history.forEach((h) => {
    messages.push({
      role: h.role, // must be "user" or "model"
      parts: [{ text: h.content }],
    });
  });

  return messages;
}

// Chat handler
async function chatWithAI(sessionId, userMessage) {
  try {
    // Save user message
    await Message.create({
      sessionId,
      role: "user",
      content: userMessage,
      timestamp: new Date(),
    });

    // Fetch history
    const history = await getHistory(sessionId);
    const messages = buildMessages(history);

    // Call Gemini API
    console.log("Sending messages to Gemini:", messages);
    const result = await model.generateContent({ contents: messages });
    const aiMessage = result.response.candidates[0].content.parts[0].text;
     
      

    
    // Save AI reply
    await Message.create({
      sessionId,
      role: "model",
      content: aiMessage,
      timestamp: new Date(),
    });

    return aiMessage;
  } catch (error) {
    console.error("Error in chatWithAI:", error);
    return "Sorry, something went wrong. Please try again later.";
  }
}

module.exports = { chatWithAI };
