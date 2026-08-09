import { auth } from "../firebase";
import { captureFrontendError } from "./errorMonitoring";

const getRouteName = (url) => {
  const value = String(url || "");
  const match = value.match(/\/api\/([^/?#]+)/);
  return match?.[1] || "api";
};

const sendAuthenticatedRequest = async (url, options, forceRefresh) => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("Please sign in to use OrbitalAI.");
  }

  const token = await user.getIdToken(forceRefresh);
  const headers = new Headers(options?.headers || {});
  headers.set("Authorization", `Bearer ${token}`);

  try {
    return await fetch(url, {
      ...options,
      headers,
    });
  } catch (error) {
    captureFrontendError(error, {
      tags: { area: "api", route: getRouteName(url), failure: "network" },
    });
    throw error;
  }
};

export const apiFetch = async (url, options = {}) => {
  let response = await sendAuthenticatedRequest(url, options, false);

  if (response.status === 401 && auth.currentUser) {
    response = await sendAuthenticatedRequest(url, options, true);
  }

  if (response.status >= 500) {
    captureFrontendError(
      new Error(`OrbitalAI API request failed with status ${response.status}`),
      {
        tags: {
          area: "api",
          route: getRouteName(url),
          status: response.status,
        },
      }
    );
  }

  const route = String(url).includes("/api/read-file")
    ? "read-file"
    : String(url).includes("/api/chat")
    ? "chat"
    : "";

  if (route && typeof window !== "undefined") {
    const limit = Number(response.headers.get("X-OrbitalAI-Limit"));
    const remaining = Number(response.headers.get("X-OrbitalAI-Remaining"));
    const resetAt = response.headers.get("X-OrbitalAI-Reset") || "";

    if (Number.isFinite(limit) && Number.isFinite(remaining)) {
      window.dispatchEvent(
        new CustomEvent("orbitalai:usage", {
          detail: { route, limit, remaining, resetAt },
        })
      );
    } else if (!response.ok) {
      try {
        const errorData = await response.clone().json();
        if (
          errorData?.errorCode === "account_usage_limit" &&
          Number.isFinite(Number(errorData.limit))
        ) {
          window.dispatchEvent(
            new CustomEvent("orbitalai:usage", {
              detail: {
                route,
                limit: Number(errorData.limit),
                remaining: 0,
                resetAt: String(errorData.resetAt || ""),
              },
            })
          );
        }
      } catch {
        // The caller still owns the original response body.
      }
    }
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
