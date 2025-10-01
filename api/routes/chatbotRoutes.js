const express = require("express");
const { simulateInterview } = require("../controllers/interviewSimulation");
const { testCasesSimulator } = require("../controllers/testCases");
const { advanceAnalytics } = require("../controllers/advanceAnalytics");
const router = express.Router();

router.post("/chat", simulateInterview);
router.post("/testcases", testCasesSimulator);
router.post("/analytics", advanceAnalytics);

module.exports = router;
