const { GoogleGenerativeAI } = require("@google/generative-ai");
const Message = require("../model/message");
const SYSTEM_PROMPT = require("../utils/constants").TEST_CASES;

// Gemini setup
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

// Fetch history for a session
async function getHistory(problemId) {
  return await Message.find({ problemId, type: "testcases" })
    .sort({ timestamp: 1 }) // oldest first
    .lean()
    .exec();
}

// Convert MongoDB history to Gemini messages
async function buildMessages(history) {
  const messages = [
    {
      role: "User", // Gemini doesn’t accept "system" directly
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
async function testCaseAi(problemId, userMessage) {
  try {
    // Save user message
    await Message.create({
      problemId: problemId,
      role: "user",
      type: "testcases",
      content: userMessage,
      timestamp: new Date(),
    });

    // Fetch history (some may be summarized now)
    const history = await getHistory(problemId);
    const messages = await buildMessages(history);

    // Call Gemini API
    console.log("Sending messages to Gemini:", messages);
    const result = await model.generateContent({ contents: messages });
    const aiMessage = result.response.candidates[0].content.parts[0].text;

    // Save AI reply
    await Message.create({
      problemId: problemId,
      role: "model",
      type: "testcases",
      content: aiMessage,
      timestamp: new Date(),
    });

    return { aiMessage };
  } catch (error) {
    console.error("Error in testCaseAi:", error);
    return "Sorry, something went wrong. Please try again later.";
  }
}

module.exports = { testCaseAi };
