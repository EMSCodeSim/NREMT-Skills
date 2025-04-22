let patientGender = "male";
let scenarioContext = "";
let currentPatientData = null;

document.addEventListener('DOMContentLoaded', () => {
  let scenarioRunning = false;

  const micButton = document.getElementById('mic-button');
  const scenarioBtn = document.getElementById('scenario-button');
  const endBtn = document.getElementById('end-button');
  const sendBtn = document.getElementById('send-button');
  const inputField = document.getElementById('user-input');
  const chatDisplay = document.getElementById('chat-display');

  window.hasSpoken = false;

  window.speechSynthesis.onvoiceschanged = () => {
    window.speechSynthesis.getVoices();
  };

  document.body.addEventListener('click', () => {
    window.hasSpoken = true;
  }, { once: true });

  scenarioBtn.addEventListener('click', async () => {
    scenarioRunning = !scenarioRunning;
    scenarioBtn.textContent = scenarioRunning ? 'End Scenario' : 'Start Scenario';
    if (scenarioRunning) {
      await startScenario();
    } else {
      endScenario();
    }
  });

  endBtn.addEventListener('click', () => {
    scenarioRunning = false;
    scenarioBtn.textContent = 'Start Scenario';
    endScenario();
  });

  sendBtn.addEventListener('click', async () => {
    const message = inputField.value.trim();
    if (message === "") return;

    appendMessage("You", message, "User");
    inputField.value = "";

    const role = detectProctorIntent(message) ? "proctor" : "patient";
    const reply = await getAIResponse(message, scenarioContext, role);

    appendMessage(role === "proctor" ? "Proctor" : "Patient", reply, capitalize(role));
    speakWithOpenAI(reply, role === "proctor" ? "alloy" : "nova");
  });

  micButton.addEventListener('click
