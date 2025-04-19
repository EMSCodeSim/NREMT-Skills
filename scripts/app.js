document.getElementById("send-button").addEventListener("click", sendUserInput);
document.getElementById("user-input").addEventListener("keydown", function (e) {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendUserInput();
  }
});

function sendUserInput() {
  const input = document.getElementById("user-input");
  const message = input.value.trim();
  if (message) {
    appendMessage("You", message);
    input.value = "";

    fetch("/.netlify/functions/openai", {
      method: "POST",
      body: JSON.stringify({
        message: message,
        role: "user"
      })
    })
      .then(res => res.json())
      .then(data => {
        appendMessage("Patient", data.response);
      })
      .catch(err => {
        appendMessage("System", "❌ Error getting response.");
        console.error(err);
      });
  }
}
