import { OpenAI } from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ✅ Read ReadableStream manually
async function parseRequestBody(stream) {
  const reader = stream.getReader();
  const decoder = new TextDecoder("utf-8");
  let result = "";
  let done, value;

  while (!done) {
    ({ done, value } = await reader.read());
    result += decoder.decode(value || new Uint8Array(), { stream: !done });
  }

  return JSON.parse(result);
}

export default async (event) => {
  try {
    const body = await parseRequestBody(event.body);
    const { message, role, context } = body;

    console.log("📦 Parsed message:", message);
    console.log("📦 Parsed role:", role);
    console.log("📦 Parsed context:", context);

    if (!message || !role || !context) {
      console.error("❌ Missing one of: message, role, or context");
      return new Response(
        JSON.stringify({ response: "Missing message, role, or context." }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
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
      JSON.stringify({
        response: "There was an error contacting ChatGPT.",
        error: err.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
