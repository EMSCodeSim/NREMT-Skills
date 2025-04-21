let scenarioRunning = false;
let micActive = false;

// Start/End Scenario button
document.getElementById('scenario-button').addEventListener('click', () => {
  scenarioRunning = !scenarioRunning;
  document.getElementById('scenario-button').textContent = scenarioRunning ? 'End Scenario' : 'Start Scenario';
  if (scenarioRunning) {
    startScenario();
  } else {
    endScenario();
  }
});

// Dedicated End Scenario button
document.getElementById('end-button').addEventListener('click', () => {
  scenarioRunning = false;
  document.getElementById('scenario-button').textContent = 'Start Scenario';
  endScenario();
});

// Send message button
document.getElementById('send-button').addEventListener('click', () => {
  const inputBox = document.getElementById('user-input');
  const input = inputBox.value.trim();
  if (input) {
    appendMessage("User", input);
    inputBox.value = '';
  }
});

// Mic button toggle
document.getElementById('mic-button').addEventListener('click', () => {
  micActive = !micActive;
  const micButton = document.getElementById('mic-button');
  micButton.classList.toggle('active', micActive);
  micButton.textContent = micActive ? '🎤 Listening...' : '🎤 Hold to Speak';

  // TODO: Add actual voice recognition logic here
});

// Append message to chat box
function appendMessage(sender, message) {
  const chatBox = document.getElementById('chat-box');
  const messageEl = document.createElement('div');
  messageEl.classList.add('chat-message');
  messageEl.innerHTML = `<strong>${sender}:</strong> ${message}`;
  chatBox.appendChild(messageEl);
  chatBox.scrollTop = chatBox.scrollHeight;
}

// Scenario logic
function startScenario() {
  appendMessage("System", "🟢 Scenario started.");
  // Add dispatch message or additional logic here
}

function endScenario() {
  appendMessage("System", "🔴 Scenario ended.");
  // Add wrap-up logic or scoring here
}
