let patientGender = "male";
let scenarioContext = "";
let currentPatientData = {
  name: "John Doe",
  age: 55,
  chiefComplaint: "Chest pain",
  dispatch: "You are responding to a 55-year-old male with chest pain at a private residence.",
  context: "You are treating a 55-year-old male experiencing substernal chest pain that radiates to the left arm."
};

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
    if (scenarioRunning
