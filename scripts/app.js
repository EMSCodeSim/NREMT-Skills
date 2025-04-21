// ✅ Global variables
let patientGender = "male";
let scenarioContext = "";

document.addEventListener('DOMContentLoaded', () => {
  let scenarioRunning = false;
  let micActive = false;
  const micButton = document.getElementById('mic-button');
  window.hasSpoken = false;

  // Preload voices
  window.speechSynthesis.onvoiceschanged = () => {
    window.speechSynthesis.getVoices();
  };

  document.body.addEventListener('click', () => {
    window.hasSpoken = true;
  }, { once: true });

  document.getElementById('scenario-button').addEventListener('click', () => {
    scenarioRunning = !scenarioRunning;
    document.getElementById('scenario-button').textContent = scenarioRunning ? 'End Scenario' : 'Start Scenario';
    if (scenarioRunning) startScenario();
    else endScenario();
  });

  document.getElementById('end-button').addEventListener('click', () => {
    scenarioRunning = false;
    document.getElementById('scenario-button').textContent = 'Start Scenario';
    endScenario();
  });

  document.getElementById('send-button').addEventListener('click', async () => {
    const input = document.getElementById('user-input');
    const message = input.value.trim();
    if (message === "") return;

    appendMessage("You", message, "User");
    input.value = "";

    const role = detectProctorIntent(message) ? "proctor" : "patient";
    const reply = await getAIResponse(message, scenarioContext, role);

    appendMessage(role === "proctor" ? "Proctor" : "Patient", reply, capitalize(role));
    speakWithOpenAI(reply);
  });

  micButton.addEventListener('click', () => {
    micActive = !micActive;
    micButton.classList.toggle("active", micActive);
    appendMessage("System", micActive ? "🎤 Listening..." : "🛑 Mic off.");
  });
});

async function startScenario() {
  appendMessage("System", "🟢 Scenario started.");
  try {
    const response = await fetch("/scenarios/chest_pain_001/scenario.json");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const scenario = await response.json();

    patientGender = (scenario.gender || "male").toLowerCase();
    scenarioContext = `Patient: ${scenario.dispatch} ${scenario.scene_description}`;

    appendMessage("Dispatch", `🚑 Dispatch: ${scenario.dispatch}`, "Dispatch");
    appendMessage("Scene", `📍 Scene: ${scenario.scene_description}`);

    const img = document.createElement('img');
    img.src = "/scenarios/chest_pain_001/patient_1.jpg";
    img.alt = "Patient";
    img.style.maxWidth = "100%";
    img.style.marginTop = "10px";
    const chatBox = document.getElementById('chat-box');
    chatBox.appendChild(img);
    chatBox.scrollTop = chatBox.scrollHeight;

    const intro = "I'm having a crushing pain in my chest... it came on suddenly.";
    appendMessage("Patient", intro, "Patient");
    speakWithOpenAI(intro);
  } catch (err) {
    appendMessage("System", `⚠️ Scenario load error: ${err.message}`);
  }
}

function endScenario() {
  appendMessage("System", "🔴 Scenario ended.");
  const chatBox = document.getElementById('chat-box');
  chatBox.innerHTML = '';
}

function appendMessage(sender, message, role = "System") {
  const chatBox = document.getElementById('chat-box');
  const bubble = document.createElement('div');
  bubble.classList.add('chat-bubble', role.toLowerCase());
  bubble.innerHTML = `<strong>${sender}:</strong> ${message}`;
  chatBox.appendChild(bubble);
  chatBox.scrollTop = chatBox.scrollHeight;
}

async function speakWithOpenAI(text) {
  try {
    const response = await fetch("/.netlify/functions/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input: text, voice: "nova" })
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
  return (
    lower.includes("bp") ||
    lower.includes("blood pressure") ||
    lower.includes("vitals") ||
    lower.includes("what is the") ||
    lower.includes("i am giving") ||
    lower.includes("i want to give") ||
    lower.includes("als") ||
    lower.includes("c-spine") ||
    lower.includes("oxygen")
  );
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
