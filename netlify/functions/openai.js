const fetch = require('node-fetch');

exports.handler = async (event) => {
  try {
    const { userInput } = JSON.parse(event.body);

    // Validate input
    if (!userInput) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "User input is required" }),
      };
    }

    // Use OpenAI API key from environment variables
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

    const response = await fetch('https://api.openai.com/v1/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'text-davinci-003',
        prompt: `You are roleplaying as a real patient in an EMS medical emergency simulation. Respond like a human patient. ${userInput}`,
        max_tokens: 100,
        temperature: 0.7,
      }),
    });

    const result = await response.json();

    return {
      statusCode: 200,
      body: JSON.stringify({ response: result.choices[0].text.trim() }),
    };
  } catch (error) {
    console.error('Error during OpenAI API call:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal Server Error' }),
    };
  }
};
