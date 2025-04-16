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
    const patient = patientData.patients[0]; // Static for now

    const lowerInput = userInput.toLowerCase();
    let prebuiltResponse = "";

    if (lowerInput.includes("blood pressure")) {
      prebuiltResponse = `My blood pressure is ${patient.vitalSigns.bloodPressure}`;
    } else if (lowerInput.includes("pulse") || lowerInput.includes("heart rate")) {
      prebuiltResponse = `My pulse is ${patient.vitalSigns.heartRate} beats per minute.`;
    } else if (lowerInput.includes("respirations")) {
      prebuiltResponse = `I'm breathing about ${patient.vitalSigns.respiratoryRate} times per minute.`;
    } else if (lowerInput.includes("oxygen") || lowerInput.includes("spo2")) {
      prebuiltResponse = `My oxygen level is ${patient.vitalSigns.oxygenSaturation}%`;
    } else if (lowerInput.includes("medications")) {
      prebuiltResponse = `I take ${patient.history.medications}.`;
    } else if (lowerInput.includes("allergies")) {
      prebuiltResponse = `I have ${patient.history.allergies} allergies.`;
    } else if (lowerInput.includes("history")) {
      prebuiltResponse = `I have a history of ${patient.history.pastMedicalHistory.join(", ")}.`;
    }

    if (prebuiltResponse) {
      return {
        statusCode: 200,
        body: JSON.stringify({ response: prebuiltResponse }),
      };
    }

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
            content: "You are a 45-year-old EMS patient named John Doe. You are anxious, diaphoretic, and complaining of chest pain. Only respond like a real patient. Don't act like a chatbot or provide vitals unless asked.",
          },
          {
            role: "user",
            content: userInput,
          }
        ],
        temperature: 0.7,
        max_tokens: 150
      }),
    });

    const result = await response.json();
    const gptReply = result?.choices?.[0]?.message?.content?.trim() || "I don't know how to respond.";

    return {
      statusCode: 200,
      body: JSON.stringify({ response: gptReply }),
    };

  } catch (error) {
    console.error("OpenAI Function Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal Server Error" }),
    };
  }
};
