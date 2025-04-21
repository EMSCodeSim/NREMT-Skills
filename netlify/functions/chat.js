const { OpenAI } = require("openai");
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

exports.handler = async (event) => {
  try {
    const { message, scenario, role } = JSON.parse(event.body);

    if (!message || !scenario || !role) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing message, scenario, or role" }),
      };
    }

    // Decide which model to use
    const model = role === "proctor" ? "gpt-3.5-turbo" : "gpt-4-turbo";

    const prompt = `
You are playing the role of a ${role} in an EMS simulation.

Scenario summary:
${scenario}

User message: "${message}"

Respond as the ${role}. Keep it realistic and appropriate for an EMS training simulation.
`;

    const completion = await openai.chat.completions.create({
      model,
      messages: [{ role: "system", content: prompt }],
    });

    const reply = completion.choices[0].message.content;

    return {
      statusCode: 200,
      body: JSON.stringify({ reply }),
    };
  } catch (err) {
    console.error("Chat error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Chat function failed." }),
    };
  }
};
