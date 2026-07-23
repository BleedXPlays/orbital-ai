/* global process */

import {
  buildProviderRequest,
  normalizeConversationHistory,
  normalizeProviderResult,
  PROVIDER_SYSTEM_PROMPT,
  getProviderAbortSignal,
} from "./providerUtils.js";

export const generateWithClaude = async ({
  message,
  tasks,
  outputs,
  attachment,
  fileText,
  fileName,
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
    fileName,
  });
  const maxTokens = Math.min(
    8192,
    Math.max(512, Number(process.env.CLAUDE_MAX_TOKENS) || 4096)
  );

  const apiResponse = await fetch("https://api.anthropic.com/v1/messages", {
    signal: getProviderAbortSignal(),
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || "claude-sonnet-5",
      max_tokens: maxTokens,
      system: PROVIDER_SYSTEM_PROMPT,
      tools: [
        {
          name: "return_orbital_response",
          description:
            "Return the final OrbitalAI reply and any requested generated output cards.",
          input_schema: {
            type: "object",
            properties: {
              reply: {
                type: "string",
                description: "The clear and complete main answer.",
              },
              generatedOutputs: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    title: {
                      type: "string",
                    },
                    content: {
                      type: "string",
                    },
                  },
                  required: ["title", "content"],
                  additionalProperties: false,
                },
              },
            },
            required: ["reply", "generatedOutputs"],
            additionalProperties: false,
          },
        },
      ],
      tool_choice: {
        type: "tool",
        name: "return_orbital_response",
      },
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
    const error = new Error(
      data?.error?.message || "Claude could not generate a response."
    );
    error.status = apiResponse.status;
    error.code = data?.error?.type || "";
    throw error;
  }

  const structuredResponse = Array.isArray(data.content)
    ? data.content.find(
        (item) =>
          item?.type === "tool_use" &&
          item?.name === "return_orbital_response" &&
          item?.input
      )?.input
    : null;

  if (structuredResponse) {
    return normalizeProviderResult(
      JSON.stringify(structuredResponse),
      "claude"
    );
  }

  if (data?.stop_reason === "max_tokens") {
    throw new Error(
      "Claude reached the response limit before finishing its answer."
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
