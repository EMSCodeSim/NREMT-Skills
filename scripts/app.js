console.log("✅ app.js loaded");

document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ DOM loaded");

  const display = document.getElementById("chat-display");
  const input = document.getElementById("user-input");
  const sendBtn = document.getElementById("send-button");
  const scenarioBtn = document.getElementById("scenario-button");
  const endBtn = document.getElementById("end-button");

  sendBtn.addEventListener("click", () => {
    const message = input.value.trim();
    if (message !== "") {
      display.innerHTML += `<div><strong>You:</strong> ${message}</div>`;
      input.value = "";
    }
  });

  scenarioBtn.addEventListener("click", () => {
    display.innerHTML += `<div><em>Scenario started...</em></div>`;
  });

  endBtn.addEventListener("click", () => {
    display.innerHTML += `<div><em>Scenario ended.</em></div>`;
  });
});
