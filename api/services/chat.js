const Session = require("../models/Session");
class StageManager {
  constructor() {
    this.stageCompletionCriteria = {
      understanding: {
        keywords: ["problem", "input", "output", "return", "find"],
        minLength: 20,
        checkFunction: (message) => {
          return (
            message.toLowerCase().includes("problem") && message.length > 20
          );
        },
      },
      constraints: {
        keywords: ["constraint", "edge case", "empty", "null", "bounds"],
        checkFunction: (message) => {
          const lowerMsg = message.toLowerCase();
          return lowerMsg.includes("constraint") || lowerMsg.includes("edge");
        },
      },
      approach: {
        keywords: ["approach", "solution", "algorithm", "hashmap", "sort"],
        checkFunction: (message) => {
          const lowerMsg = message.toLowerCase();
          return (
            lowerMsg.includes("approach") || lowerMsg.includes("algorithm")
          );
        },
      },
      pseudocode: {
        keywords: ["step", "first", "then", "loop", "iterate"],
        checkFunction: (message) => {
          const lowerMsg = message.toLowerCase();
          return (
            (lowerMsg.includes("step") || lowerMsg.includes("first")) &&
            message.length > 30
          );
        },
      },
      coding: {
        keywords: ["def", "function", "return", "for", "while"],
        checkFunction: (message) => {
          return /def\s+\w+|function\s+\w+|class\s+\w+/.test(message);
        },
      },
      analysis: {
        keywords: ["time", "space", "complexity", "O(", "big o"],
        checkFunction: (message) => {
          const lowerMsg = message.toLowerCase();
          return lowerMsg.includes("complexity") || message.includes("O(");
        },
      },
    };
  }

  getNextStage(currentStage) {
    const currentIndex = STAGE_FLOW.indexOf(currentStage);
    if (currentIndex === -1 || currentIndex === STAGE_FLOW.length - 1) {
      return null;
    }
    return STAGE_FLOW[currentIndex + 1];
  }

  shouldAdvanceStage(currentStage, userMessage, botResponse) {
    const criteria = this.stageCompletionCriteria[currentStage];
    if (!criteria) return false;

    const userSatisfiesCriteria = criteria.checkFunction(userMessage);
    const botAdvancing = this.isBotAdvancingStage(botResponse, currentStage);

    return userSatisfiesCriteria && botAdvancing;
  }

  isBotAdvancingStage(botResponse, currentStage) {
    const advanceKeywords = {
      understanding: ["constraints", "edge cases"],
      constraints: ["approach", "how would you solve"],
      approach: ["pseudocode", "outline", "step by step"],
      pseudocode: ["code", "implement", "start coding"],
      coding: ["complexity", "time complexity", "space complexity"],
      analysis: ["great", "good job", "report", "summary"],
    };

    const keywords = advanceKeywords[currentStage];
    if (!keywords) return false;

    const lowerBotResponse = botResponse.toLowerCase();
    return keywords.some((keyword) => lowerBotResponse.includes(keyword));
  }

  async updateStageProgress(sessionId, stage, context = {}) {
    const session = await Session.findOne({ sessionId });
    if (!session) throw new Error("Session not found");

    // Add stage progress
    session.stageProgress.push({
      stage: stage,
      completedAt: new Date(),
      context: context,
      performance_score: this.calculateStageScore(stage, context),
    });

    session.currentStage = stage;
    session.lastUpdated = new Date();

    await session.save();
    return session;
  }
}

module.exports = StageManager;
