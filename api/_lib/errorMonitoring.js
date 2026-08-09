/* global process */

import * as Sentry from "@sentry/node";

const SENTRY_DSN = String(
  process.env.SENTRY_DSN || process.env.VITE_SENTRY_DSN || ""
).trim();

let initialized = false;

const initialize = () => {
  if (!SENTRY_DSN || initialized) return Boolean(SENTRY_DSN);

  Sentry.init({
    dsn: SENTRY_DSN,
    enabled: process.env.NODE_ENV === "production" || Boolean(process.env.VERCEL),
    environment: process.env.VERCEL_ENV || process.env.NODE_ENV || "development",
    sendDefaultPii: false,
    tracesSampleRate: 0,
    beforeSend(event) {
      if (event.user) {
        event.user = event.user.id ? { id: event.user.id } : undefined;
      }
      if (event.request) {
        delete event.request.cookies;
        delete event.request.data;
        delete event.request.headers;
        delete event.request.query_string;
      }
      return event;
    },
  });
  initialized = true;
  return true;
};

export const captureServerError = async (error, context = {}) => {
  if (!initialize()) return;

  Sentry.withScope((scope) => {
    scope.setTag("orbitalai.route", String(context.route || "unknown").slice(0, 80));
    if (context.operation) {
      scope.setTag(
        "orbitalai.operation",
        String(context.operation).slice(0, 80)
      );
    }
    if (context.provider) {
      scope.setTag("orbitalai.provider", String(context.provider).slice(0, 40));
    }
    if (context.status) {
      scope.setTag("http.status_code", String(context.status).slice(0, 3));
    }
    Sentry.captureException(
      error instanceof Error ? error : new Error(String(error || "Unknown error"))
    );
  });

  await Sentry.flush(1500).catch(() => undefined);
};
