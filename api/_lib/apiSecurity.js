/* global Buffer, process */

import { createPublicKey, verify } from "node:crypto";

const FIREBASE_CERTIFICATES_URL =
  "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com";
const DEFAULT_FIREBASE_PROJECT_ID = "orbital-ai-957b9";
const DEFAULT_SUPABASE_URL = "https://yffkeluziizwhwlvgtnh.supabase.co";
const CLOCK_TOLERANCE_SECONDS = 300;
const certificateCache = {
  certificates: null,
  expiresAt: 0,
};
const localUsage = new Map();

class ApiSecurityError extends Error {
  constructor(message, status, errorCode) {
    super(message);
    this.status = status;
    this.errorCode = errorCode;
  }
}

const decodeBase64UrlJson = (value) => {
  const decoded = Buffer.from(String(value || ""), "base64url").toString(
    "utf8"
  );
  return JSON.parse(decoded);
};

const getCacheDuration = (cacheControl = "") => {
  const maxAge = Number(
    String(cacheControl).match(/(?:^|,)\s*max-age=(\d+)/i)?.[1] || 3600
  );
  return Math.max(60, maxAge) * 1000;
};

const getFirebaseCertificates = async (forceRefresh = false) => {
  if (
    !forceRefresh &&
    certificateCache.certificates &&
    certificateCache.expiresAt > Date.now()
  ) {
    return certificateCache.certificates;
  }

  let response;
  try {
    response = await fetch(FIREBASE_CERTIFICATES_URL);
  } catch {
    throw new ApiSecurityError(
      "Login verification is temporarily unavailable. Please try again.",
      503,
      "authentication_unavailable"
    );
  }
  if (!response.ok) {
    throw new ApiSecurityError(
      "Login verification is temporarily unavailable. Please try again.",
      503,
      "authentication_unavailable"
    );
  }

  const certificates = await response.json();
  certificateCache.certificates = certificates;
  certificateCache.expiresAt =
    Date.now() + getCacheDuration(response.headers.get("cache-control"));
  return certificates;
};

const getBearerToken = (request) => {
  const authorization = String(request.headers?.authorization || "");
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || "";
};

export const verifyFirebaseIdToken = async (token) => {
  const parts = String(token || "").split(".");
  if (parts.length !== 3) {
    throw new ApiSecurityError(
      "Your login session is invalid. Please sign in again.",
      401,
      "invalid_auth_token"
    );
  }

  let header;
  let claims;

  try {
    header = decodeBase64UrlJson(parts[0]);
    claims = decodeBase64UrlJson(parts[1]);
  } catch {
    throw new ApiSecurityError(
      "Your login session is invalid. Please sign in again.",
      401,
      "invalid_auth_token"
    );
  }

  if (header.alg !== "RS256" || !header.kid) {
    throw new ApiSecurityError(
      "Your login session is invalid. Please sign in again.",
      401,
      "invalid_auth_token"
    );
  }

  let certificates = await getFirebaseCertificates();
  let certificate = certificates?.[header.kid];
  if (!certificate) {
    certificates = await getFirebaseCertificates(true);
    certificate = certificates?.[header.kid];
  }

  if (!certificate) {
    throw new ApiSecurityError(
      "Your login session could not be verified. Please sign in again.",
      401,
      "invalid_auth_token"
    );
  }

  const signingInput = Buffer.from(`${parts[0]}.${parts[1]}`);
  const signature = Buffer.from(parts[2], "base64url");
  const isValidSignature = verify(
    "RSA-SHA256",
    signingInput,
    createPublicKey(certificate),
    signature
  );

  if (!isValidSignature) {
    throw new ApiSecurityError(
      "Your login session is invalid. Please sign in again.",
      401,
      "invalid_auth_token"
    );
  }

  const projectId =
    process.env.FIREBASE_PROJECT_ID || DEFAULT_FIREBASE_PROJECT_ID;
  const now = Math.floor(Date.now() / 1000);
  const validIssuer = `https://securetoken.google.com/${projectId}`;
  const validSubject =
    typeof claims.sub === "string" &&
    claims.sub.length > 0 &&
    claims.sub.length <= 128;

  if (
    claims.aud !== projectId ||
    claims.iss !== validIssuer ||
    !validSubject ||
    !Number.isFinite(claims.exp) ||
    claims.exp <= now ||
    !Number.isFinite(claims.iat) ||
    claims.iat > now + CLOCK_TOLERANCE_SECONDS ||
    !Number.isFinite(claims.auth_time) ||
    claims.auth_time > now + CLOCK_TOLERANCE_SECONDS
  ) {
    throw new ApiSecurityError(
      "Your login session has expired. Please sign in again.",
      401,
      "expired_auth_token"
    );
  }

  return {
    uid: claims.sub,
    email: claims.email || "",
  };
};

const consumeLocalLimit = ({ userId, route, minuteLimit, dailyLimit }) => {
  const now = Date.now();
  const dayAgo = now - 24 * 60 * 60 * 1000;
  const minuteAgo = now - 60 * 1000;
  const key = `${userId}:${route}`;
  const recentEvents = (localUsage.get(key) || []).filter(
    (timestamp) => timestamp > dayAgo
  );
  const minuteCount = recentEvents.filter(
    (timestamp) => timestamp > minuteAgo
  ).length;

  if (minuteCount >= minuteLimit || recentEvents.length >= dailyLimit) {
    localUsage.set(key, recentEvents);
    return false;
  }

  recentEvents.push(now);
  localUsage.set(key, recentEvents);
  return true;
};

const consumeSupabaseLimit = async ({
  userId,
  route,
  minuteLimit,
  dailyLimit,
}) => {
  const serverKey =
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serverKey) return null;

  const supabaseUrl = process.env.SUPABASE_URL || DEFAULT_SUPABASE_URL;
  const response = await fetch(
    `${supabaseUrl}/rest/v1/rpc/check_api_rate_limit`,
    {
      method: "POST",
      headers: {
        apikey: serverKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        p_user_id: userId,
        p_route: route,
        p_minute_limit: minuteLimit,
        p_daily_limit: dailyLimit,
      }),
    }
  );

  if (!response.ok) {
    throw new ApiSecurityError(
      "Usage protection is temporarily unavailable. Please try again.",
      503,
      "rate_limit_unavailable"
    );
  }

  return Boolean(await response.json());
};

const consumeRateLimit = async (options) => {
  const supabaseResult = await consumeSupabaseLimit(options);
  if (supabaseResult !== null) return supabaseResult;
  return consumeLocalLimit(options);
};

export const protectApiRoute = async (
  request,
  response,
  { route, minuteLimit, dailyLimit }
) => {
  try {
    const token = getBearerToken(request);
    if (!token) {
      throw new ApiSecurityError(
        "Please sign in to use OrbitalAI.",
        401,
        "authentication_required"
      );
    }

    const user = await verifyFirebaseIdToken(token);
    const allowed = await consumeRateLimit({
      userId: user.uid,
      route,
      minuteLimit,
      dailyLimit,
    });

    if (!allowed) {
      throw new ApiSecurityError(
        "You have reached the current usage limit. Wait briefly and try again.",
        429,
        "user_rate_limit"
      );
    }

    return user;
  } catch (error) {
    const status = Number(error?.status || 500);
    response.status(status).json({
      error:
        error?.message ||
        "OrbitalAI could not verify this request. Please try again.",
      errorCode: error?.errorCode || "api_security_failed",
    });
    return null;
  }
};
