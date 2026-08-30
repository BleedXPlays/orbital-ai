/* global process */

import { verifyFirebaseIdToken } from "./_lib/apiSecurity.js";
import { captureServerError } from "./_lib/errorMonitoring.js";

const DEFAULT_SUPABASE_URL = "https://yffkeluziizwhwlvgtnh.supabase.co";
const WINDOW_HOURS = Math.max(1, Number.parseInt(process.env.USAGE_WINDOW_HOURS || process.env.CHAT_WINDOW_HOURS || "8", 10) || 8);
const LIMITS = {
  chat: Math.max(1, Number.parseInt(process.env.AI_MESSAGE_WINDOW_LIMIT || "24", 10) || 24),
  "read-file": Math.max(1, Number.parseInt(process.env.DOCUMENT_WINDOW_LIMIT || "30", 10) || 30),
};

const getToken = (request) => String(request.headers?.authorization || "").match(/^Bearer\s+(.+)$/i)?.[1]?.trim() || "";

export default async function handler(request, response) {
  response.setHeader("Cache-Control", "no-store");
  response.setHeader("Allow", "GET");
  if (request.method !== "GET") return response.status(405).json({ error: "Method not allowed." });

  try {
    const token = getToken(request);
    if (!token) return response.status(401).json({ error: "Please sign in to continue." });
    const user = await verifyFirebaseIdToken(token);
    const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
    const url = process.env.SUPABASE_URL || DEFAULT_SUPABASE_URL;
    if (!key) throw new Error("Supabase server configuration is missing.");

    const since = new Date(Date.now() - WINDOW_HOURS * 60 * 60 * 1000).toISOString();
    const query = new URLSearchParams({
      select: "route,created_at",
      user_id: `eq.${user.uid}`,
      created_at: `gte.${since}`,
      route: "in.(chat,read-file)",
      order: "created_at.asc",
    });
    const databaseResponse = await fetch(`${url}/rest/v1/api_usage_events?${query}`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    });
    if (!databaseResponse.ok) throw new Error(`Usage database request failed (${databaseResponse.status}).`);
    const events = await databaseResponse.json();
    const windowMilliseconds = WINDOW_HOURS * 60 * 60 * 1000;
    const makeSummary = (route) => {
      const routeEvents = events.filter((event) => event.route === route);
      const limit = LIMITS[route];
      return {
        limit,
        remaining: Math.max(0, limit - routeEvents.length),
        resetAt: routeEvents.length ? new Date(new Date(routeEvents[0].created_at).getTime() + windowMilliseconds).toISOString() : "",
      };
    };

    return response.status(200).json({ chat: makeSummary("chat"), documents: makeSummary("read-file"), windowHours: WINDOW_HOURS });
  } catch (error) {
    await captureServerError(error, { route: "usage", operation: "GET" });
    return response.status(500).json({ error: "OrbitalAI could not load usage information right now." });
  }
}
