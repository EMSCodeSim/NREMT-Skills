document.addEventListener("DOMContentLoaded", () => {
  const chatDisplay = document.getElementById("chat-display");
  const sendButton = document.getElementById("send-button");
  const micButton = document.getElementById("mic-button");
  const startButton = document.getElementById("start-button");
  const endButton = document.getElementById("end-button");
  const userInput = document.getElementById("user-input");

  let currentScenarioContext = "";
  let recognition;
  let isListening = false;

  async function sendMessage(input) {
    const userMessage = document.createElement("p");
    userMessage.className = "user-message";
    userMessage.textContent = `You: ${input}`;
    chatDisplay.appendChild(userMessage);
    scrollChatToBottom();

    const proctorKeywords = [
      "blood pressure", "pulse", "respirations", "oxygen", "bgl",
      "o2 sat", "asa", "nitro", "aed", "scene safe", "give", "administer",
      "pupils", "what is", "what are", "check", "apply", "how many patients", "start an iv"
    ];

    const isProctorMessage = proctorKeywords.some(trigger =>
      input.toLowerCase().includes(trigger)
    );

    const speaker = isProctorMessage ? "Proctor" : "Patient";

    try {
      const response = await fetch("/.netlify/functions/openai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: input,
          role: isProctorMessage ? "proctor" : "user",
          context: currentScenarioContext || "No scenario loaded"
        }),
      });

      const data = await response.json();
      const reply = data.response || "I'm sorry, I can't respond right now.";

      const replyMessage = document.createElement("p");
      replyMessage.className = "ai-message";
      replyMessage.textContent = `${speaker}: ${reply}`;
      chatDisplay.appendChild(replyMessage);

      if (data.routing) {
        chatDisplay.appendChild(createSystemMessage(data.routing));
      }

      scrollChatToBottom();

      // Restart mic if not already listening
      if (!isListening) setTimeout(startMic, 300);
    } catch (error) {
      console.error("Fetch error:", error);
      chatDisplay.appendChild(createSystemMessage("❌ Error contacting AI server."));
    }

    userInput.value = "";
  }

  sendButton.addEventListener("click", () => {
    const input = userInput.value.trim();
    if (input) sendMessage(input);
  });

  userInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      const input = userInput.value.trim();
      if (input) sendMessage(input);
    }
  });

  function startMic() {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert("Your browser doesn't support speech recognition.");
      return;
    }

    recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      isListening = true;
      micButton.style.backgroundColor = "#dc3545"; // Red while active
    };

    recognition.onend = () => {
      isListening = false;
      micButton.style.backgroundColor = "#6c757d"; // Reset color
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      userInput.value = transcript;
      sendMessage(transcript);
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      micButton.style.backgroundColor = "#6c757d";
    };

    recognition.start();
  }

  micButton.addEventListener("click", () => {
    if (!isListening) startMic();
  });

  startButton.addEventListener("click", async () => {
    chatDisplay.appendChild(createSystemMessage("🚨 Scenario Started. Awaiting dispatch..."));
    scrollChatToBottom();

    try {
      const response = await fetch("scenarios/chest_pain_001/scenario.json");
      const scenario = await response.json();

      currentScenarioContext = `
        Scenario Title: ${scenario.title}
        Patient: ${scenario.description}
        Instructions: ${scenario.instructions || "Follow NREMT protocol for medical assessment."}
      `;

      chatDisplay.appendChild(createSystemMessage(`Dispatch: ${scenario.dispatch || "You are responding to a 55-year-old male with chest pain."}`));

      // Show scene photo and text
      if (scenario.response_1) {
        chatDisplay.appendChild(createSystemMessage(scenario.response_1));
      }
      if (scenario.response_1_image) {
        const img = document.createElement("img");
        img.src = `scenarios/chest_pain_001/${scenario.response_1_image}`;
        img.alt = "Scene view";
        img.style.maxWidth = "100%";
        img.style.borderRadius = "8px";
        img.style.marginTop = "10px";
        chatDisplay.appendChild(img);
      }

      scrollChatToBottom();
    } catch (err) {
      console.error("Failed to load scenario file", err);
      chatDisplay.appendChild(createSystemMessage("❌ Failed to load scenario file."));
    }
  });

  endButton.addEventListener("click", () => {
    chatDisplay.appendChild(createSystemMessage("✅ Scenario Ended."));
    scrollChatToBottom();
  });

  function createSystemMessage(text) {
    const message = document.createElement("p");
    message.className = "system-message";
    message.textContent = text;
    return message;
  }

  function scrollChatToBottom() {
    chatDisplay.scrollTop = chatDisplay.scrollHeight;
  }
});
