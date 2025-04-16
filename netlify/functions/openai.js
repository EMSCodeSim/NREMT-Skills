const fs = require("fs");
const path = require("path");

exports.handler = async (event) => {
  try {
    const { userInput } = JSON.parse(event.body);
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    const fetch = (await import("node-fetch")).default;

    const patientFile = path.resolve(__dirname, "../../data/patients.json");
    const patientData = JSON.parse(fs.readFileSync(patientFile));
    const patient = patientData.patients[0];

    const lowerInput = userInput.toLowerCase();
    let prebuiltResponse = "";

    // 🧠 Proctor-style requests (scene/vitals/etc)
    if (lowerInput.includes("scene safe")) {
      prebuiltResponse = "Yes, the scene is safe and you see one patient sitting upright, alert.";
    } else if (lowerInput.includes("how many patients")) {
      prebuiltResponse = "There is one patient at the scene.";
    } else if (lowerInput.includes("breath sounds")) {
      prebuiltResponse = "You hear clear breath sounds bilaterally.";
    } else if (lowerInput.includes("pupils")) {
      prebuiltResponse = "Pupils are equal, round, and reactive to light.";
    } else if (lowerInput.includes("blood pressure")) {
      prebuiltResponse = `Blood pressure is ${patient.vitalSigns.bloodPressure}`;
    } else if (lowerInput.includes("pulse") || lowerInput.includes("heart rate")) {
      prebuiltResponse = `Pulse is ${patient.vitalSigns.heartRate} bpm`;
    } else if (lowerInput.includes("respirations")) {
      prebuiltResponse = `Respirations are ${patient.vitalSigns.respiratoryRate} per minute`;
    } else if (lowerInput.includes("oxygen") || lowerInput.includes("spo2")) {
      prebuiltResponse = `Oxygen saturation is ${patient.vitalSigns.oxygenSaturation}%`;
    }

    // ✅ If matched to proctor logic, return now
    if (prebuiltResponse) {
      return {
        statusCode: 200,
        body: JSON.stringify({ response: prebuiltResponse }),
      };
    }

    // 🧑 Patient-style questions (fallback to GPT)
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
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal Server Error" }),
    };
  }
};
