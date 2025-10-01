const { testCaseAi } = require("../services/testCases");

async function testCasesSimulator(req, res) {
  try {
    const { role, content, problemId, stage, type } = req.body;
    if (!role || !content || !problemId || !stage || !type) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    console.log("Received message:", { role, problemId, content, stage, type });
    const response = await testCaseAi(problemId, content, stage, type);
    res.status(201).json({ message: response.aiMessage, flag: response.flag });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
    console.log("Error receiving message:", error);
  }
}

module.exports = { testCasesSimulator };
