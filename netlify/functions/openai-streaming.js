const { OpenAI } = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

exports.handler = async function (event, context) {
  try {
    const { message, role } = JSON.parse(event.body || "{}");

    if (!message || !role) {
      return {
        statusCode: 400,
        body: "Missing message or role."
      };
    }

    const contextPrompt =
      role === "proctor"
        ? "You are a certified NREMT test proctor. Only answer procedural questions the patient wouldn't know."
        : "You are a simulated EMS patient. Stay in character and answer naturally.";

    const model = role === "proctor" ? "gpt-3.5-turbo" : "gpt-4";

    const chatCompletion = await openai.chat.completions.create({
      model,
      messages: [
        { role: "system", content: contextPrompt },
        { role: "user", content: message }
      ],
      stream: false
    });

    const reply = chatCompletion.choices[0].message.content;
    return {
      statusCode: 200,
      body: reply
    };
  } catch (err) {
    console.error("❌ OpenAI API error:", err);
    return {
      statusCode: 500,
      body: "OpenAI error: " + err.message
    };
  }
};
