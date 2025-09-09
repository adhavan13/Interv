const { chatWithAI } = require("../services/InterviewChat");

async function simulateInterview(req, res) {
  try {
    const { role, content, problemId } = req.body;
    if (!role || !content || !problemId) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    console.log("Received message:", { role, problemId, content });
    const response = await chatWithAI(problemId, content);
    res.status(201).json({ message: response });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
    console.log("Error receiving message:", error);
  }
}

module.exports = { simulateInterview };
