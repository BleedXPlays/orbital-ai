import {
  consumeVerifiedChallenge,
  releaseConsumedChallenge,
  sendApiError,
  updateFirebasePassword,
  verifyResetToken,
} from "../_lib/passwordReset.js";

export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({ error: "Method not allowed." });
  }

  const password = String(request.body?.password || "");
  if (password.length < 8 || password.length > 128) {
    return response.status(400).json({
      error: "Your password must contain between 8 and 128 characters.",
    });
  }

  let reset = null;
  let challengeClaimed = false;

  try {
    reset = verifyResetToken(request.body?.resetToken);
    await consumeVerifiedChallenge(reset);
    challengeClaimed = true;
    await updateFirebasePassword({
      email: reset.email,
      password,
    });
    return response.status(200).json({ ok: true });
  } catch (error) {
    if (challengeClaimed && reset?.id) {
      await releaseConsumedChallenge(reset.id).catch(() => undefined);
    }
    return sendApiError(response, error);
  }
}
