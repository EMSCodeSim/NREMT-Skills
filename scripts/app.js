// OpenAI API Key (Replace with your actual API key)
const OPENAI_API_KEY = "YOUR_OPENAI_API_KEY";

// Function to call OpenAI API and get a response
async function getPatientResponse(userInput) {
  const openAiEndpoint = "https://api.openai.com/v1/completions";

  try {
    const response = await fetch(openAiEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "text-davinci-003",
        prompt: `You are roleplaying as a real patient in an EMS medical emergency simulation. Respond like a human patient. ${userInput}`,
        max_tokens: 100,
        temperature: 0.7
      })
    });

    const data = await response.json();
    return data.choices[0].text.trim();
  } catch (error) {
    console.error("Error fetching response from OpenAI:", error);
    return "I'm sorry, I can't respond right now.";
  }
}

// Chat interaction logic
document.getElementById('send-button').addEventListener('click', async () => {
  const userInput = document.getElementById('user-input').value;
  if (!userInput) return;

  // Display user input in the chat
  const chatDisplay = document.getElementById('chat-display');
  const userMessage = document.createElement('p');
  userMessage.className = 'user-message';
  userMessage.textContent = `You: ${userInput}`;
  chatDisplay.appendChild(userMessage);

  // Get patient response
  const patientResponse = await getPatientResponse(userInput);
  const patientMessage = document.createElement('p');
  patientMessage.className = 'patient-message';
  patientMessage.textContent = `Patient: ${patientResponse}`;
  chatDisplay.appendChild(patientMessage);

  // Clear input field
  document.getElementById('user-input').value = '';

  // Scroll to the bottom of the chat display
  chatDisplay.scrollTop = chatDisplay.scrollHeight;
});
