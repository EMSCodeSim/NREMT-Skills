document.addEventListener("DOMContentLoaded", () => {
  const chatDisplay = document.getElementById("chat-display");
  const sendButton = document.getElementById("send-button");
  const startButton = document.getElementById("start-button");
  const endButton = document.getElementById("end-button");
  const userInput = document.getElementById("user-input");

  let currentScenarioContext = ""; // stores scenario data after loading

  sendButton.addEventListener("click", async () => {
    const input = userInput.value.trim();
    if (!input) return;

    const userMessage = document.createElement("p");
    userMessage.className = "user-message";
    userMessage.textContent = `You: ${input}`;
    chatDisplay.appendChild(userMessage);

    try {
      const response = await fetch("/.netlify/functions/openai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: input,
          role: "user",
          context: currentScenarioContext || "No scenario loaded"
        }),
      });

      const data = await response.json();
      const reply = data.response || "I'm sorry, I can't respond right now.";

      const patientMessage = document.createElement("p");
      patientMessage.className = "ai-message";
      patientMessage.textContent = `Patient: ${reply}`;
      chatDisplay.appendChild(patientMessage);
    } catch (error) {
      console.error("Fetch error:", error);
    }

    userInput.value = "";
  });

  startButton.addEventListener("click", async () => {
    const message = document.createElement("p");
    message.className = "system-message";
    message.textContent = "🚨 Scenario Started. Awaiting dispatch...";
    chatDisplay.appendChild(message);

    // Load chest pain scenario context
    try {
      const response = await fetch("scenarios/chest_pain_001/scenario.json");
      const scenario = await response.json();

      currentScenarioContext = `
        Scenario Title: ${scenario.title}
        Patient: ${scenario.description}
        Instructions: ${scenario.instructions || "Follow NREMT protocol for medical assessment."}
      `;

      const dispatchMessage = document.createElement("p");
      dispatchMessage.className = "system-message";
      dispatchMessage.textContent = `Dispatch: ${scenario.dispatch || "You are responding to a 55-year-old male with chest pain."}`;
      chatDisplay.appendChild(dispatchMessage);
    } catch (err) {
      console.error("Failed to load scenario file", err);
      chatDisplay.appendChild(createSystemMessage("Failed to load scenario file."));
    }
  });

  endButton.addEventListener("click", () => {
    const message = document.createElement("p");
    message.className = "system-message";
    message.textContent = "✅ Scenario Ended.";
    chatDisplay.appendChild(message);
  });

  function createSystemMessage(text) {
    const message = document.createElement("p");
    message.className = "system-message";
    message.textContent = text;
    return message;
  }
});
