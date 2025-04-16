document.getElementById("send-button").addEventListener("click", async () => {
  const userInput = document.getElementById("user-input").value.trim();
  if (!userInput) return;

  const chatDisplay = document.getElementById("chat-display");

  const userMessage = document.createElement("p");
  userMessage.className = "user-message";
  userMessage.textContent = `You: ${userInput}`;
  chatDisplay.appendChild(userMessage);

  try {
    const response = await fetch("/.netlify/functions/openai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userInput }),
    });

    const data = await response.json();
    console.log("GPT response:", data);

    const patientResponse = data.response || "I'm sorry, I can't respond right now.";

    const patientMessage = document.createElement("p");
    patientMessage.className = "patient-message";
    patientMessage.textContent = `Patient: ${patientResponse}`;
    chatDisplay.appendChild(patientMessage);
  } catch (error) {
    console.error("Error fetching patient response:", error);
    const errorMsg = document.createElement("p");
    errorMsg.className = "patient-message";
    errorMsg.textContent = "Patient: I'm sorry, I can't respond right now.";
    chatDisplay.appendChild(errorMsg);
  }

  document.getElementById("user-input").value = "";
  chatDisplay.scrollTop = chatDisplay.scrollHeight;
});
