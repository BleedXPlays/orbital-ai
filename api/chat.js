import OpenAI from "openai";

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
            "You are OrbitalAI, a multi-AI collaboration workspace. Give a useful, clear answer to the user. Also briefly explain which AI roles are best suited for the task. Keep the answer practical and not too long.",
        },
        {
          role: "user",
          content: `User request: ${message}

Detected AI routing: ${taskSummary}

Expected output files: ${outputSummary}${attachmentSummary}`,
        },
      ],
    });

    return response.status(200).json({
      reply:
        aiResponse.output_text ||
        "OrbitalAI generated a response, but no text was returned.",
    });
  } catch (error) {
    console.error("OpenAI API error:", error);

    return response.status(500).json({
      error: "Failed to generate AI response.",
    });
  }
}