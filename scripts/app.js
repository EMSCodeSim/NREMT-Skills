document.addEventListener('DOMContentLoaded', () => {
  let scenarioRunning = false;
  let micActive = false;
  let patientGender = "male";
  const micButton = document.getElementById('mic-button');
  window.hasSpoken = false;

  // Preload voices for TTS
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

    await getAIResponseStream("Do you have chest pain?", "patient");
  } catch (err) {
    appendMessage("System", `⚠️ Scenario load error: ${err.message}`);
  }
}

function endScenario() {
  appendMessage("System", "🔴 Scenario ended.");
  const chatBox = document.getElementById('chat-box');
  chatBox.innerHTML = ''; // Clear conversation
}
