const { OpenAI } = require("openai");
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body);
    const { score, correct, missed, criticalFails } = body;

    const summary = `
The user scored ${score}/48 points.
They did well on: ${correct.join(", ") || "None"}.
They missed: ${missed.join(", ") || "None"}.
Critical failures: ${criticalFails.join(", ") || "None"}.
Give 2–3 improvement tips and one short motivational sentence.
`;

    const chat = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        { role: "system", content: "You are a compassionate EMS instructor giving follow-up feedback." },
        { role: "user", content: summary }
      ],
      temperature: 0.6,
      max_tokens: 300
    });

    const response = chat.choices[0]?.message?.content || "No advice generated.";
    return {
      statusCode: 200,
      body: JSON.stringify({ feedback: response })
    };
  } catch (err) {
    console.error("❌ feedbackScenario error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Feedback generation failed." })
    };
  }
};
