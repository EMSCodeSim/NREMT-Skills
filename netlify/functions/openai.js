const { OpenAI } = require("openai");
const fs = require("fs");
const path = require("path");

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const sessionMemory = {
  gaveASA: false,
  gaveOxygen: false,
  askedBP: false,
  askedPulse: false,
  askedBGL: false,
  askedLungSounds: false
};

function loadJSON(relativePath) {
  try {
    const fullPath = path.resolve(__dirname, relativePath);
    return JSON.parse(fs.readFileSync(fullPath, "utf8"));
  } catch (err) {
    console.error(`Failed to load ${relativePath}:`, err);
    return {};
  }
}

const proctorPrompt = loadJSON("../../scenarios/chest_pain_001/proctor.json");
const patientPrompt = loadJSON("../../scenarios/chest_pain_001/patient.json");
const vitals = loadJSON("../../scenarios/chest_pain_001/vitals.json");

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

  return { role: "patient", confidence: "Low" };
}

function updateMemory
