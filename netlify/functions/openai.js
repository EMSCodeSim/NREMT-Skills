const { Configuration, OpenAIApi } = require("openai");

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

exports.handler = async (event) => {
  try {
    const { message, role, context } = JSON.parse(event.body);

    console.log("🔥 Incoming Request ------------------------");
    console.log("Message:", message);
    console.log("Role:", role);
    console.log("Context preview:", context?.slice(0, 100) + "...");

    if (!message || !role || !context) {
      console.log("❌ Missing message, role, or context");
      return {
        statusCode: 400,
        body: JSON.stringify({
          response: "Error: Missing required fields.",
        }),
      };
    }

    const model = role === "proctor" ? "gpt-3.5-turbo" : "gpt-4-turbo";
    console.log(`🧠 Model selected: ${model}`);

    const completion = await openai.createChatCompletion({
      model,
      messages: [
        { role: "system", content: context },
        { role: "user", content: message },
      ],
      temperature: 0.7,
    });

    const reply = completion?.data?.choices?.[0]?.message?.content?.trim();
    console.log("✅ GPT Reply:", reply);

    return {
      statusCode: 200,
      body: JSON.stringify({
        response: reply || "I'm sorry, I didn’t understand that.",
      }),
    };
  } catch (error) {
    console.error("🚨 OpenAI API Error:", error.message);

    return {
      statusCode: 500,
      body: JSON.stringify({
        response: "There was an error contacting ChatGPT.",
        error: error.message,
      }),
    };
  }
};
