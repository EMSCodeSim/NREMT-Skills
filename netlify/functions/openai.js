const fs = require("fs");
const path = require("path");
const fetch = require("node-fetch");

exports.handler = async (event) => {
  try {
    const { userInput } = JSON.parse(event.body);

    if (!userInput) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "User input is required" }),
      };
    }

    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    const patientFile = path.resolve(__dirname, "../../data/patients.json");
    const patientData = JSON.parse(fs.readFileSync(patientFile));
    const patient = patientData.patients[0]; // You can randomize or select based on ID later

    // Prebuilt logic for EMS vitals/history questions
    const lowerInput = userInput.toLowerCase();
    let prebuiltResponse = "";

    if (lowerInput.includes("blood pressure")) {
      prebuiltResponse = `My blood pressure is ${patient.vitalSigns.bloodPressure}`;
    } else if (lowerInput.includes("pulse") || lowerInput.includes("heart rate")) {
      prebuiltResponse = `My pulse is ${patient.vitalSigns.heartRate} beats per minute.`;
    } else if (lowerInput.includes("respirations")) {
      prebuiltResponse = `I'm breathing about ${patient.vitalSigns.respiratoryRate} times per minute.`;
    } else if (lowerInput.includes("oxygen") || lowerInput.includes("saturation") || lowerInput.includes("spo2")) {
      prebuiltResponse = `My oxygen level is ${patient.vitalSigns.oxygenSaturation}%`;
    } else if (lowerInput.includes("medications")) {
      prebuiltResponse = `I take ${patient.history.medications}`;
    } else if (lowerInput.includes("allergies")) {
      prebuiltResponse = `I have ${patient.history.allergies} allergies.`;
    } else if (lowerInput.includes("history")) {
      prebuiltResponse = `I have a history of ${patient.history.pastMedicalHistory.join(", ")}`;
    }

    // If a prebuilt answer was found, return it
    if (prebuiltResponse) {
      return {
        statusCode: 200,
        body: JSON.stringify({ response: prebuiltResponse }),
      };
    }

    // Else call GPT-4 Turbo for advanced/emotional answers
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4-turbo",
        messages: [
          {
            role: "system",
            content: `You are roleplaying as a 45-year-old male EMS patient with chest pain. 
Your name is John Doe. You appear anxious and diaphoretic. Respond emotionally and realistically as a patient. Do not act like a chatbot. Don't provide vitals unless asked.
Only answer when spoken to.`,
          },
          {
            role: "user",
            content: userInput
          }
        ],
        temperature: 0.7,
        max_tokens: 150
      }),
    });

    const result = await response.json();

    const gptReply = result?.choices?.[0]?.message?.content?.trim() || "I'm not sure how to respond to that.";

    return {
      statusCode: 200,
      body: JSON.stringify({ response: gptReply }),
    };

  } catch (error) {
    console.error("Error during OpenAI API call:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal Server Error" }),
    };
  }
};
