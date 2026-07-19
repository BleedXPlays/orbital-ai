import { generateWithOpenAI } from "./openaiProvider.js";
import { generateWithClaude } from "./claudeProvider.js";
import { generateWithGemini } from "./geminiProvider.js";

const PROVIDER_LABELS = {
  openai: "OpenAI",
  claude: "Claude",
  gemini: "Gemini",
};

export const getProviderForRequest = ({
  tasks = [],
  attachment,
  fileText,
}) => {
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

export const classifyProviderError = (error, provider) => {
  const message = String(error?.message || "").toLowerCase();
  const providerCode = String(error?.code || "").toLowerCase();
  const status = Number(error?.status || 0);

  if (message.includes("_api_key is not configured")) {
    return { provider, code: "configuration" };
  }

  if (
    message.includes("credit") ||
    message.includes("billing") ||
    message.includes("payment") ||
    message.includes("insufficient funds") ||
    providerCode.includes("billing") ||
    providerCode.includes("credit")
  ) {
    return { provider, code: "billing" };
  }

  if (
    status === 429 ||
    message.includes("rate limit") ||
    message.includes("resource_exhausted") ||
    message.includes("quota") ||
    providerCode.includes("rate_limit") ||
    providerCode.includes("resource_exhausted") ||
    providerCode.includes("quota")
  ) {
    return { provider, code: "rate_limit" };
  }

  if (
    status === 401 ||
    status === 403 ||
    message.includes("invalid api key") ||
    message.includes("authentication") ||
    providerCode.includes("authentication") ||
    providerCode.includes("permission") ||
    providerCode.includes("unauthorized")
  ) {
    return { provider, code: "authentication" };
  }

  if (
    status === 408 ||
    message.includes("timeout") ||
    message.includes("timed out") ||
    providerCode.includes("timeout")
  ) {
    return { provider, code: "timeout" };
  }

  return { provider, code: "unavailable" };
};

const getFallbackNotice = ({ provider, code }) => {
  const providerLabel = PROVIDER_LABELS[provider] || provider;

  if (code === "configuration") {
    return `${providerLabel} is not configured, so OpenAI handled this request.`;
  }

  if (code === "billing") {
    return `${providerLabel} credits or billing are unavailable, so OpenAI handled this request.`;
  }

  if (code === "rate_limit") {
    return `${providerLabel} reached its current usage limit, so OpenAI handled this request.`;
  }

  if (code === "authentication") {
    return `${providerLabel} authentication failed, so OpenAI handled this request.`;
  }

  if (code === "timeout") {
    return `${providerLabel} took too long to respond, so OpenAI handled this request.`;
  }

  return `${providerLabel} was temporarily unavailable, so OpenAI handled this request.`;
};

export const getProviderErrorResponse = (error) => {
  const failures = Array.isArray(error?.providerFailures)
    ? error.providerFailures
    : [
        classifyProviderError(error, error?.provider || "openai"),
      ];
  const failureDescriptions = failures.map(({ provider, code }) => {
    const label = PROVIDER_LABELS[provider] || provider;

    if (code === "configuration") {
      return `${label} is not configured`;
    }

    if (code === "authentication") {
      return `${label} authentication failed`;
    }

    if (code === "billing") {
      return `${label} credits or billing are unavailable`;
    }

    if (code === "rate_limit") {
      return `${label} reached its current usage limit`;
    }

    if (code === "timeout") {
      return `${label} timed out`;
    }

    return `${label} is temporarily unavailable`;
  });
  const finalFailure = failures[failures.length - 1];
  const responseDetails = {
    configuration: {
      status: 503,
      errorCode: "provider_configuration",
      action: "Check the provider API keys in Vercel.",
    },
    authentication: {
      status: 503,
      errorCode: "provider_authentication",
      action: "Check the provider API keys in Vercel.",
    },
    billing: {
      status: 402,
      errorCode: "provider_billing",
      action: "Check the provider billing or credit balance.",
    },
    rate_limit: {
      status: 429,
      errorCode: "provider_rate_limit",
      action: "Please wait briefly and try again.",
    },
    timeout: {
      status: 504,
      errorCode: "provider_timeout",
      action: "Please try again.",
    },
    unavailable: {
      status: 503,
      errorCode: "provider_unavailable",
      action: "Please try again.",
    },
  };
  const details =
    responseDetails[finalFailure?.code] || responseDetails.unavailable;

  return {
    status: details.status,
    error: `${failureDescriptions.join("; ")}. ${details.action}`,
    errorCode: details.errorCode,
  };
};

const defaultProviders = {
  openai: generateWithOpenAI,
  claude: generateWithClaude,
  gemini: generateWithGemini,
};

export const generateWithProvider = async (
  {
    message,
    tasks,
    outputs,
    attachment,
    fileText,
    fileName,
    conversationHistory,
    imageBase64,
    imageMimeType,
  },
  providers = defaultProviders
) => {
  const provider = getProviderForRequest({ tasks, attachment, fileText });
  const providerInput = {
    message,
    tasks,
    outputs,
    attachment,
    fileText,
    fileName,
    conversationHistory,
    imageBase64,
    imageMimeType,
  };

  try {
    return await providers[provider](providerInput);
  } catch (primaryError) {
    const primaryFailure = classifyProviderError(primaryError, provider);

    if (provider === "openai") {
      primaryError.provider = "openai";
      primaryError.providerFailures = [primaryFailure];
      throw primaryError;
    }

    try {
      const fallbackResult = await providers.openai(providerInput);

      return {
        ...fallbackResult,
        requestedProvider: provider,
        fallbackFrom: provider,
        fallbackReason: primaryFailure.code,
        providerNotice: getFallbackNotice(primaryFailure),
      };
    } catch (fallbackError) {
      const combinedError = new Error(
        `${PROVIDER_LABELS[provider]} and OpenAI could not complete the request.`
      );
      combinedError.providerFailures = [
        primaryFailure,
        classifyProviderError(fallbackError, "openai"),
      ];
      throw combinedError;
    }
  }
};
