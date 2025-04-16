async function testApi() {
  const input = document.getElementById("test-input").value || "Hello, who are you?";
  const resultBox = document.getElementById("test-result");

  try {
    const response = await fetch("/.netlify/functions/openai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userInput: input }),
    });

    const data = await response.json();
    resultBox.textContent = "✅ API Response:\n" + JSON.stringify(data, null, 2);
  } catch (err) {
    resultBox.textContent = "❌ ERROR calling API:\n" + err.message;
  }
}
