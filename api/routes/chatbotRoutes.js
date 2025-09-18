const express = require("express");
const { simulateInterview } = require("../controllers/interviewSimulation");
const { testCasesSimulator } = require("../controllers/testCases");
const router = express.Router();

router.post("/chat", simulateInterview);
router.post("/testcases", testCasesSimulator);

module.exports = router;
