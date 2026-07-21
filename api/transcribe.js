/* global Buffer, process */

import OpenAI from "openai";
import { toFile } from "openai/uploads";
import { protectApiRoute } from "./_lib/apiSecurity.js";

const MAX_AUDIO_BYTES = 10 * 1024 * 1024;

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(request, response) {
  if (request.method !== "POST") {
    return response.status(405).json({
      error: "Method not allowed",
    });
  }

  const authenticatedUser = await protectApiRoute(request, response, {
    route: "transcribe",
    minuteLimit: 10,
    dailyLimit: 50,
  });
  if (!authenticatedUser) return;

  try {
    const { audioBase64, filename, mimeType } = request.body || {};

    if (!audioBase64) {
      return response.status(400).json({
        error: "Audio file is required.",
        errorCode: "audio_required",
      });
    }

    if (
      audioBase64.length % 4 === 1 ||
      !/^[a-z0-9+/]*={0,2}$/i.test(audioBase64)
    ) {
      return response.status(400).json({
        error: "The voice-note data is invalid. Record it again.",
        errorCode: "invalid_audio_data",
      });
    }

    const audioBuffer = Buffer.from(audioBase64, "base64");

    if (audioBuffer.length === 0) {
      return response.status(400).json({
        error: "The voice note is empty. Record it again.",
        errorCode: "empty_audio",
      });
    }

    if (audioBuffer.length > MAX_AUDIO_BYTES) {
      return response.status(413).json({
        error: "This voice note is larger than 10 MB. Record a shorter note.",
        errorCode: "audio_too_large",
      });
    }

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

    const transcriptText = String(transcription.text || "").trim();

    if (!transcriptText) {
      return response.status(422).json({
        error:
          "No speech could be detected. Try again in a quieter place and speak closer to the microphone.",
        errorCode: "no_speech_detected",
      });
    }

    return response.status(200).json({ text: transcriptText });
  } catch (error) {
    console.error("Transcription API error:", error);
    const status = Number(error?.status || 0);

    if (status === 401 || status === 403) {
      return response.status(503).json({
        error:
          "Voice transcription authentication failed. Check OPENAI_API_KEY in Vercel.",
        errorCode: "transcription_authentication",
      });
    }

    if (status === 429) {
      return response.status(429).json({
        error:
          "Voice transcription has reached its current usage limit. Wait briefly and try again.",
        errorCode: "transcription_rate_limit",
      });
    }

    if (status === 413) {
      return response.status(413).json({
        error: "The voice note is too large to transcribe.",
        errorCode: "audio_too_large",
      });
    }

    return response.status(500).json({
      error:
        "OrbitalAI could not transcribe this voice note. Check the recording and try again.",
      errorCode: "transcription_failed",
    });
  }
}
