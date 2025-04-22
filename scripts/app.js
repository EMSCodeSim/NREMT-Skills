let patientGender = "male";
let scenarioContext = "";

document.addEventListener('DOMContentLoaded', () => {
  let scenarioRunning = false;
  let micActive = false;
  const micButton = document.getElementById('mic-button');
  window.hasSpoken = false;

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
    speakWithOpenAI(reply, role);
  });

  // ✅ Mic logic using Web Speech API
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognition();
  recognition.lang = 'en-US';
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  micButton.addEventListener('click', () => {
    micActive = !micActive;
    micButton.classList.toggle("active", micActive);

    if (micActive) {
      appendMessage("System", "🎤 Listening...");
      recognition.start();
    } else {
      appendMessage("System", "🛑 Mic off.");
      recognition.stop();
    }
  });

  recognition.onresult = async (event) => {
    const transcript = event.results[0][0].transcript.trim();
    appendMessage("You", transcript, "User");

    const role = detectProctorIntent(transcript) ? "proctor" : "patient";
    const reply = await getAIResponse(transcript, scenarioContext, role);
    appendMessage(role === "proctor" ? "Proctor" : "Patient", reply, capitalize(role));
    speakWithOpenAI(reply, role);

    micActive = false;
    micButton.classList.remove("active");
  };

  recognition.onerror = (event) => {
    appendMessage("System", `⚠️ Mic error: ${event.error}`);
    micActive = false;
    micButton.classList.remove("active");
  };
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
    speakWithOpenAI(intro, "patient");
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

async function speakWithOpenAI(text, role = "patient") {
  try {
    const voice = role === "proctor" ? "alloy" : "fable";  // ✅ updated here
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
