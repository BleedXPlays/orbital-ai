import {
  assertRequestRateLimit,
  createOtpChallenge,
  deleteChallenge,
  findFirebaseUserByEmail,
  getClientIpHash,
  isValidEmail,
  normalizeEmail,
  OTP_EXPIRES_IN_SECONDS,
  sendApiError,
  sendOtpEmail,
} from "../_lib/passwordReset.js";

export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({ error: "Method not allowed." });
  }

  const email = normalizeEmail(request.body?.email);
  if (!isValidEmail(email)) {
    return response.status(400).json({ error: "Enter a valid email address." });
  }

  try {
    const ipHash = getClientIpHash(request);
    await assertRequestRateLimit({ email, ipHash });
    const user = await findFirebaseUserByEmail(email);

    // Keep the response generic so this endpoint does not reveal accounts.
    if (!user) {
      return response.status(200).json({
        ok: true,
        expiresInSeconds: OTP_EXPIRES_IN_SECONDS,
      });
    }

    const challenge = await createOtpChallenge({ email, ipHash });
    try {
      await sendOtpEmail({ email, otp: challenge.otp });
    } catch (error) {
      await deleteChallenge(challenge.id);
      throw error;
    }

    return response.status(200).json({
      ok: true,
      expiresInSeconds: OTP_EXPIRES_IN_SECONDS,
    });
  } catch (error) {
    return sendApiError(response, error);
  }
}
