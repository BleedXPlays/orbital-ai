/* global Buffer, process */

import { verifyFirebaseIdToken } from "./_lib/apiSecurity.js";
import { captureServerError } from "./_lib/errorMonitoring.js";

const DEFAULT_SUPABASE_URL = "https://yffkeluziizwhwlvgtnh.supabase.co";
const CATEGORIES = new Set(["bug", "complaint", "feature_request", "other"]);
const STATUSES = new Set(["new", "reviewing", "resolved", "closed"]);
const PRIORITIES = new Set(["low", "normal", "high", "urgent"]);

const reject = (response, status, error, errorCode) =>
  response.status(status).json({ error, errorCode });

const getToken = (request) =>
  String(request.headers?.authorization || "").match(/^Bearer\s+(.+)$/i)?.[1]?.trim() || "";

const getAdminUids = () =>
  new Set(
    String(process.env.ORBITAL_ADMIN_UIDS || "")
      .split(",")
      .map((uid) => uid.trim())
      .filter(Boolean)
  );

const requestSupabase = async (path, options = {}) => {
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  const url = process.env.SUPABASE_URL || DEFAULT_SUPABASE_URL;
  if (!key) throw new Error("Supabase server configuration is missing.");

  const response = await fetch(`${url}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Reports database request failed (${response.status}): ${details.slice(0, 300)}`);
  }

  if (response.status === 204) return null;
  return response.json();
};

const cleanText = (value, maximum) => String(value || "").trim().slice(0, maximum);

export default async function handler(request, response) {
  response.setHeader("Cache-Control", "no-store");
  response.setHeader("Allow", "GET, POST, PATCH");

  if (!["GET", "POST", "PATCH"].includes(request.method)) {
    return reject(response, 405, "Method not allowed.", "method_not_allowed");
  }

  try {
    const token = getToken(request);
    if (!token) return reject(response, 401, "Please sign in to continue.", "authentication_required");

    const user = await verifyFirebaseIdToken(token);
    const isAdmin = getAdminUids().has(user.uid);

    if (request.method === "GET") {
      if (request.query?.view === "access") {
        return response.status(200).json({ isAdmin });
      }

      const adminView = request.query?.view === "admin";
      if (adminView && !isAdmin) {
        return reject(response, 403, "Administrator access is required.", "admin_required");
      }

      const filter = adminView
        ? ""
        : `&firebase_uid=eq.${encodeURIComponent(user.uid)}`;
      const reports = await requestSupabase(
        `user_reports?select=*&order=created_at.desc${filter}`
      );
      return response.status(200).json({ isAdmin, reports: reports || [] });
    }

    if (request.method === "POST") {
      let requestBytes = 0;
      try {
        requestBytes = Buffer.byteLength(JSON.stringify(request.body || {}), "utf8");
      } catch {
        return reject(response, 400, "The report is invalid.", "invalid_report");
      }
      if (requestBytes > 12000) {
        return reject(response, 413, "The report is too large.", "report_too_large");
      }

      const category = cleanText(request.body?.category, 30);
      const subject = cleanText(request.body?.subject, 120);
      const description = cleanText(request.body?.description, 5000);
      const userName = cleanText(request.body?.userName, 120);
      const suppliedPhotoUrl = cleanText(request.body?.userPhotoUrl, 2048);
      const userPhotoUrl = /^https:\/\/[^\s]+$/i.test(suppliedPhotoUrl) ? suppliedPhotoUrl : "";

      if (!CATEGORIES.has(category) || subject.length < 3 || description.length < 10) {
        return reject(response, 400, "Complete the category, subject, and description.", "invalid_report");
      }

      const rows = await requestSupabase("user_reports", {
        method: "POST",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify({
          firebase_uid: user.uid,
          user_name: userName,
          user_email: user.email || "",
          user_photo_url: userPhotoUrl,
          category,
          subject,
          description,
        }),
      });
      return response.status(201).json({ report: rows?.[0] || null });
    }

    if (!isAdmin) {
      return reject(response, 403, "Administrator access is required.", "admin_required");
    }

    const id = cleanText(request.body?.id, 80);
    const status = cleanText(request.body?.status, 20);
    const priority = cleanText(request.body?.priority, 20);
    const adminResponse = cleanText(request.body?.adminResponse, 5000);
    const archived = Boolean(request.body?.archived);

    if (!/^[0-9a-f-]{36}$/i.test(id) || !STATUSES.has(status) || !PRIORITIES.has(priority)) {
      return reject(response, 400, "The report update is invalid.", "invalid_report_update");
    }

    const rows = await requestSupabase(`user_reports?id=eq.${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({
        status,
        priority,
        admin_response: adminResponse,
        admin_uid: user.uid,
        responded_at: adminResponse ? new Date().toISOString() : null,
        archived,
      }),
    });

    if (!rows?.length) return reject(response, 404, "Report not found.", "report_not_found");
    return response.status(200).json({ report: rows[0] });
  } catch (error) {
    const status = Number(error?.status || 500);
    if (status >= 500) {
      await captureServerError(error, { route: "reports", operation: request.method });
    }
    return reject(
      response,
      status,
      status === 401
        ? "Your login session could not be verified. Please sign in again."
        : "OrbitalAI could not access reports right now. Please try again.",
      error?.errorCode || "reports_unavailable"
    );
  }
}
