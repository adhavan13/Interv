async function chatWithAI(problemId, userMessage) {
  try {
    const result = await model.generateContent({ contents: messages });
    const aiMessage = result.response.candidates[0].content.parts[0].text;

    console.log(aiMessage);

    // return { aiMessage, flag };
  } catch (error) {
    console.error("Error in chatWithAI:", error);
    return "Sorry, something went wrong. Please try again later.";
  }
}
