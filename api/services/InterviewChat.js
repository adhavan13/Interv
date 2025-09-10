const { GoogleGenerativeAI } = require("@google/generative-ai");
const Message = require("../model/message");
const SYSTEM_PROMPT = require("../utils/constants").SYSTEM_PROMPT;

// Gemini setup
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

// Fetch history for a session
async function getHistory(problemId) {
  return await Message.find({ problemId })
    .sort({ timestamp: 1 }) // oldest first
    .lean()
    .exec();
}
// Convert MongoDB history to Gemini messages
function buildMessages(history, currentStage, nextStage) {
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
  messages.push({
    role: "System", // must be "user" or "model"
    parts: [{ text: currentStage }],
  });
  messages.push({
    role: "System", // must be "user" or "model"
    parts: [{ text: nextStage }],
  });
  return messages;
}
// Check if message is requesting a report
function isRequestingReport(message) {
  const reportKeywords = ["detailed final report"];
  return reportKeywords.some((keyword) =>
    message.toLowerCase().includes(keyword)
  );
}
// Chat handler
async function chatWithAI(problemId, userMessage) {
  try {
    // Save user message
    await Message.create({
      problemId: problemId,
      role: "user",
      content: userMessage,
      timestamp: new Date(),
    });

    // Fetch history (some may be summarized now)
    const history = await getHistory(problemId);
    const messages = buildMessages(history);

    const isReportRequest = isRequestingReport(userMessage);

    if (isReportRequest) {
      // Add specific instruction for final report generation
      messages.push({
        role: "user",
        parts: [
          {
            text: "Please generate a detailed final evaluation report of my performance in this interview, including strengths, areas of improvement, and specific suggestions.",
          },
        ],
      });
    }

    // Call Gemini API
    console.log("Sending messages to Gemini:", messages);
    const result = await model.generateContent({ contents: messages });
    const aiMessage = result.response.candidates[0].content.parts[0].text;

    // Save AI reply
    await Message.create({
      problemId: problemId,
      role: "model",
      content: aiMessage,
      timestamp: new Date(),
    });
    let flag = false;
    // If this was a report request, clean up the session data
    if (isReportRequest) {
      // Wait a bit to ensure the final message is saved
      flag = true;
      setTimeout(async () => {
        try {
          await Message.deleteMany({ problemId: problemId });
          console.log(`Cleaned up session data for problemId: ${problemId}`);
        } catch (error) {
          console.error(`Error cleaning up session data: ${error}`);
        }
      }, 5000); // 5 second delay to ensure final message is saved
    }

    return { aiMessage, flag };
  } catch (error) {
    console.error("Error in chatWithAI:", error);
    return "Sorry, something went wrong. Please try again later.";
  }
}

module.exports = { chatWithAI };
