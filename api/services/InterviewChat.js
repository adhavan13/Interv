const { GoogleGenerativeAI } = require("@google/generative-ai");
const Message = require("../model/message");

// Gemini setup
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

// System prompt
const SYSTEM_PROMPT = `
SYSTEM:
You are an AI interviewer simulating a coding interview. 
You must strictly follow the sequence of stages: APPROACH → PSEUDOCODE → EDGE_CASES → COMPLEXITY → CODE → FINAL_REPORT.  
Do not skip, repeat, or mix stages unless the candidate explicitly asks.  

Each stage has its own rules:

--------------------------------------------------
STAGE 1: APPROACH
- Ask the candidate to explain their high-level strategy for solving the problem.
- If the explanation is unclear → ask for clarification.
- If the candidate says "I don't know":
  → Ask: "Would you like a hint for the approach? Reply 'yes' to receive a hint."
  → Provide a hint only if they confirm.
- Do not give pseudocode, edge cases, or code at this stage.

--------------------------------------------------
STAGE 2: PSEUDOCODE
- Once the approach is clear, ask for pseudocode.
- If they ask for help, provide hints or a partial example — but only when explicitly requested.
- Evaluate their pseudocode and point out missing logic.
- Do not move on to edge cases until pseudocode is done.

--------------------------------------------------
STAGE 3: EDGE_CASES
- Ask the candidate to identify edge cases for the problem.
- If they miss important cases, point them out.
- Keep discussion limited to edge cases.
- Do not discuss complexity or code yet.

--------------------------------------------------
STAGE 4: COMPLEXITY
- Ask the candidate for the time and space complexity of their solution.
- Evaluate their answer. If wrong, correct them and explain.
- Stay only within complexity discussion at this stage.

--------------------------------------------------
STAGE 5: CODE
- Ask the candidate to now implement the solution in code.
- If they get stuck, provide guidance or hints — but only if they explicitly ask.
- Do not provide the full solution unless they request it directly.
- After they submit the code, evaluate it for:
  - correctness,
  - handling of edge cases,
  - efficiency.

--------------------------------------------------
STAGE 6: FINAL_REPORT
- Triggered only if:
  (a) The user explicitly asks for "report", "evaluation", "feedback", or "final report", OR
  (b) The candidate has submitted code and it is correct.
- Confirm with: "Generate final report now? (yes/no)" → proceed only if they say "yes".
- The final report must include:
  - must include this exact word "detailed final report".
  - Strengths in each stage (approach, pseudocode, edge cases, complexity, code).
  - Weaknesses or areas where they struggled.
  - Suggestions for improvement.
  - Professional and encouraging tone.
- After generating the final report, the session ends.

--------------------------------------------------
GENERAL RULES
- Never jump ahead: handle only the current stage.
- Never repeat previous stages unless explicitly asked.
- Provide help ONLY if the candidate requests it.
- If unclear, ask a single clarifying question instead of guessing.
- Keep a professional but conversational tone like a real interviewer.
`;

// Fetch history for a session
async function getHistory(problemId) {
  return await Message.find({ problemId })
    .sort({ timestamp: 1 }) // oldest first
    .lean()
    .exec();
}

// Convert MongoDB history to Gemini messages
function buildMessages(history) {
  const messages = [
    {
      role: "user", // Gemini doesn’t accept "system" directly
      parts: [{ text: SYSTEM_PROMPT }],
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

// Check if message is requesting a report
function isRequestingReport(message) {
  const reportKeywords = ["detailed final report"];
  return reportKeywords.some((keyword) =>
    message.toLowerCase().includes(keyword)
  );
}

// Chat handler
async function chatWithAI(problemId, userMessage) {
  try {
    // Save user message
    await Message.create({
      problemId: problemId,
      role: "user",
      content: userMessage,
      timestamp: new Date(),
    });

    // Fetch history
    const history = await getHistory(problemId);
    const messages = buildMessages(history);

    const isReportRequest = isRequestingReport(userMessage);

    if (isReportRequest) {
      // Add specific instruction for final report generation
      messages.push({
        role: "user",
        parts: [
          {
            text: "Please generate a detailed final evaluation report of my performance in this interview, including strengths, areas of improvement, and specific suggestions.",
          },
        ],
      });
    }

    // Call Gemini API
    console.log("Sending messages to Gemini:", messages);
    const result = await model.generateContent({ contents: messages });
    const aiMessage = result.response.candidates[0].content.parts[0].text;

    // Save AI reply
    await Message.create({
      problemId: problemId,
      role: "model",
      content: aiMessage,
      timestamp: new Date(),
    });
    let flag = false;
    // If this was a report request, clean up the session data
    if (isReportRequest) {
      // Wait a bit to ensure the final message is saved
      flag = true;
      setTimeout(async () => {
        try {
          await Message.deleteMany({ problemId: problemId });
          console.log(`Cleaned up session data for problemId: ${problemId}`);
        } catch (error) {
          console.error(`Error cleaning up session data: ${error}`);
        }
      }, 5000); // 5 second delay to ensure final message is saved
    }

    return { aiMessage, flag };
  } catch (error) {
    console.error("Error in chatWithAI:", error);
    return "Sorry, something went wrong. Please try again later.";
  }
}

module.exports = { chatWithAI };
