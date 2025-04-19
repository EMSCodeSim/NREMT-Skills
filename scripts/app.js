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

async function startScenario() {
  appendMessage("System", "🟢 Scenario started. Awaiting dispatch...");

  try {
    const response = await fetch("scenarios/chest_pain_001/scenario.json");
    const scenario = await response.json();

    // Show dispatch message
    appendMessage("Dispatch", scenario.dispatch || "You are responding to an emergency call.");

    // Send proctor and patient context to backend
    await Promise.all([
      sendToAI("proctor", scenario.proctorPrompt),
      sendToAI("patient", scenario.patientPrompt)
    ]);
  } catch (err) {
    appendMessage("System", "❌ Error loading scenario.");
    console.error(err);
  }
}

function endScenario() {
  appendMessage("System", "🔴 Scenario ended. Generating test results...");

  fetch("/.netlify/functions/gradeScenario", {
    method: "POST",
    body: JSON.stringify({
      transcript: getTranscriptLog()
    })
  })
  .then(res => res.json())
  .then(data => {
    appendMessage("Proctor", data.feedback || "No feedback received.");
  })
  .catch(err => {
    appendMessage("System", "❌ Grading failed.");
    console.error(err);
  });
}

function appendMessage(sender, text) {
  const chat = document.getElementById('chat-display');
  const msg = document.createElement('div');
  msg.textContent = `${sender}: ${text}`;
  msg.style.margin = '10px 0';
  chat.appendChild(msg);
  chat.scrollTop = chat.scrollHeight;
}

async function sendToAI(role, prompt) {
  await fetch("/.netlify/functions/openai", {
    method: "POST",
    body: JSON.stringify({
      message: "Scenario started.",
      role: role,
      context: prompt
    })
  });
}

function getTranscriptLog() {
  const messages = document.querySelectorAll("#chat-display div");
  return Array.from(messages).map(msg => msg.textContent).join("\n");
}
