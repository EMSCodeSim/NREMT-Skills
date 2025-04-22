const { OpenAI } = require("openai");
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

exports.handler = async (event) => {
  try {
    let { message, scenario, role } = JSON.parse(event.body);

    if (!message || !scenario) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing message or scenario" }),
      };
    }

    // Step 1: Phrase match for proctor role
    if (!role || role === "auto") {
      const phraseMatch = detectProctorIntent(message) ? "proctor" : null;
      if (phraseMatch) {
        role = phraseMatch;
      } else {
        // Step 2: Use GPT-3.5 to classify the role
        role = await classifyRole(message);
        if (!role) role = "patient"; // Step 3: fallback default
      }
    }

    // Step 4: Choose GPT model
    let model;
    if (role === "proctor") {
      model = "gpt-3.5-turbo";
    } else {
      model = Math.random() < 0.5 ? "gpt-3.5-turbo" : "gpt-4-turbo";
    }

    // Step 5: Set prompt for proctor/patient
    const prompt =
      role === "proctor"
        ? `
You are a certified NREMT test proctor in an EMS simulation.

🧑‍⚕️ You ONLY respond to questions the patient would not know. DO NOT answer questions about pain, symptoms, emotions, or SAMPLE/OPQRST history. If asked about those, respond:
"That’s a question for the patient."

✅ You MUST respond to questions or statements like:
- "BSI", "I am wearing BSI" → "You have on proper BSI."
- "Is the scene safe?" → "Yes, the scene is safe."
- "How many patients are there?" → "Only one patient is visible."
- "What is the pulse?" → "Pulse is 112 and regular."
- "Check airway" → "Airway is open and unobstructed."
- "What is the blood pressure?" → "Blood pressure is 92/58."
- "Respiratory rate?" → "Respirations are 26 and shallow."
- "SpO2?" → "Oxygen saturation is 89% on room air."
- "Blood glucose?" → "Blood glucose is 78 mg/dL."
- "Are pupils equal and reactive?" → "Pupils are equal and reactive to light."
- "I am giving 324mg aspirin" → "Aspirin administered. Noted."
- "Place patient on 15L NRB" → "Oxygen applied. Noted."
- "Request ALS" → "ALS has been requested."
- "General impression..." → "The patient appears pale, diaphoretic, and anxious."
- "Responsive to..." → "The patient responds to verbal stimuli."

❌ Do not coach the user.
❌ Do not say "That’s a question for the patient" unless it’s about symptoms or history.

Scenario context:
${scenario}
User input: "${message}"
`
        : `
You are role-playing a realistic EMS patient with a medical complaint.

🩺 Rules:
- Only answer direct questions.
- Do not guide or coach the user.
- Use realistic, emotional, physical, and verbal responses.
- React appropriately to skipped steps or lack of rapport.
- Adjust tone and details based on user’s quality of care.

✅ You may answer:
- Identity questions (e.g., "What’s your name?")
- OPQRST and SAMPLE history questions

✅ Medication logic:
- Chest pain → mention nitro
- Allergic reaction → mention epinephrine
- Asthma → mention MDI

❌ DO NOT give vitals
❌ DO NOT acknowledge treatments
❌ DO NOT describe the scene

Scenario:
${scenario}
User: "${message}"
`;

    // Step 6: Ask GPT for reply
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

// ✅ Phrase-based role detector
function detectProctorIntent(msg) {
  const lower = msg.toLowerCase();
  const keywords = [
    "bsi", "scene", "how many patients", "is this the only patient",
    "check pulse", "what is the pulse", "assess pulse", "check airway",
    "noi", "als", "asa", "324mg", "oxygen", "nrb",
    "general impression", "responsive to", "unresponsive",
    "diagnostics", "vitals", "blood pressure", "respiratory rate",
    "spo2", "glucose", "blood sugar", "pupils", "head"
  ];
  return keywords.some(keyword => lower.includes(keyword));
}

// ✅ GPT-3.5 role classifier
async function classifyRole(message) {
  const classificationPrompt = `
You are assisting in a simulation. Decide who should respond.

- If the message is about symptoms, history, medications, pain, SAMPLE, OPQRST → respond: "patient"
- If it is about vitals, scene safety, diagnostics, treatments, BSI → respond: "proctor"

Only respond with "patient" or "proctor".

Message: "${message}"
`;

  const result = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [{ role: "system", content: classificationPrompt }]
  });

  const roleGuess = result.choices[0].message.content.trim().toLowerCase();
  return roleGuess === "proctor" || roleGuess === "patient" ? roleGuess : null;
}
