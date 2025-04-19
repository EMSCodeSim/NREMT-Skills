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

    // Show scene image if available
    if (scenario.image) {
      const chat = document.getElementById("chat-display");
      const img = document.createElement("img");
      img.src = scenario.image;
      img.alt = "Scene";
      img.style.maxWidth = "100%";
      img.style.borderRadius = "8px";
      img.style.margin = "10px 0";
      chat.appendChild(img);
      chat.scrollTop = chat.scrollHeight;
    }

    // Load proctor and patient prompts into memory
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

function startTimer(duration) {
  let timer = duration;
  const display = document.getElementById("timer");

  countdownInterval = setInterval(() => {
    const minutes = Math.floor(timer / 60);
    const seconds = timer % 60;
    display.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    if (--timer < 0) {
      clearInterval(countdownInterval);
      appendMessage("System", "⏰ Time is up!");
      document.getElementById('scenario-button').textContent = 'Start Scenario';
      scenarioRunning = false;
    }
  }, 1000);
}

// ⌨️ Send on Enter key or button click
document.getElementById("send-button").addEventListener("click", sendUserInput);
document.getElementById("user-input").addEventListener("keydown", function (e) {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendUserInput();
  }
});

function sendUserInput() {
  const input = document.getElementById("user-input");
  const message = input.value.trim();
  if (message) {
    appendMessage("You", message);
    input.value = "";

    fetch("/.netlify/functions/openai", {
      method: "POST",
      body: JSON.stringify({
        message: message,
        role: "user"
      })
    })
      .then(res => res.json())
      .then(data => {
        appendMessage("Patient", data.response);
      })
      .catch(err => {
        appendMessage("System", "❌ Error getting response.");
        console.error(err);
      });
  }
}

// 🎤 Mic input
document.getElementById("mic-button").addEventListener("click", () => {
  const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  recognition.lang = "en-US";
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.onresult = function (event) {
    const spokenText = event.results[0][0].transcript;
    document.getElementById("user-input").value = spokenText;
    sendUserInput();
  };

  recognition.onerror = function (event) {
    appendMessage("System", "🎤 Mic error: " + event.error);
  };

  recognition.start();
});
