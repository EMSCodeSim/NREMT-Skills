// Chat interaction logic
document.getElementById("send-button").addEventListener("click", async () => {
  const userInput = document.getElementById("user-input").value;
  if (!userInput) return;

  // Display user input in the chat
  const chatDisplay = document.getElementById("chat-display");
  const userMessage = document.createElement("p");
  userMessage.className = "user-message";
  userMessage.textContent = `You: ${userInput}`;
  chatDisplay.appendChild(userMessage);

  // Get patient response from the serverless function
  try {
    const response = await fetch("/.netlify/functions/openai", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userInput }),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch response from serverless function");
    }

    const data = await response.json();
    const patientResponse = data.response;

    // Display patient response in the chat
    const patientMessage = document.createElement("p");
    patientMessage.className = "patient-message";
    patientMessage.textContent = `Patient: ${patientResponse}`;
    chatDisplay.appendChild(patientMessage);
  } catch (error) {
    console.error("Error fetching patient response:", error);
    const patientMessage = document.createElement("p");
    patientMessage.className = "patient-message";
    patientMessage.textContent = "Patient: I'm sorry, I can't respond right now.";
    chatDisplay.appendChild(patientMessage);
  }

  // Clear input field
  document.getElementById("user-input").value = "";

  // Scroll to the bottom of the chat display
  chatDisplay.scrollTop = chatDisplay.scrollHeight;
});
