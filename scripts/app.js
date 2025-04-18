document.addEventListener("DOMContentLoaded", () => {
  const chatDisplay = document.getElementById("chat-display");
  const sendButton = document.getElementById("send-button");
  const startButton = document.getElementById("start-button");
  const endButton = document.getElementById("end-button");
  const userInput = document.getElementById("user-input");

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
          context: "You are an EMS patient simulator. Respond as a patient unless the user is requesting vitals, treatment effects, or external cues — then respond as a proctor."
        }),
      });

      const data = await response.json();
      const reply = data.response || "I'm sorry, I can't respond right now.";

      const patientMessage = document.createElement("p");
      patientMessage.className = "ai-message";
      patientMessage.textContent = reply;
      chatDisplay.appendChild(patientMessage);
    } catch (error) {
      console.error("Fetch error:", error);
    }

    userInput.value = "";
  });

  startButton.addEventListener("click", () => {
    const message = document.createElement("p");
    message.className = "system-message";
    message.textContent = "🚨 Scenario Started. Awaiting dispatch...";
    chatDisplay.appendChild(message);
  });

  endButton.addEventListener("click", () => {
    const message = document.createElement("p");
    message.className = "system-message";
    message.textContent = "✅ Scenario Ended.";
    chatDisplay.appendChild(message);
  });
});
