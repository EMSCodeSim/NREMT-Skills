let scenarioRunning = false;
let countdownInterval;

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
  startTimer(15 * 60); // 15-minute timer

  try {
    const response = await fetch("scenarios/chest_pain_001/scenario.json");
    const scenario = await response.json();

    appendMessage("Dispatch", scenario.dispatch || "You are responding to an emergency call.");

    if (scenario.image) {
      const chat = document.getElementById("chat-display");
      const img = document.createElement("img");
      img.src = scenario.image;
      img.alt = "Scene";
      img.style.maxWidth = "100%";
      img.style.maxHeight = "40vh";
      img.style.objectFit = "contain";
      img.style.borderRadius = "8px";
      img.style.margin = "10px 0";
      chat.appendChild(img);
      chat.scrollTop = chat.scrollHeight;
    }

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
  clearInterval(countdownInterval);
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
  const msgWrapper = document.createElement('div');
  const msgBubble = document.createElement('div');

  msgBubble.textContent = text;
  msgBubble.classList.add('chat-bubble');

  if (sender === "Patient") {
    msgWrapper.classList.add('chat-left');
    msgBubble.classList.add('patient-bubble');
  } else if (sender === "Proctor") {
    msgWrapper.classList.add('chat-left');
    msgBubble.classList.add('proctor-bubble');
  } else if (sender === "You") {
    msgWrapper.classList.add('chat-right');
    msgBubble.classList.add('user-bubble');
  } else {
    msgWrapper.classList.add('chat-center');
    msgBubble.classList.add('system-bubble');
  }

  msgWrapper.appendChild(msgBubble);
  chat.appendChild(msgWrapper);
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

function startTimer(duration) {
  let timer = duration;
  const display = document.getElementById("timer");

  countdownInterval = setInterval(() => {
    const minutes = Math.floor(timer / 60);
    const seconds = timer % 60;
    display.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    if (--timer < 0) {
      clearInterval(countdownInterval);
      appendMessage("System", "⏰ Time's up!");
    }
  }, 1000);
}

// Enter key and send button both send message
document.getElementById('send-button').addEventListener('click', handleUserMessage);
document.getElementById('user-input').addEventListener('keydown', (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    handleUserMessage();
  }
});

async function handleUserMessage() {
  const inputBox = document.getElementById("user-input");
  const message = inputBox.value.trim();
  if (!message) return;

  appendMessage("You", message);
  inputBox.value = "";

  const res = await fetch("/.netlify/functions/openai", {
    method: "POST",
    body: JSON.stringify({ message })
  });

  const data = await res.json();
  const aiResponse = data.response || "No response received.";
  const sender = data.role === "proctor" ? "Proctor" : "Patient";

  appendMessage(sender, aiResponse);
}
