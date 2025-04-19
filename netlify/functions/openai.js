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

function detectRole(message) {
  const lower = message.toLowerCase();
  const proctorTriggers = [
    "vitals", "blood pressure", "pulse", "respirations", "spo2", "pupils",
    "bgl", "skin", "transport", "asa", "nitro", "oxygen", "scene safe",
    "what are the", "what is the", "administer", "give", "aed"
  ];
  return proctorTriggers.some(kw => lower.includes(kw)) ? "proctor" : "patient";
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
    const { message } = body;

    const role = detectRole(message);
    updateMemory(message);

    let context = "";

    if (role === "proctor") {
      context = proctorPrompt.content
        ? injectVitals(proctorPrompt.content)
        : "You are a NREMT test proctor. Respond with vitals, unseen cues, and treatment confirmations.";
    } else {
      context = patientPrompt.content
        ? patientPrompt.content
        : "You are a patient experiencing a medical emergency. Respond only to appropriate questions like a real patient.";
    }

    const chat = await openai.chat.completions.create({
      model: role === "proctor" ? "gpt-3.5-turbo" : "gpt-4-turbo",
      messages: [
        { role: "system", content: context },
        { role: "user", content: message }
      ],
      temperature: 0.7
    });

    const reply = chat?.choices?.[0]?.message?.content;

    return {
      statusCode: 200,
      body: JSON.stringify({ response: reply })
    };
  } catch (err) {
    console.error("❌ Server Error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ response: "I'm sorry, something went wrong on the server." })
    };
  }
};
