import { generateWithOpenAI } from "./openaiProvider.js";
import { generateWithClaude } from "./claudeProvider.js";
import { generateWithGemini } from "./geminiProvider.js";

const getProviderForRequest = ({ tasks = [], attachment, fileText }) => {
  const taskNames = Array.isArray(tasks)
    ? tasks.map((item) => item?.task).filter(Boolean)
    : [];

  if (
    attachment?.kind === "image" ||
    taskNames.includes("Visual Analysis")
  ) {
    return "gemini";
  }

  if (
    fileText ||
    taskNames.some((task) =>
      [
        "Document Analysis",
        "Coding",
        "Decision Support",
        "Research",
        "Writing",
        "Content Plan",
      ].includes(task)
    )
  ) {
    return "claude";
  }

  return "openai";
};

export const generateWithProvider = async ({
  message,
  tasks,
  outputs,
  attachment,
  fileText,
  conversationHistory,
  imageBase64,
  imageMimeType,
}) => {
  const provider = getProviderForRequest({ tasks, attachment, fileText });
  const providerInput = {
    message,
    tasks,
    outputs,
    attachment,
    fileText,
    conversationHistory,
    imageBase64,
    imageMimeType,
  };

  if (provider === "claude") {
    return generateWithClaude(providerInput);
  }

  if (provider === "gemini") {
    return generateWithGemini(providerInput);
  }

  return generateWithOpenAI(providerInput);
};
