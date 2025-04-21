document.addEventListener('DOMContentLoaded', () => {
  let scenarioRunning = false;
  let micActive = false;

  // Start or End Scenario
  document.getElementById('scenario-button').addEventListener('click', () => {
    scenarioRunning = !scenarioRunning;
    document.getElementById('scenario-button').textContent = scenarioRunning ? 'End Scenario' : 'Start Scenario';
    if (scenarioRunning) {
      startScenario();
    } else {
      endScenario();
    }
  });

  // Manual End Button
  document.getElementById('end-button').addEventListener('click', () => {
    scenarioRunning = false;
    document.getElementById('scenario-button').textContent = 'Start Scenario';
    endScenario();
  });

  // Send Message
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

  // Mic Toggle
  document.getElementById('mic-button').addEventListener('click', () => {
    micActive = !micActive;
    const micButton = document.getElementById('mic-button');
    micButton.classList.toggle('active', micActive);
    micButton.textContent = micActive ? '🎤 Listening...' : '🎤 Hold to Speak';
    // You can add speech recognition logic here
  });

  // Append Messages
  function appendMessage(sender, message) {
    const chatBox = document.getElementById('chat-box');
    const messageEl = document.createElement('div');
    messageEl.classList.add('chat-message');
    messageEl.innerHTML = `<strong>${sender}:</strong> ${message}`;
    chatBox.appendChild(messageEl);
    chatBox.scrollTop = chatBox.scrollHeight;
  }

  // Start Scenario
  async function startScenario() {
    appendMessage("System", "🟢 Scenario started.");

    try {
      const response = await fetch("/scenarios/chest_pain_001/scenario.json");
      const scenario = await response.json();

      // Dispatch info
      appendMessage("Dispatch", `🚑 Dispatch: ${scenario.dispatch}`);

      // Wait before revealing scene for realism
      setTimeout(() => {
        const scene = scenario.scene_description || "Scene description not found.";
        appendMessage("Scene", `📍 Scene: ${scene}`);

        // Show patient image
        const chatBox = document.getElementById('chat-box');
        const img = document.createElement('img');
        img.src = "/scenarios/chest_pain_001/patient_1.jpg";
        img.alt = "Patient";
        img.style.maxWidth = "100%";
        img.style.marginTop = "10px";
        chatBox.appendChild(img);
        chatBox.scrollTop = chatBox.scrollHeight;

        // Trigger AI response after brief delay
        setTimeout(async () => {
          const aiReply = await getAIResponse("Do you have chest pain?", "patient");
          appendMessage("Patient", aiReply);
        }, 1000);

      }, 1000);

    } catch (error) {
      console.error("Scenario loading failed:", error);
      appendMessage("System", "⚠️ Failed to load scenario.");
    }
  }

  // End Scenario
  function endScenario() {
    appendMessage("System", "🔴 Scenario ended.");
  }

  // Role Detection Logic
  function getRoleConfidence
