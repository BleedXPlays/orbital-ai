/* global Buffer, process */

import {
  generateWithProvider,
  getProviderErrorResponse,
} from "./providers/providerRouter.js";
import { protectApiRoute } from "./_lib/apiSecurity.js";

const MAX_MESSAGE_LENGTH = 20000;
const MAX_REQUEST_BYTES = 6 * 1024 * 1024;
const MAX_IMAGE_BASE64_LENGTH = 4 * 1024 * 1024;
const MAX_FILE_TEXT_LENGTH = 50000;
const MAX_FILENAME_LENGTH = 255;
const MAX_TASKS = 12;
const MAX_OUTPUTS = 12;
const MAX_HISTORY_ITEMS = 12;
const MAX_HISTORY_ITEM_LENGTH = 6000;
const MAX_HISTORY_TOTAL_LENGTH = 50000;
const IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);
const AI_MESSAGE_WINDOW_LIMIT =
  Number.parseInt(process.env.AI_MESSAGE_WINDOW_LIMIT || "24", 10) || 24;
const USAGE_WINDOW_HOURS =
  Number.parseInt(
    process.env.USAGE_WINDOW_HOURS ||
      process.env.CHAT_WINDOW_HOURS ||
      "8",
    10
  ) || 8;

const reject = (response, status, error, errorCode) =>
  response.status(status).json({ error, errorCode });

const isBoundedString = (value, maxLength, { allowEmpty = true } = {}) =>
  typeof value === "string" &&
  value.length <= maxLength &&
  (allowEmpty || value.trim().length > 0);

const hasControlCharacters = (value) =>
  [...String(value || "")].some((character) => {
    const code = character.charCodeAt(0);
    return code <= 31 || code === 127;
  });

const isSafeFilename = (value) =>
  value === undefined ||
  value === null ||
  (isBoundedString(value, MAX_FILENAME_LENGTH) &&
    !hasControlCharacters(value) &&
    !value.includes("/") &&
    !value.includes("\\"));

const validateChatBody = (body, response) => {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return reject(
      response,
      400,
      "The request body is invalid.",
      "invalid_request_body"
    );
  }

  let requestBytes;
  try {
    requestBytes = Buffer.byteLength(JSON.stringify(body), "utf8");
  } catch {
    return reject(
      response,
      400,
      "The request body is invalid.",
      "invalid_request_body"
    );
  }
  if (requestBytes > MAX_REQUEST_BYTES) {
    return reject(
      response,
      413,
      "This request is too large. Remove or reduce its attachments.",
      "request_too_large"
    );
  }

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
  } = body;

  if (
    message !== undefined &&
    message !== null &&
    !isBoundedString(message, MAX_MESSAGE_LENGTH)
  ) {
    return reject(
      response,
      413,
      "This message is too long. Shorten it to fewer than 20,000 characters.",
      "message_too_long"
    );
  }

  if (fileText !== undefined && !isBoundedString(fileText, MAX_FILE_TEXT_LENGTH)) {
    return reject(
      response,
      413,
      "The extracted document text is too large.",
      "file_text_too_large"
    );
  }

  if (!isSafeFilename(fileName)) {
    return reject(
      response,
      400,
      "The document filename is invalid.",
      "invalid_filename"
    );
  }

  if (
    tasks !== undefined &&
    (!Array.isArray(tasks) ||
      tasks.length > MAX_TASKS ||
      tasks.some(
        (item) =>
          !item ||
          typeof item !== "object" ||
          Array.isArray(item) ||
          !isBoundedString(item.ai, 80, { allowEmpty: false }) ||
          !isBoundedString(item.task, 120, { allowEmpty: false })
      ))
  ) {
    return reject(
      response,
      400,
      "The task routing data is invalid.",
      "invalid_tasks"
    );
  }

  if (
    outputs !== undefined &&
    (!Array.isArray(outputs) ||
      outputs.length > MAX_OUTPUTS ||
      outputs.some(
        (item) =>
          !Array.isArray(item) ||
          item.length < 3 ||
          item.length > 4 ||
          item.some(
            (value, index) =>
              typeof value !== "string" ||
              value.length >
              (index === 2 ? 500 : index === 3 ? 80000 : 200)
          )
      ))
  ) {
    return reject(
      response,
      400,
      "The requested output data is invalid.",
      "invalid_outputs"
    );
  }

  if (
    attachment !== undefined &&
    attachment !== null &&
    (typeof attachment !== "object" ||
      Array.isArray(attachment) ||
      !isSafeFilename(attachment.name) ||
      !isBoundedString(attachment.type || "", 120) ||
      !["", "file", "image", "voice"].includes(attachment.kind || "") ||
      (attachment.size !== undefined &&
        (!Number.isFinite(attachment.size) ||
          attachment.size < 0 ||
          attachment.size > 10 * 1024 * 1024)))
  ) {
    return reject(
      response,
      400,
      "The attachment metadata is invalid.",
      "invalid_attachment"
    );
  }

  if (
    conversationHistory !== undefined &&
    (!Array.isArray(conversationHistory) ||
      conversationHistory.length > MAX_HISTORY_ITEMS ||
      conversationHistory.some(
        (item) =>
          !item ||
          typeof item !== "object" ||
          Array.isArray(item) ||
          !["user", "assistant"].includes(item.role) ||
          !isBoundedString(item.content, MAX_HISTORY_ITEM_LENGTH, {
            allowEmpty: false,
          })
      ) ||
      conversationHistory.reduce(
        (total, item) => total + item.content.length,
        0
      ) > MAX_HISTORY_TOTAL_LENGTH)
  ) {
    return reject(
      response,
      400,
      "The conversation history is invalid or too large.",
      "invalid_conversation_history"
    );
  }

  if (
    imageBase64 !== undefined &&
    (!isBoundedString(imageBase64, MAX_IMAGE_BASE64_LENGTH) ||
      (imageBase64 &&
        (imageBase64.length % 4 === 1 ||
          !/^[a-z0-9+/]*={0,2}$/i.test(imageBase64))))
  ) {
    return reject(
      response,
      413,
      "This image is invalid or too large. Upload an image smaller than 3 MB.",
      "image_too_large"
    );
  }

  if (
    imageBase64 &&
    (!IMAGE_MIME_TYPES.has(String(imageMimeType || "").toLowerCase()) ||
      attachment?.kind !== "image")
  ) {
    return reject(
      response,
      400,
      "The image type is not supported.",
      "invalid_image_type"
    );
  }

  if (!String(message || "").trim() && !attachment) {
    return reject(
      response,
      400,
      "Message is required.",
      "message_required"
    );
  }

  return null;
};

export default async function handler(request, response) {
  if (request.method !== "POST") {
    return response.status(405).json({
      error: "Method not allowed",
    });
  }

  const validationResponse = validateChatBody(request.body, response);
  if (validationResponse) return validationResponse;

  const authenticatedUser = await protectApiRoute(request, response, {
    route: "chat",
    minuteLimit: 15,
    windowLimit: Math.max(1, AI_MESSAGE_WINDOW_LIMIT),
    windowHours: Math.max(1, USAGE_WINDOW_HOURS),
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
    console.error("OrbitalAI API error:", {
      name: String(error?.name || "Error").slice(0, 80),
      status: Number(error?.status || 0),
      code: String(error?.code || "").slice(0, 80),
      provider: String(error?.provider || "").slice(0, 40),
    });
    const providerError = getProviderErrorResponse(error);

    return response.status(providerError.status).json({
      error: providerError.error,
      errorCode: providerError.errorCode,
    });
  }
}
