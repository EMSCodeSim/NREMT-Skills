document.addEventListener('DOMContentLoaded', () => {
  let scenarioRunning = false;
  let micActive = false;
  let patientGender = "male";
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

  document.getElementById('send-button').addEventListener('click', () => {
    const input = document.getElementById('user-input');
    if (input.value.trim() !== '') {
      appendMessage("You", input.value, "User");
      input.value = '';
    }
  });

  micButton.addEventListener('click', () => {
    micActive = !micActive;
    micButton.classList.toggle("active", micActive);
    if (micActive) {
      appendMessage("System", "🎤 Listening...");
    } else {
      appendMessage("System", "🛑 Mic off.");
    }
  });
});

async function startScenario() {
  appendMessage("System", "🟢 Scenario started.");
  try {
    const response = await fetch("/scenarios/chest_pain_001/scenario.json");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const scenario = await response.json();
    patientGender = (scenario.gender || "male").toLowerCase();
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

    const line = "Do you have chest pain?";
    appendMessage("Patient", line, "Patient");
    speakWithOpenAI(line);
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
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        input: text,
        voice: "nova"
      })
    });
    const arrayBuffer = await response.arrayBuffer();
    const blob = new Blob([arrayBuffer], { type: "audio/mpeg" });
    const audioURL = URL.createObjectURL(blob);
    const audio = new Audio(audioURL);
    audio.play();
  } catch (err) {
    console.error("TTS error:", err);
  }
}
