import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const cleanAiText = (text = "") => {
  return String(text)
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/#{1,6}\s/g, "")
    .replace(/`{1,3}/g, "")
    .trim();
};

const extractJson = (text = "") => {
  try {
    return JSON.parse(text);
  } catch {
    const firstBrace = text.indexOf("{");
    const lastBrace = text.lastIndexOf("}");

    if (firstBrace === -1 || lastBrace === -1) {
      return null;
    }

    try {
      return JSON.parse(text.slice(firstBrace, lastBrace + 1));
    } catch {
      return null;
    }
  }
};

const buildPromptData = ({ message, tasks, outputs, attachment, fileText }) => {
  const taskSummary =
    tasks && tasks.length > 0
      ? tasks.map((item) => `${item.ai} → ${item.task}`).join(", ")
      : "General Answer";

  const outputSummary =
    outputs && outputs.length > 0
      ? outputs.map((item) => `${item[1]} (${item[2]})`).join(", ")
      : "Answer";

  const nonGeneralOutputs = Array.isArray(outputs)
    ? outputs.filter((item) => item[1] !== "Answer")
    : [];

  const outputInstructions =
    nonGeneralOutputs.length > 0
      ? nonGeneralOutputs.map((item) => `- ${item[1]}: ${item[2]}`).join("\n")
      : "No separate output cards are needed for this request.";

  const attachmentSummary = attachment
    ? `\nAttachment: ${attachment.name}, type: ${attachment.type}, kind: ${attachment.kind}`
    : "";

  const fileTextBlock = fileText
    ? `\n\nReadable file content:\n${String(fileText).slice(0, 45000)}`
    : "";

  return {
    taskSummary,
    outputSummary,
    outputInstructions,
    attachmentSummary,
    fileTextBlock,
  };
};

export const generateWithOpenAI = async ({
  message,
  tasks,
  outputs,
  attachment,
  fileText,
  conversationHistory,
}) => {
  const {
    taskSummary,
    outputSummary,
    outputInstructions,
    attachmentSummary,
    fileTextBlock,
  } = buildPromptData({
    message,
    tasks,
    outputs,
    attachment,
    fileText,
  });

  const historyInput = Array.isArray(conversationHistory)
    ? conversationHistory
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
        }))
    : [];

  const aiResponse = await client.responses.create({
    model: "gpt-4.1-mini",
    input: [
      {
        role: "system",
        content:
          "You are OrbitalAI, a multi-AI collaboration workspace. Use the conversation history to resolve follow-up references such as 'that', 'it', and 'the previous answer'. Return valid JSON only. Do not use markdown outside JSON. The JSON must have this exact shape: {\"reply\":\"clear and complete main answer\",\"generatedOutputs\":[{\"title\":\"Research Notes\",\"content\":\"real content for this output\"}]}. Match every generated output title exactly to one of the requested output-card names. Give a detailed answer when the user asks for detail, and shorten it only when requested. For simple factual questions, keep generatedOutputs as an empty array. For multi-output tasks, create useful separate content for each requested output card. If readable file content is provided, answer using that file content. If the user asks about the uploaded file, base the answer on the readable file content and do not pretend to know unreadable parts. Image-related outputs must be text prompts or visual ideas only, because real Gemini image generation is not connected yet. Do not claim that images, slides, videos, or files were actually created.",
      },
      ...historyInput,
      {
        role: "user",
        content: `User request: ${message}

Detected AI routing: ${taskSummary}

Expected output cards:
${outputInstructions}

Expected output summary: ${outputSummary}${attachmentSummary}${fileTextBlock}

Return only JSON.`,
      },
    ],
  });

  const rawText =
    aiResponse.output_text ||
    JSON.stringify({
      reply: "OrbitalAI generated a response, but no text was returned.",
      generatedOutputs: [],
    });

  const parsed = extractJson(rawText);

  if (!parsed) {
    return {
      reply: cleanAiText(rawText),
      generatedOutputs: [],
      provider: "openai",
    };
  }

  const generatedOutputs = Array.isArray(parsed.generatedOutputs)
    ? parsed.generatedOutputs
        .filter((item) => item && item.title && item.content)
        .map((item) => ({
          title: cleanAiText(item.title),
          content: cleanAiText(item.content),
        }))
    : [];

  return {
    reply:
      cleanAiText(parsed.reply) ||
      "OrbitalAI generated a response, but no text was returned.",
    generatedOutputs,
    provider: "openai",
  };
};
