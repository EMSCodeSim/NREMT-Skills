console.log("✅ app.js loaded");

document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ DOM loaded");

  const chatBox = document.getElementById("chat-display");
  const input = document.getElementById("user-input");
  const sendButton = document.getElementById("send-button");
  const startButton = document.getElementById("scenario-button");
  const endButton = document.getElementById("end-button");

  sendButton.addEventListener("click", () => {
    const message = input.value.trim();
    if (message !== "") {
      chatBox.innerHTML += `<div><strong>You:</strong> ${message}</div>`;
      input.value = "";
    }
  });

  startButton.addEventListener("click", () => {
    chatBox.innerHTML += `<div><em>Scenario started...</em></div>`;
  });

  endButton.addEventListener("click", () => {
    chatBox.innerHTML += `<div><em>Scenario ended.</em></div>`;
  });
});
