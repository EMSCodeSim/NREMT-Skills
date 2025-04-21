const { OpenAI } = require("openai");

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

exports.handler = async (event) => {
  try {
    const { input, voice = "nova" } = JSON.parse(event.body);

    const mp3 = await openai.audio.speech.create({
      model: "tts-1",
      voice,
      input,
    });

    const buffer = Buffer.from(await mp3.arrayBuffer());

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-cache"
      },
      body: buffer.toString("base64"),
      isBase64Encoded: true
    };
  } catch (error) {
    console.error("TTS Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "TTS failed" })
    };
  }
};
