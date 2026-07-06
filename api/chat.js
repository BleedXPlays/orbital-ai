import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const cleanAiText = (text = "") => {
  return text
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/#{1,6}\s/g, "")
    .replace(/`{1,3}/g, "")
    .trim();
};

export default async function handler(request, response) {
  if (request.method !== "POST") {
    return response.status(405).json({
      error: "Method not allowed",
    });
  }

  try {
    const { message, tasks, outputs, attachment } = request.body || {};

    if (!message && !attachment) {
      return response.status(400).json({
        error: "Message is required.",
      });
    }

    const taskSummary =
      tasks && tasks.length > 0
        ? tasks.map((item) => `${item.ai} → ${item.task}`).join(", ")
        : "General Answer";

    const outputSummary =
      outputs && outputs.length > 0
        ? outputs.map((item) => `${item[1]} (${item[2]})`).join(", ")
        : "Answer";

    const attachmentSummary = attachment
      ? `\nAttachment: ${attachment.name}, type: ${attachment.type}, kind: ${attachment.kind}`
      : "";

    const aiResponse = await client.responses.create({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "system",
          content:
            "You are OrbitalAI, a multi-AI collaboration workspace. Answer clearly and naturally in plain text only. Do not use markdown. Do not use asterisks. Do not use bold text. Do not use headings with symbols. Do not use hashtags. Do not use code formatting unless the user specifically asks for code. For simple factual questions, answer directly in one short paragraph. Do not add a 'Why this approach' section. Only mention AI routing when the user asks for a complex multi-step task.",
        },
        {
          role: "user",
          content: `User request: ${message}

Detected AI routing: ${taskSummary}

Expected output files: ${outputSummary}${attachmentSummary}`,
        },
      ],
    });

    const rawReply =
      aiResponse.output_text ||
      "OrbitalAI generated a response, but no text was returned.";

    return response.status(200).json({
      reply: cleanAiText(rawReply),
    });
  } catch (error) {
    console.error("OpenAI API error:", error);

    return response.status(500).json({
      error: "Failed to generate AI response.",
    });
  }
}