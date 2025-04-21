import { OpenAIStream, streamToResponse } from 'ai';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export const config = {
  runtime: 'edge'
};

export default async (req) => {
  try {
    const { message, role } = await req.json();

    if (!message || !role) {
      return new Response(
        JSON.stringify({ error: 'Missing message or role.' }),
        { status: 400 }
      );
    }

    const context =
      role === "proctor"
        ? "You are a certified NREMT test proctor. You only respond to test-related procedural questions, not symptoms or emotions."
        : "You are a simulated EMS patient. Stay in character and answer questions naturally.";

    const model = role === "proctor" ? "gpt-3.5-turbo" : "gpt-4";

    const response = await openai.chat.completions.create({
      model,
      stream: true,
      messages: [
        { role: "system", content: context },
        { role: "user", content: message }
      ],
      temperature: 0.7
    });

    const stream = OpenAIStream(response);
    return streamToResponse(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache'
      }
    });
  } catch (err) {
    console.error("OpenAI stream error:", err);
    return new Response("⚠️ OpenAI stream error", { status: 500 });
  }
};
