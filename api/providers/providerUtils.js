/* global process */

export const cleanProviderText = (text = "") => {
  return String(text)
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/#{1,6}\s/g, "")
    .trim();
};

export const getProviderTimeoutMs = () => {
  const configured = Number.parseInt(
    process.env.PROVIDER_TIMEOUT_MS || "45000",
    10
  );
  return Math.min(120000, Math.max(5000, configured || 45000));
};

export const getProviderAbortSignal = () =>
  AbortSignal.timeout(getProviderTimeoutMs());

export const extractProviderJson = (text = "") => {
  try {
    return JSON.parse(text);
  } catch {
    const firstBrace = text.indexOf("{");
    const lastBrace = text.lastIndexOf("}");

    if (firstBrace === -1 || lastBrace === -1) return null;

    try {
      return JSON.parse(text.slice(firstBrace, lastBrace + 1));
    } catch {
      return null;
    }
  }
};

export const normalizeProviderResult = (rawText, provider) => {
  const parsed = extractProviderJson(rawText);

  if (!parsed) {
    return {
      reply:
        cleanProviderText(rawText) ||
        "OrbitalAI generated a response, but no text was returned.",
      generatedOutputs: [],
      provider,
    };
  }

  const generatedOutputs = Array.isArray(parsed.generatedOutputs)
    ? parsed.generatedOutputs
        .slice(0, 12)
        .filter((item) => item && item.title && item.content)
        .map((item) => ({
          title: cleanProviderText(item.title).slice(0, 200),
          content: cleanProviderText(item.content).slice(0, 80000),
        }))
    : [];

  return {
    reply:
      cleanProviderText(parsed.reply).slice(0, 50000) ||
      "OrbitalAI generated a response, but no text was returned.",
    generatedOutputs,
    provider,
  };
};

export const normalizeConversationHistory = (conversationHistory) => {
  if (!Array.isArray(conversationHistory)) return [];

  return conversationHistory
    .filter(
      (item) =>
        item &&
        (item.role === "user" || item.role === "assistant") &&
        item.content
    )
    .slice(-10)
    .map((item) => ({
      role: item.role,
      content: String(item.content).slice(0, 6000),
    }));
};

export const buildProviderRequest = ({
  message,
  tasks,
  outputs,
  attachment,
  fileText,
  fileName,
}) => {
  const taskSummary =
    Array.isArray(tasks) && tasks.length > 0
      ? tasks.map((item) => `${item.ai} → ${item.task}`).join(", ")
      : "General Answer";

  const requestedOutputs = Array.isArray(outputs)
    ? outputs.filter((item) => item[1] !== "Answer")
    : [];

  const outputInstructions =
    requestedOutputs.length > 0
      ? requestedOutputs.map((item) => `- ${item[1]}: ${item[2]}`).join("\n")
      : "No separate output cards are needed.";

  const attachmentSummary = attachment
    ? `\nAttachment: ${attachment.name}, type: ${attachment.type}, kind: ${attachment.kind}`
    : fileName
    ? `\nActive document: ${fileName}`
    : "";

  const fileTextBlock = fileText
    ? `\n\nThe content below is from the active/latest document${
        fileName ? ` named "${fileName}"` : ""
      }. For document-specific questions, use only this content unless the user explicitly asks to compare documents.\n\nReadable document content:\n${String(
        fileText
      ).slice(0, 70000)}`
    : "";

  return `User request: ${message}

Detected task routing: ${taskSummary}

Requested output cards:
${outputInstructions}${attachmentSummary}${fileTextBlock}

Return valid JSON only with this exact shape:
{"reply":"clear and complete main answer","generatedOutputs":[{"title":"exact requested output-card title","content":"useful content"}]}

Use conversation history for follow-up references. Match output-card titles exactly. For simple questions, return an empty generatedOutputs array. Never claim to have inspected content that was not provided.`;
};

export const PROVIDER_SYSTEM_PROMPT =
  "You are OrbitalAI, an assistant inside a three-provider AI workspace. Give a complete answer at the requested level of detail. Return valid JSON only and do not place markdown outside the JSON.";
