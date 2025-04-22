console.log("App JS loaded");

let scenarioContext = "";
let currentPatientData = {
  name: "John Doe",
  age: 55,
  chiefComplaint: "Chest pain",
  dispatch: "You are responding to a 55-year-old male with chest pain at a private residence.",
  context: "You are treating a 55-year-old male experiencing substernal chest pain."
};

document.addEventListener('DOMContentLoaded', () => {
  console.log("DOM fully loaded");

  let scenarioRunning = false;

  const scenarioBtn = document.getElementById('scenario-button');
  const endBtn = document.getElementById('end-button');
  const sendBtn = document.getElementById('send-button');
  const micButton = document.getElementById('mic-button');
  const inputField = document.getElementById('user-input');
  const chatDisplay = document.getElementById('chat-display');

  scenarioBtn.addEventListener('click', () => {
    console.log("Start button clicked");
    scenarioRunning = !scenarioRunning;
    scenarioBtn.textContent = scenarioRunning ? 'End Scenario' : 'Start Scenario';
    if (scenarioRunning) {
      startScenario();
    } else {
      endScenario();
    }
  });

  endBtn.addEventListener('click', () => {
    console.log("End button clicked");
    scenarioRunning = false;
    scenarioBtn.textContent = 'Start Scenario';
    endScenario();
  });

  sendBtn.addEventListener('click', () => {
    const message = inputField.value.trim();
    if (message === "") return;
    appendMessage("You", message, "user");
    inputField.value = "";
  });

  micButton.addEventListener('click', () => {
    alert("Mic button clicked");
  });

  function startScenario() {
    console.log("Scenario started");
    scenarioContext = currentPatientData.context;
    appendMessage("Dispatch", currentPatientData.dispatch, "system");
  }

  function endScenario() {
    appendMessage("System", "Scenario Ended. Thank you.", "system");
  }

  function appendMessage(sender, text, role) {
    const msg = document.createElement("div");
    msg.className = `chat-bubble ${role}`;
    msg.innerHTML = `<strong>${sender}:</strong> ${text}`;
    chatDisplay.appendChild(msg);
    msg.scrollIntoView({ behavior: "smooth" });
  }
});
