const { chatWithAI } = require("../services/chat");

async function chat(req, res) {
  try {
    const { role, content, sessionId } = req.body;
    if (!role || !content || !sessionId) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    console.log("Received message:", { role, sessionId });
    const response = await chatWithAI(sessionId, content);
    res.status(201).json({ message: response });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
    console.log("Error receiving message:", error);
  }
}

module.exports = { chat };
