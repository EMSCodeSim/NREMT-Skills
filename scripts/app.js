let patientGender = "male";
let scenarioContext = "";
let currentPatientData = {
  name: "John Doe",
  age: 55,
  chiefComplaint: "Chest pain",
  dispatch: "You are responding to a 55-year-old male with chest pain at a private residence.",
  context: "You are treating a 55-year-old male experiencing substernal chest pain that radiates to the left arm."
};

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

  scenarioBtn.addEventListener('click', () => {
    scenarioRunning = !scenarioRunning;
    scenarioBtn.textContent = scenarioRunning ? 'End Scenario' : 'Start Scenario';
    if (scenarioRunning) {
      startScenario();
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

function startScenario() {
  appendMessage("System", "Scenario Started.", "System");
  scenarioContext = currentPatientData.context;
  appendMessage("Dispatch", currentPatientData.dispatch, "System");
}

function endScenario() {
  appendMessage("System", "Scenario Ended. Thank you.", "System");
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
