document.addEventListener('DOMContentLoaded', () => {
  let scenarioRunning = false;
  let micActive = false;

  document.getElementById('scenario-button').addEventListener('click', () => {
    scenarioRunning = !scenarioRunning;
    document.getElementById('scenario-button').textContent = scenarioRunning ? 'End Scenario' : 'Start Scenario';
    if (scenarioRunning) {
      startScenario();
    } else {
      endScenario();
    }
  });

  document.getElementById('end-button').addEventListener('click', () => {
    scenarioRunning = false;
    document.getElementById('scenario-button').textContent = 'Start Scenario';
    endScenario();
  });

  document.getElementById('send-button').addEventListener('click', async () => {
    const inputBox = document.getElementById('user-input');
    const input = inputBox.value.trim();
    if (input) {
      appendMessage("User", input);
      inputBox.value = '';

      const role = getRoleConfidence(input).role;
      const aiReply = await getAIResponse(input, role);
      appendMessage(role === "patient" ? "Patient" : "Proctor", aiReply);
    }
  });

  document.getElementById('mic-button').addEventListener('click', () => {
    micActive = !micActive;
    const micButton = document.getElementById('mic-button');
    micButton.classList.toggle('active', micActive);
    micButton.textContent = micActive ? '🎤 Listening...' : '🎤 Hold to Speak';
    // Placeholder for voice logic
  });

  function appendMessage(sender, message) {
    const chatBox = document.getElementById('chat-box');
    const messageEl = document.createElement('div');
    messageEl.classList.add('chat-message');
    messageEl.innerHTML = `<strong>${sender}:</strong> ${message}`;
    chatBox.appendChild(messageEl);
    chatBox.scrollTop = chatBox.scrollHeight;
  }

  async function startScenario() {
    appendMessage("System", "🟢 Scenario started.");

    try {
      const response = await fetch("/scenarios/chest_pain_001/scenario.json");
      const scenario = await response.json();

      appendMessage("Dispatch", `🚑 Dispatch: ${scenario.dispatch}`);
      appendMessage("Scene", `📍 Scene: ${scenario.scene_description || "Scene description not found."}`);

      const aiReply = await getAIResponse("Do you have chest pain?", "patient");
      appendMessage("Patient", aiReply);
    } catch (error) {
      console.error("Scenario loading failed:", error);
      appendMessage("System", "⚠️ Failed to load scenario.");
    }
  }

  function endScenario() {
    appendMessage("System", "🔴 Scenario ended.");
  }

  function getRoleConfidence(message) {
    const lower = message.toLowerCase();
    const proctorPatterns = [
      "blood pressure", "pulse", "respirations", "bgl", "oxygen",
      "lung sounds", "breath sounds", "saturation", "iv", "transport"
    ];
    const patientPatterns = [
      "pain", "symptoms", "feel", "where", "describe", "history", "allergies"
    ];

    if (patientPatterns.some(p => lower.includes(p))) return { role: "patient" };
    if (proctorPatterns.some(p => lower.includes(p))) return { role: "proctor" };
    return { role: "patient" }; // fallback
  }

  async function getAIResponse(message, role = "patient") {
    try {
      const response = await fetch("/.netlify/functions/openai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: message,
          role: role,
          context: "You are a simulated EMS patient. Respond appropriately."
        })
      });

      const data = await response.json();
      return data.response || "No response from AI.";
    } catch (error) {
      console.error("AI request failed:", error);
      return "⚠️ Error reaching AI.";
    }
  }
});
