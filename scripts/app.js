let scenarioRunning = false;

document.getElementById('scenario-button').addEventListener('click', () => {
  if (!scenarioRunning) {
    scenarioRunning = true;
    document.getElementById('scenario-button').textContent = 'End Scenario';
    startScenario();
  } else {
    scenarioRunning = false;
    document.getElementById('scenario-button').textContent = 'Start Scenario';
    endScenario();
  }
});

// Placeholder for actual scenario logic
function startScenario() {
  appendMessage("System", "🟢 Scenario started. Awaiting dispatch...");
  // Additional logic goes here
}

function endScenario() {
  appendMessage("System", "🔴 Scenario ended.");
  // Additional cleanup logic goes here
}

// Placeholder chat handling logic
function appendMessage(sender, text) {
  const chat = document.getElementById('chat-display');
  const msg = document.createElement('div');
  msg.textContent = `${sender}: ${text}`;
  msg.style.margin = '10px 0';
  chat.appendChild(msg);
  chat.scrollTop = chat.scrollHeight;
}
