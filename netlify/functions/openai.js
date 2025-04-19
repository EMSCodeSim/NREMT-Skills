const { OpenAI } = require("openai");
const proctorPrompt = require("../../scenarios/chest_pain_001/proctor.json");
const patientPrompt = require("../../scenarios/chest_pain_001/patient.json");
const vitals = require("../../scenarios/chest_pain_001/vitals.json");

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const sessionMemory = {
  gaveASA: false,
  gaveOxygen: false,
  askedBP: false,
  askedPulse: false,
  askedBGL: false,
  askedLungSounds: false
};

function getRoleConfidence(message) {
  const lower = message.toLowerCase();

  const highConfidence = [
    /\bblood pressure\b/, /\bpulse\b/, /\brespirations?\b/, /\bo2\b/, /\bbgl\b/,
    /\bo2 sat(uration)?\b/, /\bapply (aed|oxygen)\b/, /\bgive\b/, /\badminister\b/,
    /\bpupils\b/, /\bscene safe\b/, /\basa\b/, /\bnitro\b/,
    /\bhow many patients\b/, /\bstart an iv\b/, /\btransport\b/, /\bcollar\b/
  ];

  const patientOnly = [
    /\bmedical history\b/, /\bpast medical history\b/, /\bhistory of\b/,
    /\bpain\b/, /\bsymptom\b/, /\bfeel\b/, /\bwhere does it hurt\b/
  ];

  for (const pattern of patientOnly) {
    if (pattern.test(lower)) return { role: "patient", confidence: "High" };
  }

  for (const pattern of highConfidence) {
    if (pattern.test(lower)) return { role: "proctor", confidence: "High" };
  }

  return { role: "patient", confidence: "Low" }; // Default to patient
}

function updateMemory(message) {
  const lower = message.toLowerCase();
  if (lower.includes("324") || lower.includes("asa")) sessionMemory.gaveASA = true;
  if (lower.includes("oxygen")) sessionMemory.gaveOxygen = true;
  if (lower.includes("blood pressure")) sessionMemory.askedBP = true;
  if (lower.includes("pulse")) sessionMemory.askedPulse = true;
  if (lower.includes("bgl") || lower.includes("blood sugar")) sessionMemory.askedBGL = true;
  if (lower.includes("lung sounds") || lower.includes("breath sounds")) sessionMemory.askedLungSounds = true;
}

function injectVitals(template) {
  return template
    .replace(/\[BP\]/g, vitals.blood_pressure)
    .replace(/\[PULSE\]/g, vitals.pulse)
    .replace(/\[RESPIRATIONS\]/g, vitals.respirations)
    .replace(/\[O2SAT\]/g, vitals.oxygen_saturation)
    .replace(/\[BGL\]/g, vitals.bgl)
    .replace(/\[LUNG_SOUNDS\]/g, vitals.lung_sounds || "Clear and equal bilaterally");
}

exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body);
    const { message, role: manualRole, context } = body;

    if (!message) {
      return { statusCode: 400, body: JSON.stringify({ response: "Missing message." }) };
    }

    // Determine role automatically unless specified
    const routing = manualRole ? { role: manualRole, confidence: "Manual" } : getRoleConfidence(message);
    const role = routing.role;

    updateMemory(message);

    let systemPrompt = "";
    if (role === "proctor") {
      systemPrompt = proctorPrompt.content
        ? injectVitals(proctorPrompt.content)
        : "You are a NREMT test proctor. Respond with vitals, unseen cues, and treatment confirmations.";
    } else {
      systemPrompt = patientPrompt.content
        ? patientPrompt.content
        : "You are a patient experiencing a medical emergency. Respond as realistically and emotionally as possible.";
    }

    const model = role === "patient" ? "gpt-4-turbo" : "gpt-3.5-turbo";

    const chat = await openai.chat.completions.create({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message }
      ],
      temperature: 0.7,
      max_tokens: 300
    });

    const reply = chat.choices[0]?.message?.content || "No response generated.";
    return {
      statusCode: 200,
      body: JSON.stringify({ response: reply, role })
    };
  } catch (err) {
    console.error("❌ openai.js error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ response: "Internal server error." })
    };
  }
};
