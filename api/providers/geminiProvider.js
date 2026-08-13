/* global process */

import {
  buildProviderRequest,
  normalizeConversationHistory,
  normalizeProviderResult,
  PROVIDER_SYSTEM_PROMPT,
  getProviderAbortSignal,
} from "./providerUtils.js";

export const generateWithGemini = async ({
  message,
  tasks,
  outputs,
  attachment,
  fileText,
  fileName,
  conversationHistory,
  imageBase64,
  imageMimeType,
}) => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  const history = normalizeConversationHistory(conversationHistory).map(
    (item) => ({
      role: item.role === "assistant" ? "model" : "user",
      parts: [{ text: item.content }],
    })
  );

  const userParts = [];

  if (imageBase64) {
    userParts.push({
      inline_data: {
        mime_type: imageMimeType || attachment?.type || "image/jpeg",
        data: imageBase64,
      },
    });
  }

  userParts.push({
    text: buildProviderRequest({
      message,
      tasks,
      outputs,
      attachment,
      fileText,
      fileName,
    }),
  });

  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const apiResponse = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      signal: getProviderAbortSignal(),
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": process.env.GEMINI_API_KEY,
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: PROVIDER_SYSTEM_PROMPT }],
        },
        contents: [
          ...history,
          {
            role: "user",
            parts: userParts,
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
        },
      }),
    }
  );

  const data = await apiResponse.json();

  if (!apiResponse.ok) {
    const error = new Error(
      data?.error?.message || "Gemini could not generate a response."
    );
    error.status = apiResponse.status;
    error.code = data?.error?.status || "";
    throw error;
  }

  const rawText =
    data?.candidates?.[0]?.content?.parts
      ?.map((part) => part.text || "")
      .join("\n") || "";

  return normalizeProviderResult(rawText, "gemini");
};
