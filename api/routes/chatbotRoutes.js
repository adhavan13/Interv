const express = require("express");
const { simulateInterview } = require("../controllers/interviewSimulation");
const router = express.Router();

router.post("/chat", simulateInterview);

module.exports = router;
