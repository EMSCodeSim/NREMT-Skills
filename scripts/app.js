document.addEventListener('DOMContentLoaded', () => {
  let scenarioRunning = false;
  let micActive = false;
  let patientGender = "male";
  const micButton = document.getElementById('mic-button');
  window.hasSpoken = false;

  // Preload voices for TTS
  window.speechSynthesis.onvoiceschanged = () => {
    window.speechSynthesis.getVoices();
  };
  document.body.addEventListener('click', () => {
    window.hasSpoken = true;
  }, { once: true });

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
      await getAIResponseStream(input, role);
      micButton.disabled = false;
    }
  });

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
        await getAIResponseStream(transcript, role);
        micButton.disabled = false;
      }
    };

    micButton.addEventListener('click', () => {
      if (!micActive) recognition.start();
      else recognition.stop();
    });
  } else {
    micButton.disabled = true;
    micButton.textContent = "🎤 Not supported";
  }

  function appendMessage(sender, message, voiceTag = null, skipVoice = false) {
    const chatBox = document.getElementById('chat-box');
    const messageEl = document.createElement('div');
    messageEl.classList.add('chat-message');
    messageEl.innerHTML = `<strong>${sender}:</strong> ${message}`;
    chatBox.appendChild(messageEl);
    chatBox.scrollTop = chatBox.scrollHeight;
    if (voiceTag && !skipVoice) speakMessage(message, voiceTag);
  }

  function speakMessage(text, speaker) {
    const synth = window.speechSynthesis;
    synth.cancel(); // iOS fix
    const utter = new SpeechSynthesisUtterance(text);
    const voices = synth.getVoices();

    if (!voices.length) {
      setTimeout(() => speakMessage(text, speaker), 200);
      return;
    }

    const patientMaleVoice =
      voices.find(v => v.name === "Alex") ||
      voices.find(v => v.name === "Microsoft David Desktop") ||
      voices.find(v => v.name.includes("Google UK") && v.name.includes("Male")) ||
      voices.find(v => v.name.toLowerCase().includes("male")) || voices[0];

    const patientFemaleVoice =
      voices.find(v => v.name === "Samantha") ||
      voices.find(v => v.name === "Microsoft Zira Desktop") ||
      voices.find(v => v.name.includes("Google US") && v.name.includes("English")) ||
      voices.find(v => v.name.toLowerCase().includes("female")) || voices[1] || voices[0];

    const dispatchVoice =
      voices.find(v => v.name === "Victoria") ||
      voices.find(v => v.name.includes("Google UK English Female")) ||
      voices.find(v => v.name.toLowerCase().includes("female")) || voices[2] || voices[0];

    if (speaker === "Patient-Male") {
      utter.voice = patientMaleVoice;
      utter.rate = 1.05;
      utter.pitch = 1.0;
    } else if (speaker === "Patient-Female") {
      utter.voice = patientFemaleVoice;
      utter.rate = 1.15;
      utter.pitch = 1.3;
    } else if (speaker === "Dispatch") {
      utter.voice = dispatchVoice;
      utter.rate = 1.0;
      utter.pitch = 1.1;
    } else {
      utter.voice = voices[0];
    }

    if (window.hasSpoken || !/iPhone|iPad|iPod/.test(navigator.userAgent)) {
      synth.speak(utter);
    }
  }

  async function getAIResponseStream(userMessage, role = "patient") {
    const speaker = role === "proctor" ? "Dispatch" : (patientGender === "female" ? "Patient-Female" : "Patient-Male");
    const sender = role === "proctor" ? "Proctor" : "Patient";
    let messageEl = document.createElement('div');
    messageEl.classList.add('chat-message');
    messageEl.innerHTML = `<strong>${sender}:</strong> <span id="streaming-text"></span>`;
    document.getElementById('chat-box').appendChild(messageEl);
    document.getElementById('chat-box').scrollTop = document.getElementById('chat-box').scrollHeight;

    try {
      const response = await fetch("/.netlify/functions/openai-stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage, role: role })
      });

      if (!response.body) throw new Error("Streaming not supported");

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let fullText = "";
      let speaking = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        fullText += chunk;
        document.getElementById("streaming-text").innerText = fullText;
        document.getElementById('chat-box').scrollTop = document.getElementById('chat-box').scrollHeight;

        // Start speaking after first few words
        if (!speaking && fullText.length > 15) {
          speakMessage(fullText, speaker);
          speaking = true;
        }
      }
    } catch (err) {
      console.error("Streaming failed:", err);
      appendMessage("System", "⚠️ Error retrieving streaming response.");
    }
  }

  async function startScenario() {
    appendMessage("System", "🟢 Scenario started.");
    try {
      const response = await fetch("/scenarios/chest_pain_001/scenario.json");
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const scenario = await response.json();
      patientGender = (scenario.gender || "male").toLowerCase();
      appendMessage("Dispatch", `🚑 Dispatch: ${scenario.dispatch}`, "Dispatch");
      appendMessage("Scene", `📍 Scene: ${scenario.scene_description}`);

      const img = document.createElement('img');
      img.src = "/scenarios/chest_pain_001/patient_1.jpg";
      img.alt = "Patient";
      img.style.maxWidth = "100%";
      img.style.marginTop = "10px";
      const chatBox = document.getElementById('chat-box');
      chatBox.appendChild(img);
      chatBox.scrollTop = chatBox.scrollHeight;

      await getAIResponseStream("Do you have chest pain?", "patient");
    } catch (err) {
      appendMessage("System", `⚠️ Scenario load error: ${err.message}`);
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
});
