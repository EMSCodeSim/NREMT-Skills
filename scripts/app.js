let scenarioRunning = false;
let micActive = false;

// Start/End Scenario toggle
document.getElementById('scenario-button').addEventListener('click', () => {
  scenarioRunning = !scenarioRunning;
  document.getElementById('scenario-button').textContent = scenarioRunning ? 'End Scenario' : 'Start Scenario';
  if (scenarioRunning) {
    startScenario();
  } else {
    endScenario();
  }
});

// Manual End button
document.getElementById('end-button').addEventListener('click', () => {
  scenarioRunning = false;
  document.getElementById('scenario-button').textContent = 'Start Scenario';
  endScenario();
});

// Send message and get AI reply
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

// Mic toggle
document.getElementById('mic-button').addEventListener('click', () => {
  mic
