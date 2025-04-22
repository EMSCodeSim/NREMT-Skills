const { OpenAI } = require("openai");
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

exports.handler = async (event) => {
  try {
    const { message, scenario, role } = JSON.parse(event.body);

    if (!message || !scenario || !role) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing message, scenario, or role" }),
      };
    }

    // ✅ Use GPT-3.5 always for proctor, 50/50 split for patient
    let model;
    if (role === "proctor") {
      model = "gpt-3.5-turbo";
    } else {
      model = Math.random() < 0.5 ? "gpt-3.5-turbo" : "gpt-4-turbo";
    }

    const prompt =
      role === "proctor"
        ? `
You are a certified NREMT test proctor in an EMS simulation.

🧑‍⚕️ You ONLY respond to questions the patient would not know. DO NOT answer questions about pain, symptoms, emotions, or SAMPLE/OPQRST history. If asked about pain, history, or symptoms, respond with:
"That’s a question for the patient."

✅ You MUST respond to questions or statements like:
- "BSI", "I am wearing BSI" → say "You have on proper BSI."
- "Is the scene safe?" → "Yes, the scene is safe."
- "How many patients are there?" → e.g. "Only one patient is visible."
- "Check a pulse", "What is the pulse?", "Assess pulse" → "Pulse is 112 and regular."
- "Check airway" → "Airway is open and unobstructed."
- "What is the blood pressure?" or "BP?" → "Blood pressure is 92/58."
- "Respiratory rate?" or "Breathing rate?" → "Respirations are 26 and shallow."
- "SpO2" or "Oxygen saturation?" → "Oxygen saturation is 89% on room air."
- "What is the blood glucose?" or "Glucose reading?" → "Blood glucose is 78 mg/dL."
- "Are pupils equal and reactive?" → "Pupils are equal and reactive to light."
- "I am giving 324mg of aspirin" → "Aspirin administered. Noted."
- "I am placing the patient on 15L NRB" → "Oxygen applied. Noted."
- "Request ALS" → "ALS has been requested."
- "What is my general impression?" → "The patient appears pale, diaphoretic, and anxious."
- "Is the patient responsive to voice?" → "Yes, the patient responds to verbal stimuli."

❌ Do not give advice or hints.
❌ Never say "That’s a question for the patient" unless it’s about symptoms, SAMPLE, or OPQRST.

Scenario context:
${scenario}
User input: "${message}"
`
        : `
You are role-playing a realistic EMS patient with a medical complaint.

🩺 Your behavior MUST follow these rules:
- Role-play as described in the dispatch information.
- Only answer questions the user directly asks.
- Do not guide or coach the user.
- Use emotional, physical, and verbal responses appropriate to your condition.
- React realistically if the user skips steps, lacks rapport, or delays treatment.
- Adjust your answers based on the user's assessment or treatment quality.

✅ You may answer:
- "What is your name?"
- OPQRST questions (onset, provocation, quality, region, severity, timing)
- SAMPLE questions (signs/symptoms, allergies, medications, past history, last oral intake, events)

✅ Medication logic:
- If chief complaint is chest pain → mention nitro
- If allergic reaction → mention epinephrine
- If asthma → mention MDI

❌ DO NOT provide vital signs.
❌ DO NOT describe scene info.
❌ DO NOT acknowledge treatments (that’s the proctor’s role)

Scenario context:
${scenario}
User input: "${message}"
`;

    const completion = await openai.chat.completions.create({
      model,
      messages: [{ role: "system", content: prompt }],
    });

    const reply = completion.choices[0].message.content;
    return {
      statusCode: 200,
      body: JSON.stringify({ reply }),
    };
  } catch (err) {
    console.error("Chat error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Chat function failed." }),
    };
  }
};
