document.addEventListener('DOMContentLoaded', () => {
  let scenarioRunning = false;
  let micActive = false;

  const micButton = document.getElementById('mic-button');

  document.getElementById('scenario-button').addEventListener('click', () => {
    scenarioRunning = !scenarioRunning;
    document.getElementById('scenario-button').textContent = scenarioRunning ? 'End Scenario' : 'Start Scenario';
    if (scenarioRunning) startScenario();
    else endScenario();
  });

  document.getElementById('end-button').addEventListener('click', () => {
    scenarioRunning = false;
    document.getElementById('scenario-button').textContent = 'Start Scenario';
    endScenario();
  });

  document.getElementById('send-button').addEventListener('click', async () => {
    const inputBox = document.getElementById('user-input');
    const input = inputBox.value.trim();
    if (input) {
      appendMessage("User", input);
      inputBox.value = '';

      const role = getRoleConfidence(input).role;
      micButton.disabled = true;
      const aiReply = await getAIResponse(input, role);
      appendMessage(role === "patient" ? "Patient" : "Proctor", aiReply);
      micButton.disabled = false;
    }
  });

  // ✅ Smart Mic: Auto-send voice, disable during AI response
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (SpeechRecognition) {
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.continuous = false;

    recognition.onstart = () => {
      micActive = true;
      micButton.classList.add('active');
      micButton.textContent = "🎤 Listening...";
    };

    recognition.onend = () => {
      micActive = false;
      micButton.classList.remove('active');
      micButton.textContent = "🎤 Hold to Speak";
    };

    recognition.onresult = async (event) => {
      const transcript = event.results[0][0].transcript.trim();
      if (transcript) {
        appendMessage("User", transcript);

        micButton.disabled = true;

        const role = getRoleConfidence(transcript).role;
        const aiReply = await getAIResponse(transcript, role);
        appendMessage(role === "patient" ? "Patient" : "Proctor", aiReply);

        micButton.disabled = false;
      }
    };

    micButton.addEventListener('click', () => {
      if (!micActive) {
        recognition.start();
      } else {
        recognition.stop();
      }
    });
  } else {
    micButton.disabled = true;
    micButton.textContent = "🎤 Not supported";
    console.warn("SpeechRecognition not supported in this browser.");
  }

  function appendMessage(sender, message) {
    const chatBox = document.getElementById('chat-box');
    const messageEl = document.createElement('div');
    messageEl.classList.add('chat-message');
    messageEl.innerHTML = `<strong>${sender}:</strong> ${message}`;
    chatBox.appendChild(messageEl);
    chatBox.scrollTop = chatBox.scrollHeight;
  }

  async function startScenario() {
    appendMessage("System", "🟢 Scenario started.");
    try {
      const response = await fetch("/scenarios/chest_pain_001/scenario.json");

      if (!response.ok) {
        throw new Error(`HTTP ${response.status} - ${response.statusText}`);
      }

      const scenario = await response.json();
      appendMessage("Dispatch", `🚑 Dispatch: ${scenario.dispatch}`);
      appendMessage("Scene", `📍 Scene: ${scenario.scene_description}`);

      const chatBox = document.getElementById('chat-box');
      const img = document.createElement('img');
      img.src = "/scenarios/chest_pain_001/patient_1.jpg";
      img.alt = "Patient";
      img.style.maxWidth = "100%";
      img.style.marginTop = "10px";
      chatBox.appendChild(img);
      chatBox.scrollTop = chatBox.scrollHeight;

      const aiReply = await getAIResponse("Do you have chest pain?", "patient");
      appendMessage("Patient", aiReply);
    } catch (err) {
      console.error("Scenario load error:", err);
      appendMessage("System", `⚠️ Failed to load scenario: ${err.message}`);
    }
  }

  function endScenario() {
    appendMessage("System", "🔴 Scenario ended.");
  }

  function getRoleConfidence(message) {
    const lower = message.toLowerCase();
    const proctorKeywords = ["blood pressure", "pulse", "respirations", "bgl", "oxygen"];
    const patientKeywords = ["pain", "symptom", "feel", "describe", "history", "allergies"];

    if (patientKeywords.some(word => lower.includes(word))) return { role: "patient" };
    if (proctorKeywords.some(word => lower.includes(word))) return { role: "proctor" };
    return { role: "patient" };
  }

  async function getAIResponse(message, role = "patient") {
    try {
      const response = await fetch("/.netlify/functions/openai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: message,
          role: role,
          context: "You are a simulated EMS patient. Respond appropriately."
        })
      });

      const data = await response.json();
      return data.response || "No response from AI.";
    } catch (error) {
      console.error("AI request error:", error);
      return "⚠️ Error getting AI response.";
    }
  }
});
