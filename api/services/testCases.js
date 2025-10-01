const { GoogleGenerativeAI } = require("@google/generative-ai");
const Message = require("../model/message");
const TEST_CASES = require("../utils/constants").TEST_CASES;

// Gemini setup
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

// Fetch history for a session
async function getHistory(problemId, type) {
  return await Message.find({ problemId, type, status: "active" })
    .sort({ timestamp: 1 }) // oldest first
    .lean()
    .exec();
}

// Convert MongoDB history to Gemini messages
async function buildMessages(history) {
  const messages = [
    {
      role: "User", // Gemini doesn’t accept "system" directly
      parts: [{ text: TEST_CASES }],
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

// Mark previous history as done
async function setHistoryDone(type, problemId) {
  try {
    const result = await History.updateMany(
      { type, problemId }, // filter
      { $set: { status: "done" } } // update
    );

    console.log(`✅ Updated ${result.modifiedCount} history records as done`);
    return result;
  } catch (err) {
    console.error("❌ Error updating history:", err);
    throw err;
  }
}

// Chat handler
async function testCaseAi(problemId, userMessage, stage, type) {
  try {
    // Save user message
    await Message.create({
      problemId: problemId,
      role: "user",
      type: type,
      content: userMessage,
      status: "active",
      timestamp: new Date(),
    });

    // Fetch history (some may be summarized now)
    let history = [];
    if (stage === "initial" && type === "testcases") {
      await setHistoryDone(type, problemId);
    } else {
      history = await getHistory(problemId, type);
    }

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
      status: "active",
      timestamp: new Date(),
    });

    return { aiMessage };
  } catch (error) {
    console.error("Error in testCaseAi:", error);
    return "Sorry, something went wrong. Please try again later.";
  }
}

module.exports = { testCaseAi };
