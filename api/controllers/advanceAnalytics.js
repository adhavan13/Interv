const { advanceAnalyticsReport } = require("../services/advanceAnalytics");

async function advanceAnalytics(req, res) {
  try {
    const {
      role,
      content,
      problemId = "658. Find K Closest Elements",
    } = req.body;
    if (!role || !content || !problemId) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    console.log("Received message:", { role, problemId, content });
    const response = await advanceAnalyticsReport(content, problemId);
    res.status(201).json({ message: response.aiMessage, flag: response.flag });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
    console.log("Error receiving message:", error);
  }
}

module.exports = { advanceAnalytics };
