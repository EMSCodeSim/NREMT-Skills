// Use dynamic import for OpenAI v4+ inside Netlify's Node.js environment
const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

exports.handler = async (event) => {
  try {
    const { message, role, context } = JSON.parse(event.body);

    console.log("🔥 Incoming Request");
    console.log("Message:", message);
    console.log("Role:", role);
    console.log("Context preview:", context?.substring(0, 100) + "...");

    if (!message || !role || !context) {
      return {
        statusCode: 400,
        body: JSON.stringify({ response: "Missing message, role, or context." }),
      };
    }

    const model = role === "proctor" ? "gpt-3.5-turbo" : "gpt-4-turbo";

    const chat = await openai.chat.completions.create({
      model,
      messages: [
        { role: "system", content: context },
        { role: "user", content: message },
      ],
      temperature: 0.7,
    });

    const reply = chat?.choices?.[0]?.message?.content?.trim();

    console.log("✅ OpenAI Reply:", reply);

    return {
      statusCode: 200,
      body: JSON.stringify({
        response: reply || "⚠️ GPT returned no message.",
      }),
    };
  } catch (err) {
    console.error("❌ OpenAI Error:", err.message);
    return {
      statusCode: 500,
      body: JSON.stringify({
        response: "There was an error contacting ChatGPT.",
        error: err.message,
      }),
    };
  }
};
