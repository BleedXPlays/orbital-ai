/* global Buffer, process */

import {
  createHmac,
  randomInt,
  randomUUID,
  timingSafeEqual,
} from "node:crypto";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const DEFAULT_SUPABASE_URL = "https://yffkeluziizwhwlvgtnh.supabase.co";
const OTP_TTL_SECONDS = 10 * 60;
const RESET_TOKEN_TTL_SECONDS = 10 * 60;
const MAX_OTP_ATTEMPTS = 5;

export class PasswordResetError extends Error {
  constructor(message, status = 400, errorCode = "password_reset_failed") {
    super(message);
    this.status = status;
    this.errorCode = errorCode;
  }
}

const getServerSecret = () => {
  const secret =
    process.env.PASSWORD_RESET_TOKEN_SECRET ||
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!secret) {
    throw new PasswordResetError(
      "Password reset is temporarily unavailable.",
      503,
      "password_reset_not_configured"
    );
  }

  return secret;
};

const getSupabaseConfig = () => {
  const key =
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!key) {
    throw new PasswordResetError(
      "Password reset is temporarily unavailable.",
      503,
      "password_reset_not_configured"
    );
  }

  return {
    url: process.env.SUPABASE_URL || DEFAULT_SUPABASE_URL,
    key,
  };
};

export const normalizeEmail = (value) =>
  String(value || "").trim().toLowerCase();

export const isValidEmail = (email) =>
  email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export const getClientIpHash = (request) => {
  const forwarded = String(request.headers?.["x-forwarded-for"] || "")
    .split(",")[0]
    .trim();
  const ip = forwarded || String(request.socket?.remoteAddress || "unknown");
  return createHmac("sha256", getServerSecret()).update(ip).digest("hex");
};

const supabaseRequest = async (path, options = {}) => {
  const { url, key } = getSupabaseConfig();
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
    throw new PasswordResetError(
      "Password reset is temporarily unavailable.",
      503,
      "password_reset_storage_failed"
    );
  }

  const responseText = await response.text();
  if (!responseText) return null;

  try {
    return JSON.parse(responseText);
  } catch {
    throw new PasswordResetError(
      "Password reset is temporarily unavailable.",
      503,
      "password_reset_storage_failed"
    );
  }
};

export const findFirebaseUserByEmail = async (email) => {
  try {
    return await getFirebaseAdminAuth().getUserByEmail(email);
  } catch (error) {
    if (error?.code === "auth/user-not-found") return null;
    throw new PasswordResetError(
      "Password reset is temporarily unavailable.",
      503,
      "password_reset_auth_failed"
    );
  }
};

const getFirebaseAdminAuth = () => {
  if (!getApps().length) {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = String(process.env.FIREBASE_PRIVATE_KEY || "").replace(
      /\\n/g,
      "\n"
    );

    if (!projectId || !clientEmail || !privateKey) {
      throw new PasswordResetError(
        "Password reset is temporarily unavailable.",
        503,
        "firebase_admin_not_configured"
      );
    }

    initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
    });
  }

  return getAuth();
};

export const assertRequestRateLimit = async ({ email, ipHash }) => {
  const since = encodeURIComponent(
    new Date(Date.now() - 15 * 60 * 1000).toISOString()
  );
  const encodedEmail = encodeURIComponent(email);
  const emailRows = await supabaseRequest(
    `password_reset_challenges?select=id&email=eq.${encodedEmail}&created_at=gte.${since}`
  );
  const ipRows = await supabaseRequest(
    `password_reset_challenges?select=id&ip_hash=eq.${ipHash}&created_at=gte.${since}`
  );

  if ((emailRows || []).length >= 3 || (ipRows || []).length >= 10) {
    throw new PasswordResetError(
      "Too many reset requests. Wait 15 minutes and try again.",
      429,
      "password_reset_rate_limit"
    );
  }
};

export const createOtpChallenge = async ({ email, ipHash }) => {
  const id = randomUUID();
  const otp = String(randomInt(100000, 1000000));
  const otpHash = hashOtp({ id, email, otp });
  const expiresAt = new Date(Date.now() + OTP_TTL_SECONDS * 1000).toISOString();

  await supabaseRequest("password_reset_challenges", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({
      id,
      email,
      otp_hash: otpHash,
      ip_hash: ipHash,
      expires_at: expiresAt,
    }),
  });

  return { id, otp, expiresAt };
};

export const deleteChallenge = async (id) => {
  await supabaseRequest(
    `password_reset_challenges?id=eq.${encodeURIComponent(id)}`,
    {
      method: "DELETE",
      headers: { Prefer: "return=minimal" },
    }
  );
};

export const sendOtpEmail = async ({ email, otp }) => {
  const apiKey = process.env.RESEND_API_KEY;
  const from =
    process.env.PASSWORD_RESET_EMAIL_FROM ||
    "OrbitalAI <onboarding@resend.dev>";

  if (!apiKey) {
    throw new PasswordResetError(
      "Password reset email is not configured yet.",
      503,
      "password_reset_email_not_configured"
    );
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [email],
      subject: "Your OrbitalAI password reset code",
      text: `Your OrbitalAI password reset code is ${otp}. It expires in 10 minutes. If you did not request this, you can ignore this email.`,
      html: `
        <div style="background:#020714;color:#e8eefc;font-family:Arial,sans-serif;padding:32px">
          <div style="max-width:520px;margin:auto;border:1px solid #28354f;border-radius:20px;background:#071022;padding:32px">
            <h1 style="font-size:24px;margin:0 0 12px">Reset your OrbitalAI password</h1>
            <p style="color:#aab7cf;line-height:1.6">Enter this six-digit code in OrbitalAI. It expires in 10 minutes.</p>
            <div style="font-size:34px;letter-spacing:10px;font-weight:700;text-align:center;margin:28px 0;padding:18px;border-radius:14px;background:#111a36;color:#bda6ff">${otp}</div>
            <p style="color:#7f8ba3;font-size:13px;line-height:1.6">If you did not request a password reset, you can safely ignore this email.</p>
          </div>
        </div>
      `,
    }),
  });

  if (!response.ok) {
    throw new PasswordResetError(
      "We could not send the verification code. Please try again.",
      503,
      "password_reset_email_failed"
    );
  }
};

const hashOtp = ({ id, email, otp }) =>
  createHmac("sha256", getServerSecret())
    .update(`${id}:${email}:${otp}`)
    .digest("hex");

export const getLatestChallenge = async (email) => {
  const encodedEmail = encodeURIComponent(email);
  const rows = await supabaseRequest(
    `password_reset_challenges?select=*&email=eq.${encodedEmail}&consumed_at=is.null&order=created_at.desc&limit=1`
  );
  return rows?.[0] || null;
};

export const verifyOtpChallenge = async ({ challenge, otp }) => {
  if (
    !challenge ||
    challenge.verified_at ||
    new Date(challenge.expires_at).getTime() <= Date.now()
  ) {
    throw new PasswordResetError(
      "This code has expired. Request a new code.",
      400,
      "password_reset_code_expired"
    );
  }

  if (Number(challenge.attempt_count || 0) >= MAX_OTP_ATTEMPTS) {
    throw new PasswordResetError(
      "Too many incorrect attempts. Request a new code.",
      429,
      "password_reset_attempt_limit"
    );
  }

  const expected = Buffer.from(challenge.otp_hash, "hex");
  const supplied = Buffer.from(
    hashOtp({ id: challenge.id, email: challenge.email, otp }),
    "hex"
  );
  const matches =
    expected.length === supplied.length && timingSafeEqual(expected, supplied);

  if (!matches) {
    await supabaseRequest(
      `password_reset_challenges?id=eq.${encodeURIComponent(challenge.id)}`,
      {
        method: "PATCH",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify({
          attempt_count: Number(challenge.attempt_count || 0) + 1,
        }),
      }
    );
    throw new PasswordResetError(
      "That verification code is incorrect.",
      400,
      "password_reset_code_invalid"
    );
  }

  const verifiedAt = new Date().toISOString();
  await supabaseRequest(
    `password_reset_challenges?id=eq.${encodeURIComponent(challenge.id)}`,
    {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({ verified_at: verifiedAt }),
    }
  );

  return createResetToken({
    id: challenge.id,
    email: challenge.email,
  });
};

const createResetToken = ({ id, email }) => {
  const payload = Buffer.from(
    JSON.stringify({
      id,
      email,
      exp: Math.floor(Date.now() / 1000) + RESET_TOKEN_TTL_SECONDS,
    })
  ).toString("base64url");
  const signature = createHmac("sha256", getServerSecret())
    .update(payload)
    .digest("base64url");
  return `${payload}.${signature}`;
};

export const verifyResetToken = (token) => {
  const [payload, suppliedSignature] = String(token || "").split(".");
  if (!payload || !suppliedSignature) {
    throw new PasswordResetError(
      "Your reset session is invalid. Request a new code.",
      401,
      "password_reset_session_invalid"
    );
  }

  const expectedSignature = createHmac("sha256", getServerSecret())
    .update(payload)
    .digest("base64url");
  const expected = Buffer.from(expectedSignature);
  const supplied = Buffer.from(suppliedSignature);

  if (
    expected.length !== supplied.length ||
    !timingSafeEqual(expected, supplied)
  ) {
    throw new PasswordResetError(
      "Your reset session is invalid. Request a new code.",
      401,
      "password_reset_session_invalid"
    );
  }

  let data;
  try {
    data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    throw new PasswordResetError(
      "Your reset session is invalid. Request a new code.",
      401,
      "password_reset_session_invalid"
    );
  }

  if (!data?.id || !isValidEmail(data?.email) || data.exp <= Date.now() / 1000) {
    throw new PasswordResetError(
      "Your reset session has expired. Request a new code.",
      401,
      "password_reset_session_expired"
    );
  }

  return data;
};

export const consumeVerifiedChallenge = async ({ id, email }) => {
  const rows = await supabaseRequest(
    `password_reset_challenges?id=eq.${encodeURIComponent(id)}&email=eq.${encodeURIComponent(email)}&verified_at=not.is.null&consumed_at=is.null`,
    {
      method: "PATCH",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({ consumed_at: new Date().toISOString() }),
    }
  );

  if (!rows?.length) {
    throw new PasswordResetError(
      "This reset session has already been used or has expired.",
      401,
      "password_reset_session_invalid"
    );
  }
};

export const releaseConsumedChallenge = async (id) => {
  await supabaseRequest(
    `password_reset_challenges?id=eq.${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({ consumed_at: null }),
    }
  );
};

export const updateFirebasePassword = async ({ email, password }) => {
  const user = await findFirebaseUserByEmail(email);
  if (!user) {
    throw new PasswordResetError(
      "This account is no longer available.",
      404,
      "password_reset_account_missing"
    );
  }
  await getFirebaseAdminAuth().updateUser(user.uid, { password });
};

export const sendApiError = (response, error) => {
  const status = Number(error?.status || 500);
  response.status(status).json({
    error:
      error?.message ||
      "OrbitalAI could not complete the password reset. Please try again.",
    errorCode: error?.errorCode || "password_reset_failed",
  });
};

export const OTP_EXPIRES_IN_SECONDS = OTP_TTL_SECONDS;
