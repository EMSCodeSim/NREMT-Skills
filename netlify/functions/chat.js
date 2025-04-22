const { OpenAI } = require("openai");
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

let patientMessageCount = 0; // Track number of patient responses

exports.handler = async (event) => {
  try {
    let { message, scenario, role } = JSON.parse(event.body);

    if (!message || !scenario) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing message or scenario" }),
      };
    }

    // Step 1: Phrase match, then AI classify if needed
    if (!role || role === "auto") {
      const phraseMatch = detectProctorIntent(message) ? "proctor" : null;
      if (phraseMatch) {
        role = phraseMatch;
      } else {
        role = await classifyRole(message);
        if (!role) role = "patient";
      }
    }

    // Step 2: Model logic
    let model;
    if (role === "proctor") {
      model = "gpt-3.5-turbo";
    } else {
      patientMessageCount++;
      model = patientMessageCount <= 2
        ? "gpt-4-turbo"
        : Math.random() < 0.05 ? "gpt-4-turbo" : "gpt-3.5-turbo";
    }

    // Step 3: Prompt
    const prompt =
      role === "proctor"
        ? `
You are a certified NREMT test proctor in an EMS simulation.

🧑‍⚕️ Respond only to questions the patient would not know. If asked about pain, symptoms, or OPQRST/SAMPLE, respond: "That’s a question for the patient."

✅ Respond to:
- "BSI" → "You have on proper BSI."
- "Is the scene safe?" → "Yes, the scene is safe."
- "How many patients?" → "Only one patient is visible."
- "Pulse?" → "Pulse is 112 and regular."
- "Check airway" → "Airway is open and unobstructed."
- "BP?" → "Blood pressure is 92/58."
- "Respirations?" → "Respiratory rate is 26 and shallow."
- "SpO2?" → "Oxygen saturation is 89% on room air."
- "Blood glucose?" → "Blood glucose is 78 mg/dL."
- "Pupils?" → "Pupils are equal and reactive to light."
- "Give 324mg ASA" → "Aspirin administered. Noted."
- "15L O2 NRB" → "Oxygen applied. Noted."
- "Request ALS" → "ALS has been requested."
- "General impression" → "The patient appears pale, diaphoretic, and anxious."
- "Responsive to" → "The patient responds to verbal stimuli."

❌ Never give coaching or OPQRST/SAMPLE responses.
Scenario context:
${scenario}
User input: "${message}"
`
        : `
You are role-playing a realistic EMS patient with a medical complaint.

🩺 Respond as described in the dispatch. Use realistic emotional and physical behavior. Only respond to questions directly asked.

✅ Answer:
- "What is your name?"
- OPQRST and SAMPLE questions
- If chest pain: mention nitro
- If allergic reaction: mention EpiPen
- If asthma: mention MDI

❌ Never give vitals, never describe the scene, never acknowledge treatments.

Adjust your tone based on how the user treats you.

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

// 🔍 Phrase-based routing
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

// 🧠 GPT-3.5-based AI classifier
async function classifyRole(message) {
  const classificationPrompt = `
You are assisting in a simulation. Decide who should respond.

- If it's about symptoms, history, pain, medications, OPQRST/SAMPLE → respond "patient"
- If it's about vitals, scene, treatments, BSI, general impression → respond "proctor"

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
