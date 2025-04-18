const { Configuration, OpenAIApi } = require("openai");

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

exports.handler = async (event) => {
  try {
    const { message, role, context } = JSON.parse(event.body);

    console.log("🔥 Incoming Request");
    console.log("Message:", message);
    console.log("Role:", role);
    console.log("Context:", context?.substring(0, 100) + "...");

    if (!message || !role || !context) {
      return {
        statusCode: 400,
        body: JSON.stringify({ response: "Missing fields" }),
      };
    }

    const model = role === "proctor" ? "gpt-3.5-turbo" : "gpt-4-turbo";

    const completion = await openai.createChatCompletion({
      model,
      messages: [
        { role: "system", content: context },
        { role: "user", content: message }
      ],
      temperature: 0.7,
    });

    console.log("✅ OpenAI Raw Response:", JSON.stringify(completion.data, null, 2));

    const reply = completion?.data?.choices?.[0]?.message?.content?.trim();

    return {
      statusCode: 200,
      body: JSON.stringify({
        response: reply || "⚠️ GPT did not return a message."
      }),
    };

  } catch (err) {
    console.error("🚨 Error:", err.message);
    return {
      statusCode: 500,
      body: JSON.stringify({
        response: "Error: " + err.message
      }),
    };
  }
};
