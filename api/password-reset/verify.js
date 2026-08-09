import {
  getLatestChallenge,
  isValidEmail,
  normalizeEmail,
  sendApiError,
  verifyOtpChallenge,
} from "../_lib/passwordReset.js";

export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({ error: "Method not allowed." });
  }

  const email = normalizeEmail(request.body?.email);
  const otp = String(request.body?.otp || "").replace(/\D/g, "");

  if (!isValidEmail(email) || !/^\d{6}$/.test(otp)) {
    return response
      .status(400)
      .json({ error: "Enter the six-digit code from your email." });
  }

  try {
    const challenge = await getLatestChallenge(email);
    const resetToken = await verifyOtpChallenge({ challenge, otp });
    return response.status(200).json({ ok: true, resetToken, email });
  } catch (error) {
    return await sendApiError(response, error);
  }
}
