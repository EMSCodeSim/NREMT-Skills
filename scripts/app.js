let scenarioRunning = false;
let micActive = false;

// Toggle scenario start/end
document.getElementById('scenario-button').addEventListener('click', () => {
  scenarioRunning = !scenarioRunning;
  document.getElementById('scenario-button').textContent = scenarioRunning ? 'End Scenario' : 'Start Scenario';
  if (scenarioRunning) {
    startScenario();
  } else {
    endScenario();
  }
});

// Force end scenario
document.getElementById('end-button').addEventListener('click', () => {
  scenarioRunning = false;
  document.getElementById('scenario-button').textContent = 'Start Scenario';
  endScenario();
});

// Send message manually
document.getElementById('send-button').addEventListener('click', () => {
  const inputBox = document.getElementById('user-input');
  const input = inputBox.value.trim();
  if (input) {
    appendMessage("User", input);
    inputBox.value = '';
  }
});

// Mic button toggles active state
document.getElementById('mic-button').addEventListener('click', () => {
  micActive = !micActive;
  const micButton = document.getElementById('mic-button');
  micButton.classList.toggle('active', micActive);
  micButton.textContent = micActive ? '🎤 Listening...' : '🎤 Hold to Speak';
  // Placeholder for voice logic
});

// Add a message bubble to the chat
function appendMessage(sender, message) {
  const chatBox = document.getElementById('chat-box');
  const messageEl = document.createElement('div');
  messageEl.classList.add('chat-message');
  messageEl.innerHTML = `<strong>${sender}:</strong> ${message}`;
  chatBox.appendChild(messageEl);
  chatBox.scrollTop = chatBox.scrollHeight;
}

// Start scenario and load content from chest_pain_001
async function startScenario() {
  appendMessage("System", "🟢 Scenario started.");

  try {
    const response = await fetch("/scenarios/chest_pain_001/scenario.json");
    const scenario = await response.json();

    // Show dispatch and scene
    appendMessage("Dispatch", `🚑 Dispatch: ${scenario.dispatch}`);
    appendMessage("Scene", `📍 Scene: ${scenario.scene_description}`);

    // Ask AI a test question
    const aiReply = await getAIResponse("Do you have chest pain?", "patient");
    appendMessage("Patient", aiReply);
  } catch (error) {
    console.error("Scenario loading failed:", error);
    appendMessage("System", "⚠️ Failed to load scenario.");
  }
}

// End scenario
function endScenario() {
  appendMessage("System", "🔴 Scenario ended.");
}

// Call backend to get AI response
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
