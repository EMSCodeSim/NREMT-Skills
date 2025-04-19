const OpenAI = require("openai");
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

exports.handler = async function(event) {
  try {
    const { transcript } = JSON.parse(event.body);

    const gradingPrompt = `
You are a certified NREMT test proctor grading a student EMT-B on the medical assessment skill station.

Score the student's performance using the NREMT-B checklist based on the following transcript of their actions and dialogue:
-------------
${transcript}
-------------

Your output should follow this format:

Score: __ / 48

✅ Done Correctly:
- List of all correct actions

❌ Missed Items:
- List of what was skipped or done incorrectly

📌 Tips for Improvement:
- 2 to 3 personalized suggestions to improve next time

❗ Critical Failures:
- Only if applicable, list any NREMT-critical fail reasons (e.g., failure to give oxygen, skipped scene safety, delayed transport, etc.)

Be strict but constructive and accurate.
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
