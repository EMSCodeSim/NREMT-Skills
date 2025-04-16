document.addEventListener("DOMContentLoaded", () => {
  const chatDisplay = document.getElementById("chat-display");
  const sendButton = document.getElementById("send-button");
  const startButton = document.getElementById("start-button");
  const userInput = document.getElementById("user-input");

  // Handle send button click
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
        body: JSON.stringify({ userInput: input }),
      });

      const data = await response.json();
      const reply = data.response || "I'm sorry, I can't respond right now.";

      const patientMessage = document.createElement("p");
      patientMessage.className = "patient-message";
      patientMessage.textContent = `Patient: ${reply}`;
      chatDisplay.appendChild(patientMessage);
    } catch (error) {
      const errorMessage = document.createElement("p");
      errorMessage.className = "patient-message";
      errorMessage.textContent = "Patient: I'm sorry, I can't respond right now.";
      chatDisplay.appendChild(errorMessage);
    }

    userInput.value = "";
    chatDisplay.scrollTop = chatDisplay.scrollHeight;
  });

  // Load and display dispatch info
  startButton.addEventListener("click", async () => {
    try {
      const res = await fetch("data/patients.json");
      const data = await res.json();
      const patient = data.patients[0];
      const dispatchMessage = `📟 Dispatch: Respond to a 45-year-old male complaining of chest pain. Patient is alert and diaphoretic at home.`;

      const dispatchEl = document.createElement("p");
      dispatchEl.className = "dispatch-message";
      dispatchEl.textContent = dispatchMessage;
      chatDisplay.appendChild(dispatchEl);
      chatDisplay.scrollTop = chatDisplay.scrollHeight;
    } catch (err) {
      const errorEl = document.createElement("p");
      errorEl.className = "patient-message";
      errorEl.textContent = "Unable to load scenario.";
      chatDisplay.appendChild(errorEl);
    }
  });
});
