const OpenAI = require("openai");
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

exports.handler = async function(event) {
  try {
    const { transcript } = JSON.parse(event.body);

    const gradingPrompt = `
You are a certified NREMT test proctor grading a student EMT-B on the medical assessment skill station.

Review the scenario transcript:
-------------
${transcript}
-------------

Provide an easy-to-read final report with these exact headings:

Score: __ / 48

✅ Done Correctly:
(List what the user completed correctly)

❌ Missed Items:
(List what was skipped or incorrectly performed)

📌 Tips for Improvement:
(2–3 personalized improvement suggestions)

❗ Critical Failures:
(If any critical NREMT fails occurred, explain them. Otherwise say 'None')

Be clear, structured, and objective.
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        { role: "system", content: gradingPrompt }
      ],
      temperature: 0.3
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ feedback: completion.choices[0].message.content })
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Grading failed", details: err.message })
    };
  }
};
