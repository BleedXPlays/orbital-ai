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

  const isImageGeneration = tasks?.some(
    (item) => item?.task === "Image Generation"
  );

  if (isImageGeneration) {
    const model =
      process.env.GEMINI_IMAGE_MODEL || "gemini-3.1-flash-lite-image";
    const apiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent`,
      {
        signal: getProviderAbortSignal(),
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": process.env.GEMINI_API_KEY,
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: String(message || "").trim() }],
            },
          ],
          generationConfig: {
            responseModalities: ["IMAGE"],
            responseFormat: {
              image: {
                aspectRatio: "16:9",
                imageSize: "1K",
              },
            },
          },
        }),
      }
    );

    const data = await apiResponse.json();

    if (!apiResponse.ok) {
      const error = new Error(
        data?.error?.message || "Gemini could not generate the image."
      );
      error.status = apiResponse.status;
      error.code = data?.error?.status || "";
      throw error;
    }

    const responseParts = data?.candidates?.[0]?.content?.parts || [];
    const imageParts = responseParts.filter(
      (part) => !part?.thought && part?.inlineData?.data
    );
    const finalImage = imageParts[imageParts.length - 1];

    if (!finalImage) {
      const error = new Error("Gemini returned no generated image.");
      error.status = 502;
      error.code = "NO_IMAGE_OUTPUT";
      throw error;
    }

    return {
      reply: "Gemini generated your image successfully.",
      generatedOutputs: [
        {
          title: "Generated Image",
          content: "Open the image to preview or download it.",
        },
      ],
      generatedImages: [
        {
          data: finalImage.inlineData.data,
          mimeType: finalImage.inlineData.mimeType || "image/png",
        },
      ],
      provider: "gemini",
    };
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
