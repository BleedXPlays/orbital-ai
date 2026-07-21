import {
  generateWithProvider,
  getProviderErrorResponse,
} from "./providers/providerRouter.js";
import { protectApiRoute } from "./_lib/apiSecurity.js";

const MAX_MESSAGE_LENGTH = 20000;
const MAX_IMAGE_BASE64_LENGTH = 4 * 1024 * 1024;

export default async function handler(request, response) {
  if (request.method !== "POST") {
    return response.status(405).json({
      error: "Method not allowed",
    });
  }

  const authenticatedUser = await protectApiRoute(request, response, {
    route: "chat",
    minuteLimit: 15,
    dailyLimit: 75,
  });
  if (!authenticatedUser) return;

  try {
    const {
      message,
      tasks,
      outputs,
      attachment,
      fileText,
      fileName,
      conversationHistory,
      imageBase64,
      imageMimeType,
    } = request.body || {};

    if (!message && !attachment) {
      return response.status(400).json({
        error: "Message is required.",
        errorCode: "message_required",
      });
    }

    if (String(message || "").length > MAX_MESSAGE_LENGTH) {
      return response.status(413).json({
        error:
          "This message is too long. Shorten it to fewer than 20,000 characters.",
        errorCode: "message_too_long",
      });
    }

    if (
      imageBase64 &&
      String(imageBase64).length > MAX_IMAGE_BASE64_LENGTH
    ) {
      return response.status(413).json({
        error: "This image is too large. Upload an image smaller than 3 MB.",
        errorCode: "image_too_large",
      });
    }

    const result = await generateWithProvider({
      message,
      tasks,
      outputs,
      attachment,
      fileText,
      fileName,
      conversationHistory,
      imageBase64,
      imageMimeType,
    });

    return response.status(200).json(result);
  } catch (error) {
    console.error("OrbitalAI API error:", error);
    const providerError = getProviderErrorResponse(error);

    return response.status(providerError.status).json({
      error: providerError.error,
      errorCode: providerError.errorCode,
    });
  }
}
