const { chatWithAI } = require("../services/chat");

async function receiveMessage(req, res) {
  try {
    const { role, content, sessionId } = req.body;
    if (!role || !content || !sessionId) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    const response = chatWithAI(sessionId, content);
    res.status(201).json({ message: "Message received successfully" });
  } catch (error) {
    console.log("Error receiving message:", error);
  }
}

module.exports = { receiveMessage };
