const { Configuration, OpenAIApi } = require("openai");

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY, // Ensure this is set in Netlify environment
});

const openai = new OpenAIApi(configuration);

exports.handler = async (event) => {
  try {
    const { message, role, context } = JSON.parse(event.body);

    // Validate input
    if (!message || !role || !context) {
      return {
        statusCode: 400,
        body: JSON.stringify({ response: "Missing message, role, or context." }),
      };
    }

    // Decide which model to use
    const model = role === "proctor" ? "gpt-3.5-turbo" : "gpt-4-turbo";

    // Call OpenAI API
    const completion = await openai.createChatCompletion({
      model,
      messages: [
        { role: "system", content: context },
        { role: "user", content: message }
      ],
      temperature: 0.7
    });

    const reply = completion?.data?.choices?.[0]?.message?.content?.trim();

    return {
      statusCode: 200,
      body: JSON.stringify({
        response: reply || "I'm sorry, I didn’t understand that."
      }),
    };

  } catch (error) {
    console.error("OpenAI API error:", error.message);

    return {
      statusCode: 500,
      body: JSON.stringify({
        response: "There was an error processing your request. Please try again."
      }),
    };
  }
};
