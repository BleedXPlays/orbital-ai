import { generateWithOpenAI } from "./openaiProvider.js";

const getPrimaryTask = (tasks = []) => {
  if (!Array.isArray(tasks) || tasks.length === 0) {
    return "General Answer";
  }

  return tasks[0]?.task || "General Answer";
};

const getProviderForTask = (task) => {
  const providerMap = {
    "General Answer": "openai",
    Research: "openai",
    Writing: "openai",
    Images: "openai",
    Coding: "openai",
    Presentation: "openai",
    Video: "openai",
    Translation: "openai",
    "Voice Input": "openai",
  };

  return providerMap[task] || "openai";
};

export const generateWithProvider = async ({
  message,
  tasks,
  outputs,
  attachment,
  fileText,
}) => {
  const primaryTask = getPrimaryTask(tasks);
  const provider = getProviderForTask(primaryTask);

  if (provider === "openai") {
    return generateWithOpenAI({
      message,
      tasks,
      outputs,
      attachment,
      fileText,
    });
  }

  return generateWithOpenAI({
    message,
    tasks,
    outputs,
    attachment,
    fileText,
  });
};