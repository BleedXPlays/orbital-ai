import OpenAI from "openai";
import { toFile } from "openai/uploads";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(request, response) {
  if (request.method !== "POST") {
    return response.status(405).json({
      error: "Method not allowed",
    });
  }

  try {
    const { audioBase64, filename, mimeType } = request.body || {};

    if (!audioBase64) {
      return response.status(400).json({
        error: "Audio file is required.",
      });
    }

    const audioBuffer = Buffer.from(audioBase64, "base64");

    const audioFile = await toFile(
      audioBuffer,
      filename || "voice-note.webm",
      {
        type: mimeType || "audio/webm",
      }
    );

    const transcription = await client.audio.transcriptions.create({
      file: audioFile,
      model: "gpt-4o-mini-transcribe",
      response_format: "json",
    });

    return response.status(200).json({
      text: transcription.text || "",
    });
  } catch (error) {
    console.error("Transcription API error:", error);

    return response.status(500).json({
      error: "Failed to transcribe audio.",
    });
  }
}