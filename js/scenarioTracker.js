// 🔥 scenarioTracker.js — Tracks actions and triggers escalation
export const userActions = [];
export let vitals = {
  bp: "138/90",
  pulse: 108,
  rr: 20,
  spo2: 94,
  bgl: 120,
  skin: "pale, cool, diaphoretic",
  pupils: "equal, reactive",
};

export function trackAction(input) {
  userActions.push(input.toLowerCase());
  checkEscalation();
  updateVitals();
}

function checkEscalation() {
  const delays = userActions.length;

  if (delays >= 4 && !userActions.some(a => a.includes("oxygen"))) {
    injectProctorMessage("The patient begins breathing more rapidly and looks more distressed.");
  }

  if (delays >= 6 && !userActions.some(a => a.includes("asa") || a.includes("nitro"))) {
    injectProctorMessage("The patient appears to slump and becomes less responsive.");
  }
}

function updateVitals() {
  if (userActions.includes("oxygen")) {
    vitals.spo2 = 98;
    vitals.pulse = 100;
    vitals.skin = "warm, dry";
  }
