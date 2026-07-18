/* global process */

import {
  buildProviderRequest,
  normalizeConversationHistory,
  normalizeProviderResult,
  PROVIDER_SYSTEM_PROMPT,
} from "./providerUtils.js";

export const generateWithClaude = async ({
  message,
  tasks,
  outputs,
  attachment,
  fileText,
  conversationHistory,
}) => {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY is not configured.");
  }

  const history = normalizeConversationHistory(conversationHistory);
  const prompt = buildProviderRequest({
    message,
    tasks,
    outputs,
    attachment,
    fileText,
  });

  const apiResponse = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || "claude-sonnet-5",
      max_tokens: 4096,
      system: PROVIDER_SYSTEM_PROMPT,
      messages: [
        ...history,
        {
          role: "user",
          content: prompt,
        },
      ],
    }),
  });

  const data = await apiResponse.json();

  if (!apiResponse.ok) {
    throw new Error(
      data?.error?.message || "Claude could not generate a response."
    );
  }

  const rawText = Array.isArray(data.content)
    ? data.content
        .filter((item) => item?.type === "text")
        .map((item) => item.text)
        .join("\n")
    : "";

  return normalizeProviderResult(rawText, "claude");
};
