const { Configuration, OpenAIApi } = require("openai");

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

exports.handler = async (event) => {
  try {
    const { message, role } = JSON.parse(event.body);

    if (!message || !role) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing message or role." }),
      };
    }

    const systemPrompt =
      role === "proctor"
        ? `You are the EMS proctor. You provide vitals, scene details, or number of patients upon request. Be brief, accurate, and respond only with proctor-level information.`
        : `You are the EMS patient in a training scenario. Respond to questions as the patient would. Use emotional and descriptive details like a real patient. Do not provide proctor information such as vitals unless asked explicitly by the proctor.`;

    const model = role === "proctor" ? "gpt-3.5-turbo" : "gpt-4-turbo";

    const completion = await openai.createChatCompletion({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ],
    });

    const reply = completion.data.choices[0].message.content.trim();

    return {
      statusCode: 200,
      body: JSON.stringify({ response: reply }),
    };
  } catch (error) {
    console.error("OpenAI API Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "OpenAI API error" }),
    };
  }
};
