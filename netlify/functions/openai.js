const { Configuration, OpenAIApi } = require("openai");

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

exports.handler = async (event) => {
  try {
    const { message, role, context } = JSON.parse(event.body);

    if (!message || !role || !context) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing message, role, or context." }),
      };
    }

    // Choose model based on role
    const model = role === "proctor" ? "gpt-3.5-turbo" : "gpt-4-turbo";

    const systemPrompt = context;

    const completion = await openai.createChatCompletion({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message }
      ],
      temperature: 0.7,
    });

    const reply = completion?.data?.choices?.[0]?.message?.content?.trim() || "I'm sorry, I didn’t understand that.";

    return {
      statusCode: 200,
      body: JSON.stringify({ response: reply }),
    };
  } catch (err) {
    console.error("OpenAI API error:", err.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ response: "An error occurred while processing your request." }),
    };
  }
};
