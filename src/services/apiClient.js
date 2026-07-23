import { auth } from "../firebase";

const sendAuthenticatedRequest = async (url, options, forceRefresh) => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("Please sign in to use OrbitalAI.");
  }

  const token = await user.getIdToken(forceRefresh);
  const headers = new Headers(options?.headers || {});
  headers.set("Authorization", `Bearer ${token}`);

  return fetch(url, {
    ...options,
    headers,
  });
};

export const apiFetch = async (url, options = {}) => {
  let response = await sendAuthenticatedRequest(url, options, false);

  if (response.status === 401 && auth.currentUser) {
    response = await sendAuthenticatedRequest(url, options, true);
  }

  return response;
};

export const getApiErrorMessage = (data, fallbackMessage) => {
  if (data?.errorCode === "account_usage_limit" && data?.resetAt) {
    const resetDate = new Date(data.resetAt);

    if (!Number.isNaN(resetDate.getTime())) {
      const usageDescription =
        data.route === "read-file"
          ? `${data.limit || 30} document-reading requests`
          : `${data.limit || 24} AI messages`;
      const resetTime = new Intl.DateTimeFormat(undefined, {
        weekday: "short",
        day: "numeric",
        month: "short",
        hour: "numeric",
        minute: "2-digit",
        timeZoneName: "short",
      }).format(resetDate);

      return `You’ve reached your limit of ${usageDescription}. You can continue using OrbitalAI at ${resetTime}.`;
    }
  }

  return String(data?.error || fallbackMessage || "The request failed.");
};
