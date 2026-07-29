import { useState } from "react";
import { auth } from "../firebase";
import logo from "../assets/orbital-logo.png";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
} from "firebase/auth";
import PasswordRequirements from "../components/PasswordRequirements";
import {
  getPasswordPolicyError,
  isPasswordValid,
} from "../../shared/passwordPolicy";

const getFriendlyAuthError = (error) => {
  if (error?.code === "auth/unauthorized-domain") {
    const hostname =
      typeof window !== "undefined" ? window.location.hostname : "this website";

    return `Google sign-in needs ${hostname} added to Firebase Authorized domains.`;
  }

  const messages = {
    "auth/email-already-in-use": "An account already exists for this email.",
    "auth/invalid-credential": "The email or password you entered is incorrect.",
    "auth/invalid-email": "Enter a valid email address.",
    "auth/too-many-requests": "Too many attempts. Please wait a moment and try again.",
    "auth/weak-password": "Your password does not meet the security requirements.",
    "auth/popup-closed-by-user": "Google sign-in was cancelled.",
    "auth/popup-blocked": "Your browser blocked the Google sign-in window. Allow pop-ups for this site and try again.",
    "auth/operation-not-allowed":
      "Google sign-in is disabled in Firebase. Enable the Google provider in Firebase Authentication.",
    "auth/account-exists-with-different-credential": "An account already exists for this email using another sign-in method.",
  };

  return messages[error?.code] || "We could not complete that request. Please try again.";
};

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

const postPasswordReset = async (path, payload) => {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      result?.error || "We could not complete that request. Please try again."
    );
  }

  return result;
};

function Login() {
  const [isSignup, setIsSignup] = useState(false);
  const [isPasswordReset, setIsPasswordReset] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [resetOtp, setResetOtp] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAuth = async (event) => {
    event?.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (isSignup && !fullName.trim()) {
      setErrorMessage("Please enter your full name.");
      return;
    }

    if (!email.trim()) {
      setErrorMessage("Please enter your email address.");
      return;
    }

    if (!password.trim()) {
      setErrorMessage("Please enter your password.");
      return;
    }

    if (isSignup && !isPasswordValid(password)) {
      setErrorMessage(getPasswordPolicyError(password));
      return;
    }

    if (isSignup && password !== confirmPassword) {
      setErrorMessage("The two passwords do not match.");
      return;
    }

    try {
      setIsSubmitting(true);

      if (isSignup) {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email.trim(),
          password
        );

        await updateProfile(userCredential.user, {
          displayName: fullName.trim(),
        });

      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      }
    } catch (error) {
      setErrorMessage(getFriendlyAuthError(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleAuth = async () => {
    setErrorMessage("");
    setSuccessMessage("");

    try {
      setIsSubmitting(true);
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Google sign-in error:", error?.code, error?.message);
      setErrorMessage(getFriendlyAuthError(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async (event) => {
    event?.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!email.trim()) {
      setErrorMessage("Enter the email address connected to your account.");
      return;
    }

    try {
      setIsSubmitting(true);
      await postPasswordReset("/api/password-reset/request", {
        email: email.trim(),
      });
      setResetEmailSent(true);
    } catch (error) {
      setErrorMessage(
        error?.message || "We could not send the verification code."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyResetOtp = async (event) => {
    event?.preventDefault();
    setErrorMessage("");

    if (!/^\d{6}$/.test(resetOtp)) {
      setErrorMessage("Enter the six-digit code from your email.");
      return;
    }

    try {
      setIsSubmitting(true);
      const result = await postPasswordReset("/api/password-reset/verify", {
        email: email.trim(),
        otp: resetOtp,
      });
      window.sessionStorage.setItem(
        "orbital-password-reset",
        JSON.stringify({
          resetToken: result.resetToken,
          email: result.email,
        })
      );
      window.location.assign("/reset-password?flow=otp");
    } catch (error) {
      setErrorMessage(
        error?.message || "We could not verify that code. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const openPasswordReset = () => {
    setIsPasswordReset(true);
    setResetEmailSent(false);
    setResetOtp("");
    setPassword("");
    setShowPassword(false);
    setErrorMessage("");
    setSuccessMessage("");
  };

  const closePasswordReset = () => {
    setIsPasswordReset(false);
    setResetEmailSent(false);
    setResetOtp("");
    setErrorMessage("");
    setSuccessMessage("");
  };

  const switchMode = () => {
    setIsSignup((current) => !current);
    setIsPasswordReset(false);
    setResetEmailSent(false);
    setResetOtp("");
    setFullName("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setShowPassword(false);
    setErrorMessage("");
    setSuccessMessage("");
  };

  return (
    <main className="auth-shell relative h-dvh overflow-hidden bg-[#02050f] text-white">
      <div
        className="pointer-events-none fixed inset-0 bg-cover bg-[36%_center] lg:bg-center"
        style={{ backgroundImage: "url('/orbital-auth-bg-hd.jpg')" }}
      />
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(90deg,rgba(1,5,15,0.28),rgba(1,5,15,0.06)_45%,rgba(1,5,15,0.38))]" />
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_center,transparent_25%,rgba(1,4,13,0.5)_100%)]" />

      <div className="relative mx-auto h-full min-h-0 w-full max-w-[1600px] p-0 sm:p-5 lg:p-8">
        <div className="grid h-full min-h-0 overflow-hidden border-white/15 bg-[#030817]/30 shadow-[0_40px_120px_rgba(0,0,0,0.5)] sm:rounded-[30px] sm:border lg:grid-cols-[1.08fr_0.92fr]">
          <section className="relative hidden min-h-0 px-14 py-12 lg:flex lg:flex-col xl:px-20 xl:py-16">
            <div className="h-[104px] overflow-hidden">
              <img
                src={logo}
                alt="OrbitalAI"
                className="w-[310px] -translate-y-[26px] object-contain"
              />
            </div>

            <div className="my-auto max-w-[610px] py-10">
              <h1 className="text-[48px] font-semibold leading-[1.08] tracking-[-0.04em] xl:text-[58px]">
                One workspace.
                <span className="block">Three intelligences.</span>
              </h1>

              <div className="mt-10 max-w-[540px] divide-y divide-white/10">
                {[
                  ["◎", "OpenAI", "General chat, reasoning and voice transcription.", "text-emerald-300"],
                  ["AI", "Claude", "Detailed writing, documents and coding.", "text-orange-300"],
                  ["✦", "Gemini", "Image generation, understanding and multimodal research.", "text-blue-300"],
                ].map(([icon, name, description, color]) => (
                  <div key={name} className="flex items-center gap-4 py-4 first:pt-0">
                    <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-[#050b1b]/65 text-lg font-semibold ${color}`}>
                      {icon}
                    </span>
                    <div>
                      <p className="text-lg font-semibold text-white">{name}</p>
                      <p className="mt-1 text-sm text-slate-300/75">{description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="auth-form-section flex h-full min-h-0 items-center justify-center overflow-y-auto px-5 py-6 sm:px-8 lg:overflow-hidden lg:px-14 xl:px-20">
            <div className="w-full max-w-[500px]">
              <div className="mb-5 flex h-[78px] justify-center overflow-hidden lg:hidden">
                <img
                  src={logo}
                  alt="OrbitalAI"
                  className="w-[245px] -translate-y-[18px] object-contain"
                />
              </div>

              <div className="auth-form-card rounded-[24px] border border-white/20 bg-[#040a1a]/60 px-5 py-7 shadow-[0_28px_90px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:px-8 sm:py-9 lg:px-10">
                <div className="auth-form-header mb-7 text-center">
                  {isPasswordReset && (
                    <span
                      className={`mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border text-2xl shadow-[0_12px_36px_rgba(55,67,238,0.18)] ${
                        resetEmailSent
                          ? "border-emerald-300/20 bg-emerald-400/10 text-emerald-200"
                          : "border-blue-300/20 bg-gradient-to-br from-blue-500/15 to-violet-500/15 text-blue-200"
                      }`}
                    >
                      {resetEmailSent ? (
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          className="h-7 w-7"
                          aria-hidden="true"
                        >
                          <path
                            d="m5 12.5 4.2 4.2L19 7"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      ) : (
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          className="h-7 w-7"
                          aria-hidden="true"
                        >
                          <path
                            d="M4.5 7.5h15v10h-15v-10Z"
                            stroke="currentColor"
                            strokeWidth="1.6"
                            strokeLinejoin="round"
                          />
                          <path
                            d="m5.25 8.25 6.75 5 6.75-5"
                            stroke="currentColor"
                            strokeWidth="1.6"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </span>
                  )}
                  <h2 className="text-3xl font-semibold tracking-[-0.035em] text-white">
                    {isPasswordReset
                      ? resetEmailSent
                        ? "Enter verification code"
                        : "Forgot your password?"
                      : isSignup
                      ? "Create Account"
                      : "Sign In"}
                  </h2>
                  <p className="mx-auto mt-2 max-w-[360px] text-sm leading-6 text-slate-300/80">
                    {isPasswordReset
                      ? resetEmailSent
                        ? "Enter the six-digit code we sent to your email."
                        : "Enter your email and we’ll send you a secure six-digit verification code."
                      : isSignup
                      ? "Start your journey with OrbitalAI"
                      : "Welcome back to OrbitalAI"}
                  </p>
                </div>

                {errorMessage && (
                  <div role="alert" className="mb-5 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">
                    {errorMessage}
                  </div>
                )}

                {successMessage && !isPasswordReset && (
                  <div role="status" className="mb-5 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">
                    {successMessage}
                  </div>
                )}

                {isPasswordReset ? (
                  resetEmailSent ? (
                    <form
                      onSubmit={handleVerifyResetOtp}
                      className="text-center"
                    >
                      <div className="rounded-2xl border border-white/10 bg-white/[0.025] px-5 py-4">
                        <p className="text-sm text-slate-400">
                          Verification code sent to
                        </p>
                        <p className="mt-1 break-all font-medium text-white">
                          {email.trim()}
                        </p>
                      </div>

                      <p className="mx-auto mt-4 max-w-[340px] text-xs leading-5 text-slate-400">
                        The code expires in 10 minutes. Check your spam folder
                        if it does not arrive.
                      </p>

                      <label className="mt-6 block text-left">
                        <span className="mb-2 block text-sm font-medium text-slate-100">
                          Six-digit code
                        </span>
                        <input
                          type="text"
                          inputMode="numeric"
                          autoComplete="one-time-code"
                          maxLength={6}
                          autoFocus
                          placeholder="000000"
                          className="auth-input text-center text-2xl font-semibold tracking-[0.45em]"
                          value={resetOtp}
                          onChange={(event) =>
                            setResetOtp(
                              event.target.value.replace(/\D/g, "").slice(0, 6)
                            )
                          }
                        />
                      </label>

                      <button
                        type="submit"
                        disabled={isSubmitting || resetOtp.length !== 6}
                        className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg border border-blue-300/20 bg-gradient-to-r from-[#1458ed] via-[#4d50f4] to-[#7542ed] px-5 py-3.5 font-semibold text-white shadow-[0_12px_30px_rgba(55,67,238,0.32)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isSubmitting && (
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        )}
                        {isSubmitting ? "Verifying code…" : "Verify code"}
                      </button>

                      <div className="mt-3 flex items-center justify-center gap-2 text-sm">
                        <button
                          type="button"
                          onClick={handleForgotPassword}
                          disabled={isSubmitting}
                          className="px-2 py-2 font-medium text-blue-300 transition hover:text-blue-200 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Resend code
                        </button>
                        <span className="text-slate-600">•</span>
                        <button
                          type="button"
                          onClick={() => {
                            setResetEmailSent(false);
                            setResetOtp("");
                            setErrorMessage("");
                          }}
                          className="px-2 py-2 font-medium text-slate-300 transition hover:text-white"
                        >
                          Change email
                        </button>
                      </div>
                    </form>
                  ) : (
                    <form
                      onSubmit={handleForgotPassword}
                      className="auth-form-fields space-y-5"
                    >
                      <label className="block">
                        <span className="mb-2 block text-sm font-medium text-slate-100">
                          Email
                        </span>
                        <input
                          type="email"
                          autoComplete="email"
                          autoFocus
                          placeholder="you@company.com"
                          className="auth-input"
                          value={email}
                          onChange={(event) => setEmail(event.target.value)}
                        />
                      </label>

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex w-full items-center justify-center gap-2 rounded-lg border border-blue-300/20 bg-gradient-to-r from-[#1458ed] via-[#4d50f4] to-[#7542ed] px-5 py-3.5 font-semibold text-white shadow-[0_12px_30px_rgba(55,67,238,0.32)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isSubmitting && (
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        )}
                        {isSubmitting
                          ? "Sending code..."
                          : "Send verification code"}
                      </button>

                      <button
                        type="button"
                        onClick={closePasswordReset}
                        className="mx-auto flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-slate-300 transition hover:text-white"
                      >
                        ← Back to sign in
                      </button>
                    </form>
                  )
                ) : (
                  <>
                    <form
                      onSubmit={handleAuth}
                      className="auth-form-fields space-y-5"
                    >
                      {isSignup && (
                        <label className="block">
                          <span className="mb-2 block text-sm font-medium text-slate-100">
                            Name
                          </span>
                          <input
                            type="text"
                            autoComplete="name"
                            placeholder="Your full name"
                            className="auth-input"
                            value={fullName}
                            onChange={(event) =>
                              setFullName(event.target.value)
                            }
                          />
                        </label>
                      )}

                      <label className="block">
                        <span className="mb-2 block text-sm font-medium text-slate-100">
                          Email
                        </span>
                        <input
                          type="email"
                          autoComplete="email"
                          placeholder="you@company.com"
                          className="auth-input"
                          value={email}
                          onChange={(event) => setEmail(event.target.value)}
                        />
                      </label>

                      <label className="block">
                        <span className="mb-2 block text-sm font-medium text-slate-100">
                          Password
                        </span>
                        <span className="relative block">
                          <input
                            type={showPassword ? "text" : "password"}
                            autoComplete={
                              isSignup ? "new-password" : "current-password"
                            }
                            placeholder={
                              isSignup
                                ? "Create a password"
                                : "Enter your password"
                            }
                            className="auth-input pr-14"
                            value={password}
                            onChange={(event) =>
                              setPassword(event.target.value)
                            }
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setShowPassword((current) => !current)
                            }
                            className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-slate-400 transition hover:text-white"
                            aria-label={
                              showPassword ? "Hide password" : "Show password"
                            }
                          >
                            {showPassword ? "◉" : "◎"}
                          </button>
                        </span>
                      </label>

                      {isSignup && (
                        <>
                          <label className="block">
                            <span className="mb-2 block text-sm font-medium text-slate-100">
                              Confirm password
                            </span>
                            <input
                              type={showPassword ? "text" : "password"}
                              autoComplete="new-password"
                              placeholder="Enter the same password again"
                              className="auth-input"
                              value={confirmPassword}
                              onChange={(event) =>
                                setConfirmPassword(event.target.value)
                              }
                            />
                          </label>

                          <PasswordRequirements
                            password={password}
                            confirmPassword={confirmPassword}
                          />
                        </>
                      )}

                      {!isSignup && (
                        <div className="-mt-2 text-right">
                          <button
                            type="button"
                            onClick={openPasswordReset}
                            className="text-sm text-blue-300 transition hover:text-blue-200"
                          >
                            Forgot password?
                          </button>
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={
                          isSubmitting ||
                          (isSignup &&
                            (!isPasswordValid(password) ||
                              password !== confirmPassword))
                        }
                        className="flex w-full items-center justify-center gap-2 rounded-lg border border-blue-300/20 bg-gradient-to-r from-[#1458ed] via-[#4d50f4] to-[#7542ed] px-5 py-3.5 font-semibold text-white shadow-[0_12px_30px_rgba(55,67,238,0.32)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isSubmitting && (
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        )}
                        {isSubmitting
                          ? isSignup
                            ? "Creating account..."
                            : "Signing in..."
                          : isSignup
                          ? "Create account"
                          : "Continue"}
                      </button>
                    </form>

                    <div className="auth-oauth-divider my-6 flex items-center gap-4 text-xs text-slate-400">
                      <span className="h-px flex-1 bg-white/15" />
                      or continue with
                      <span className="h-px flex-1 bg-white/15" />
                    </div>

                    <button
                      type="button"
                      onClick={handleGoogleAuth}
                      disabled={isSubmitting}
                      className="flex w-full items-center justify-center gap-3 rounded-lg border border-white/25 bg-[#060c1b]/50 px-5 py-3.5 font-medium text-white transition hover:bg-white/[0.07] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs font-bold text-[#4285f4]">
                        G
                      </span>
                      Continue with Google
                    </button>

                    <p className="auth-form-footer mt-7 text-center text-sm text-slate-300/80">
                      {isSignup
                        ? "Already have an account?"
                        : "Don’t have an account?"}{" "}
                      <button
                        type="button"
                        onClick={switchMode}
                        className="font-medium text-blue-300 transition hover:text-blue-200"
                      >
                        {isSignup ? "Sign in" : "Create account"}
                      </button>
                    </p>
                  </>
                )}
              </div>

              <p className="auth-privacy-note mx-auto mt-4 max-w-sm text-center text-xs leading-5 text-slate-400/65">
                Your workspace is private. Provider keys remain securely on the server.
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

export default Login;
