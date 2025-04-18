import { OpenAI } from "openai";
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Read stream manually
async function readBody(event) {
  const reader = event.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let result = "", done, value;
  while (!done) {
    ({ done, value } = await reader.read());
    result += decoder.decode(value || new Uint8Array(), { stream: !done });
  }
  return JSON.parse(result);
}

// Decide if message is for proctor or patient
function detectRole(message) {
  const lower = message.toLowerCase();
  const proctorTriggers = [
    "vitals", "blood pressure", "pulse", "respirations", "spo2", "pupils",
    "bgl", "skin", "transport", "i am giving", "i am administering",
    "i'm giving", "i’m administering", "asa", "nitro", "als", "scene safe",
    "what are the", "is the scene", "what is the", "i’m checking"
  ];

  return proctorTriggers.some(kw => lower.includes(kw)) ? "proctor" : "patient";
}

export default async (event) => {
  try {
    const body = await readBody(event);
    const { message } = body;
    const role = detectRole(message);

    let context = body.context;

    if (role === "proctor") {
      context = `
You are a NREMT test proctor. Your job is to observe and respond only when asked direct or procedural questions.

✅ If the user says “I am taking vitals,” ask which ones they want.
✅ Respond with BP, pulse, pupils, skin, BGL, etc., when appropriate.
✅ You may describe unseen patient actions (e.g., “patient begins coughing and collapses”).
✅ Never guide the user — only give requested data or feedback.
✅ At the end, give a score based on the NREMT Medical Assessment Skill Sheet and at least 3 improvement tips.
      `.trim();
    } else {
      context = `
You are simulating a realistic EMS patient. Respond as a conscious adult male with chest pain. Stay in character. Only answer what a patient would know.
      `.trim();
    }

    const model = role === "proctor" ? "gpt-3.5-turbo" : "gpt-4-turbo";

    const chat = await openai.chat.completions.create({
      model,
      messages: [
        { role: "system", content: context },
        { role: "user", content: message },
      ],
      temperature: 0.7,
    });

    const reply = chat?.choices?.[0]?.message?.content?.trim();

    return new Response(
      JSON.stringify({ response: reply || "⚠️ GPT returned no message." }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("❌ OpenAI Error:", err.message);
    return new Response(
      JSON.stringify({ response: "Error contacting ChatGPT", error: err.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
