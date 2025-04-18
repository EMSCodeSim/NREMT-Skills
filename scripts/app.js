document.addEventListener("DOMContentLoaded", () => {
  const chatDisplay = document.getElementById("chat-display");
  const sendButton = document.getElementById("send-button");
  const micButton = document.getElementById("mic-button");
  const startButton = document.getElementById("start-button");
  const endButton = document.getElementById("end-button");
  const userInput = document.getElementById("user-input");

  let currentScenarioContext = "";

  async function sendMessage(input) {
    const userMessage = document.createElement("p");
    userMessage.className = "user-message";
    userMessage.textContent = `You: ${input}`;
    chatDisplay.appendChild(userMessage);
    scrollChatToBottom();

    // Detect if message is for proctor
    const proctorTriggers = [
      "blood pressure", "pulse", "breath sounds", "respirations",
      "o2 sat", "oxygen saturation", "blood sugar", "bgl",
      "bsi", "scene safe", "give", "administer",
      "oxygen", "aed", "nitro", "aspirin"
    ];

    const isProctorMessage = proctorTriggers.some(trigger =>
      input.toLowerCase().includes(trigger)
    );

    const role = isProctorMessage ? "proctor" : "user";
    const model = isProctorMessage ? "gpt-3.5-turbo" : "gpt-4-turbo";
    const speaker = isProctorMessage ? "Proctor" : "Patient";

    try {
      const response = await fetch("/.netlify/functions/openai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: input,
          role: role,
          context: currentScenarioContext || "No scenario loaded"
        }),
      });

      const data = await response.json();
      const reply = data.response || "I'm sorry, I can't respond right now.";

      const replyMessage = document.createElement("p");
      replyMessage.className = "ai-message";
      replyMessage.textContent = `${speaker}: ${reply}`;
      chatDisplay.appendChild(replyMessage);
    } catch (error) {
      console.error("Fetch error:", error);
    }

    userInput.value = "";
    scrollChatToBottom();
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

  micButton.addEventListener("click", () => {
    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.start();

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      userInput.value = transcript;
      sendMessage(transcript);
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
    };
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
      scrollChatToBottom();
    } catch (err) {
      console.error("Failed to load scenario file", err);
      chatDisplay.appendChild(createSystemMessage("Failed to load scenario file."));
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
