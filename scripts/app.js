let patientGender = "male";
let scenarioContext = "";
let currentPatientData = null;

document.addEventListener('DOMContentLoaded', () => {
  let scenarioRunning = false;

  const micButton = document.getElementById('mic-button');
  const scenarioBtn = document.getElementById('scenario-button');
  const endBtn = document.getElementById('end-button');
  const sendBtn = document.getElementById('send-button');
  const inputField = document.getElementById('user-input');
  const chatDisplay = document.getElementById('chat-display');

  window.hasSpoken = false;

  window.speechSynthesis.onvoiceschanged = () => {
    window.speechSynthesis.getVoices();
  };

  document.body.addEventListener('click', () => {
    window.hasSpoken = true;
  }, { once: true });

  scenarioBtn.addEventListener('click', async () => {
    scenarioRunning = !scenarioRunning;
    scenarioBtn.textContent = scenarioRunning ? 'End Scenario' : 'Start Scenario';
    if (scenarioRunning) {
      await startScenario();
    } else {
      endScenario();
    }
  });

  endBtn.addEventListener('click', () => {
    scenarioRunning = false;
    scenarioBtn.textContent = 'Start Scenario';
    endScenario();
  });

  sendBtn.addEventListener('click', async () => {
    const message = inputField.value.trim();
    if (message === "") return;

    appendMessage("You", message, "User");
    inputField.value = "";

    const role = detectProctorIntent(message) ? "proctor" : "patient";
    const reply = await getAIResponse(message, scenarioContext, role);

    appendMessage(role === "proctor" ? "Proctor" : "Patient", reply, capitalize(role));
    speakWithOpenAI(reply, role === "proctor" ? "alloy" : "nova");
  });

  micButton.addEventListener('click', () => {
    alert("Mic button clicked (speech-to-text coming soon)");
  });
});

async function startScenario() {
  appendMessage("System", "Scenario Started. Loading patient data...", "System");

  try {
    const data = await loadPatientData("scenarios/chest_pain_001/patient.json");
    currentPatientData = data;
    scenarioContext = data.context || "You are treating a patient with chest pain.";
    appendMessage("Dispatch", data.dispatch || "You are responding to a medical emergency.", "System");
  } catch (err) {
    appendMessage("System", "⚠️ Failed to load patient data.", "System");
    console.error("Patient load error:", err);
  }
}

function endScenario() {
  appendMessage("System", "Scenario Ended. Thank you.", "System");
}

async function loadPatientData(path) {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return await response.json();
}

function appendMessage(sender, text, role) {
  const msg = document.createElement("div");
  msg.className = `chat-bubble ${role.toLowerCase()}`;
  msg.innerHTML = `<strong>${sender}:</strong> ${text}`;
  document.getElementById("chat-display").appendChild(msg);
  msg.scrollIntoView({ behavior: "smooth" });
}

async function speakWithOpenAI(text, voice = "nova") {
  try {
    const response = await fetch("/.netlify/functions/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input: text, voice })
    });
    const arrayBuffer = await response.arrayBuffer();
    const blob = new Blob([arrayBuffer], { type: "audio/mpeg" });
    const audioURL = URL.createObjectURL(blob);
    new Audio(audioURL).play();
  } catch (err) {
    console.error("TTS error:", err);
  }
}

async function getAIResponse(message, scenario, role) {
  try {
    const response = await fetch("/.netlify/functions/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, scenario, role })
    });
    const data = await response.json();
    return data.reply || "Sorry, no response.";
  } catch (err) {
    console.error("Chat error:", err);
    return "Sorry, I couldn't understand that.";
  }
}

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

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
