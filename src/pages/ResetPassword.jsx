import { useEffect, useMemo, useState } from "react";
import {
  confirmPasswordReset,
  verifyPasswordResetCode,
} from "firebase/auth";
import { auth } from "../firebase";
import logo from "../assets/orbital-logo.png";

const getResetErrorMessage = (error) => {
  const messages = {
    "auth/expired-action-code":
      "This reset link has expired. Request a new password-reset email.",
    "auth/invalid-action-code":
      "This reset link is invalid or has already been used.",
    "auth/user-disabled": "This account has been disabled.",
    "auth/user-not-found": "The account connected to this link no longer exists.",
    "auth/weak-password": "Use a stronger password with at least 8 characters.",
  };

  return (
    messages[error?.code] ||
    "We could not reset your password. Request a new reset email and try again."
  );
};

function ResetPassword() {
  const isOtpFlow = useMemo(
    () => new URLSearchParams(window.location.search).get("flow") === "otp",
    []
  );
  const resetCode = useMemo(
    () => new URLSearchParams(window.location.search).get("oobCode") || "",
    []
  );
  const [status, setStatus] = useState("verifying");
  const [accountEmail, setAccountEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [otpResetToken, setOtpResetToken] = useState("");

  useEffect(() => {
    let isCurrent = true;

    const verifyResetLink = async () => {
      if (isOtpFlow) {
        try {
          const stored = JSON.parse(
            window.sessionStorage.getItem("orbital-password-reset") || "{}"
          );
          if (!stored?.resetToken || !stored?.email) {
            throw new Error("Missing OTP reset session.");
          }
          if (!isCurrent) return;
          setOtpResetToken(stored.resetToken);
          setAccountEmail(stored.email);
          setStatus("ready");
        } catch {
          if (!isCurrent) return;
          setStatus("invalid");
          setErrorMessage(
            "Your verification session has expired. Request a new code."
          );
        }
        return;
      }

      if (!resetCode) {
        setStatus("invalid");
        setErrorMessage("This reset link is incomplete. Request a new reset email.");
        return;
      }

      try {
        const email = await verifyPasswordResetCode(auth, resetCode);
        if (!isCurrent) return;
        setAccountEmail(email);
        setStatus("ready");
      } catch (error) {
        if (!isCurrent) return;
        setStatus("invalid");
        setErrorMessage(getResetErrorMessage(error));
      }
    };

    verifyResetLink();

    return () => {
      isCurrent = false;
    };
  }, [isOtpFlow, resetCode]);

  const handleResetPassword = async (event) => {
    event.preventDefault();
    setErrorMessage("");

    if (newPassword.length < 8) {
      setErrorMessage("Your new password must contain at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("The two passwords do not match.");
      return;
    }

    try {
      setIsSubmitting(true);
      if (isOtpFlow) {
        const response = await fetch("/api/password-reset/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            resetToken: otpResetToken,
            password: newPassword,
          }),
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(
            result?.error || "We could not update your password."
          );
        }
        window.sessionStorage.removeItem("orbital-password-reset");
      } else {
        await confirmPasswordReset(auth, resetCode, newPassword);
      }
      setNewPassword("");
      setConfirmPassword("");
      setStatus("success");
    } catch (error) {
      setErrorMessage(
        isOtpFlow
          ? error?.message || "We could not update your password."
          : getResetErrorMessage(error)
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const goToSignIn = () => {
    window.location.assign("/");
  };

  return (
    <main className="relative flex h-dvh min-h-[520px] items-center justify-center overflow-hidden bg-[#02050f] px-5 py-6 text-white sm:px-8">
      <div
        className="pointer-events-none fixed inset-0 bg-cover bg-[38%_center] lg:bg-center"
        style={{ backgroundImage: "url('/orbital-auth-bg-hd.jpg')" }}
      />
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(90deg,rgba(1,5,15,0.3),rgba(1,5,15,0.08)_48%,rgba(1,5,15,0.4))]" />
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_center,transparent_20%,rgba(1,4,13,0.58)_100%)]" />

      <section className="relative w-full max-w-[520px] rounded-[28px] border border-white/20 bg-[#040a1a]/75 px-6 py-8 shadow-[0_32px_100px_rgba(0,0,0,0.52)] backdrop-blur-xl sm:px-10 sm:py-10">
        <div className="mx-auto mb-3 h-[82px] w-[260px] overflow-hidden">
          <img
            src={logo}
            alt="OrbitalAI"
            className="w-[260px] -translate-y-[20px] object-contain"
          />
        </div>

        <div className="text-center">
          <span className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-blue-300/20 bg-gradient-to-br from-blue-500/15 to-violet-500/15 text-blue-100 shadow-[0_12px_36px_rgba(55,67,238,0.18)]">
            {status === "success" ? (
              <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7">
                <path
                  d="m5 12.5 4.2 4.2L19 7"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7">
                <path
                  d="M8.5 11V8.5a3.5 3.5 0 0 1 7 0V11M6.5 11h11v8h-11v-8Z"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </span>
          <h1 className="text-3xl font-semibold tracking-[-0.035em]">
            {status === "success" ? "Password updated" : "Choose a new password"}
          </h1>
          <p className="mx-auto mt-2 max-w-[380px] text-sm leading-6 text-slate-300/80">
            {status === "success"
              ? "Your OrbitalAI password has been changed successfully."
              : status === "ready"
                ? `Set a new password for ${accountEmail}.`
                : status === "verifying"
                  ? "Checking your secure reset link…"
                  : "This password-reset link cannot be used."}
          </p>
        </div>

        {errorMessage && (
          <div
            role="alert"
            className="mt-6 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm leading-6 text-red-200"
          >
            {errorMessage}
          </div>
        )}

        {status === "verifying" && (
          <div className="mt-8 flex items-center justify-center gap-3 text-sm text-slate-300">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-blue-300" />
            Verifying reset link
          </div>
        )}

        {status === "ready" && (
          <form onSubmit={handleResetPassword} className="mt-7 space-y-5">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-100">
                New password
              </span>
              <input
                type={showPasswords ? "text" : "password"}
                autoComplete="new-password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                placeholder="Enter at least 8 characters"
                className="auth-input"
                autoFocus
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-100">
                Confirm new password
              </span>
              <input
                type={showPasswords ? "text" : "password"}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Enter the same password again"
                className="auth-input"
              />
            </label>

            <label className="flex cursor-pointer items-center gap-3 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={showPasswords}
                onChange={(event) => setShowPasswords(event.target.checked)}
                className="h-4 w-4 accent-violet-500"
              />
              Show passwords
            </label>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-blue-300/20 bg-gradient-to-r from-[#1458ed] via-[#4d50f4] to-[#7542ed] px-5 py-3.5 font-semibold text-white shadow-[0_12px_30px_rgba(55,67,238,0.32)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting && (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              )}
              {isSubmitting ? "Updating password…" : "Update password"}
            </button>
          </form>
        )}

        {(status === "invalid" || status === "success") && (
          <button
            type="button"
            onClick={goToSignIn}
            className="mt-7 flex w-full items-center justify-center rounded-lg border border-white/15 bg-white/[0.04] px-5 py-3.5 font-semibold text-white transition hover:bg-white/[0.08]"
          >
            Back to sign in
          </button>
        )}
      </section>
    </main>
  );
}

export default ResetPassword;
