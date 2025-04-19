const { OpenAI } = require("openai");
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const skillSheet = `
You are an NREMT test proctor scoring a Basic EMT medical assessment using the NREMT medical skill sheet.
Grade the transcript and return:
1. Total points (out of 48)
2. Items done correctly
3. Items missed
4. Any critical failures (and why)
Return this as a JSON object: { score: #, correct: [], missed: [], criticalFails: [] }
`;

exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body);
    const { transcript } = body;

    if (!transcript) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing transcript." })
      };
    }

    const chat = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: skillSheet },
        { role: "user", content: transcript }
      ],
      temperature: 0.3,
      max_tokens: 500
    });

    const feedback = chat.choices[0]?.message?.content || "{}";
    const parsed = JSON.parse(feedback);

    return {
      statusCode: 200,
      body: JSON.stringify({
        ...parsed,
        transcript // pass it forward for feedback use
      })
    };
  } catch (err) {
    console.error("❌ gradeScenario error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Grading failed." })
    };
  }
};
