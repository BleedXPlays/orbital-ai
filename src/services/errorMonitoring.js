import * as Sentry from "@sentry/react";

const SENTRY_DSN = String(import.meta.env.VITE_SENTRY_DSN || "").trim();
const SENSITIVE_KEYS =
  /authorization|cookie|password|token|secret|prompt|message|filetext|base64/i;

const sanitizeValue = (value, depth = 0) => {
  if (depth > 3) return "[truncated]";
  if (Array.isArray(value)) {
    return value.slice(0, 20).map((item) => sanitizeValue(item, depth + 1));
  }
  if (!value || typeof value !== "object") return value;

  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => !SENSITIVE_KEYS.test(key))
      .slice(0, 30)
      .map(([key, item]) => [key, sanitizeValue(item, depth + 1)])
  );
};

const stripUrlDetails = (value) => {
  try {
    const url = new URL(value, window.location.origin);
    return `${url.origin}${url.pathname}`;
  } catch {
    return String(value || "").split(/[?#]/)[0];
  }
};

export const initErrorMonitoring = () => {
  if (!SENTRY_DSN) return false;

  Sentry.init({
    dsn: SENTRY_DSN,
    enabled: import.meta.env.PROD,
    environment: import.meta.env.MODE,
    sendDefaultPii: false,
    tracesSampleRate: 0,
    beforeSend(event) {
      if (event.user) {
        event.user = event.user.id ? { id: event.user.id } : undefined;
      }
      if (event.request) {
        event.request.url = stripUrlDetails(event.request.url);
        delete event.request.cookies;
        delete event.request.data;
        delete event.request.headers;
        delete event.request.query_string;
      }
      event.extra = sanitizeValue(event.extra);
      return event;
    },
  });

  return true;
};

export const captureFrontendError = (error, context = {}) => {
  if (!SENTRY_DSN || !import.meta.env.PROD) return;

  Sentry.withScope((scope) => {
    Object.entries(context.tags || {}).forEach(([key, value]) => {
      scope.setTag(key, String(value).slice(0, 100));
    });
    scope.setContext("orbitalai", sanitizeValue(context.extra || {}));
    Sentry.captureException(
      error instanceof Error ? error : new Error(String(error || "Unknown error"))
    );
  });
};

export { Sentry };
