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

    let systemPrompt = "";
    let model = "";

    if (role === "proctor") {
      systemPrompt = `You are the EMS proctor. You provide vitals, scene details, or number of patients upon request. Be brief, accurate, and respond only with proctor-level information.`;
      model = "gpt-3.5-turbo";
    } else {
      systemPrompt = `You are a 58-year-old male experiencing crushing chest pain radiating to your jaw and left arm. You are diaphoretic and anxious. Respond as a patient would, emotionally and believably. Do not give out medical readings unless directly told by the proctor. Answer based only on what you would realistically know or feel.`;
      model = "gpt-4-turbo";
    }

    const response = await openai.createChatCompletion({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ],
      temperature: 0.7,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ response: response.data.choices[0].message.content }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
