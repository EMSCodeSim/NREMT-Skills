let patientGender = "male";
let scenarioContext = "";

document.addEventListener('DOMContentLoaded', () => {
  let scenarioRunning = false;
  let micActive = false;

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

  scenarioBtn.addEventListener('click', () => {
    scenarioRunning = !scenarioRunning;
    scenarioBtn.textContent = scenarioRunning ? 'End Scenario' : 'Start Scenario';
    if (scenarioRunning) startScenario();
    else endScenario();
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

  micButton.addEventListener('click', () => {
    alert("Mic button clicked (implement speech-to-text here)");
  });
});

function startScenario() {
  appendMessage("System", "Scenario Started. Awaiting dispatch...", "System");
  // You can trigger more setup logic here
}

function endScenario() {
  appendMessage("System", "Scenario Ended. Thank you.", "System");
}

function appendMessage(sender, text, role) {
  const msg = document.createElement("div");
  msg.className = `chat-bubble ${role.toLowerCase()}`;
  msg.innerHTML = `<strong>${sender}:</strong> ${text}`;
  document.getElementById("chat-display").appendChild(msg);
  msg.scrollIntoView({ behavior: "smooth" });
}

async function speakWithOpenAI(text, voice = "nova") {
  try {
    const response = await fetch("/.netlify/functions/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json"
