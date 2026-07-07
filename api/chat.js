import { generateWithProvider } from "./providers/providerRouter.js";

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

    const result = await generateWithProvider({
      message,
      tasks,
      outputs,
      attachment,
    });

    return response.status(200).json(result);
  } catch (error) {
    console.error("OrbitalAI API error:", error);

    return response.status(500).json({
      error: "Failed to generate AI response.",
    });
  }
}