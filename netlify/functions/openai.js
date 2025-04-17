const { Configuration, OpenAIApi } = require("openai");

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

exports.handler = async (event) => {
  try {
    const { message, role, context } = JSON.parse(event.body);

    if (!message || !role) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing message or role." }),
      };
    }

    const systemPrompt = role === "patient"
      ? context || "You are a simulated EMS patient. Only respond with what a patient would realistically say."
      : "You are the EMS proctor. Only respond with vitals or scene info when asked.";

    const model = role === "proctor" ? "gpt-3.5-turbo" : "gpt-4-turbo";

    const chatResponse = await openai.createChatCompletion({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ],
      temperature: 0.7,
    });

    const reply = chatResponse?.data?.choices?.[0]?.message?.content?.trim();

    return {
      statusCode: 200,
      body: JSON.stringify({ response: reply || "I'm sorry, I didn't understand that." }),
    };
  } catch (error) {
    console.error("OpenAI error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Server error: " + error.message }),
    };
  }
};
