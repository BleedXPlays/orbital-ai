import { useState } from "react";
import { auth } from "../firebase";
import { db } from "../firestore";
import logo from "../assets/orbital-logo.png";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

const getFriendlyAuthError = (error) => {
  const messages = {
    "auth/email-already-in-use": "An account already exists for this email.",
    "auth/invalid-credential": "The email or password you entered is incorrect.",
    "auth/invalid-email": "Enter a valid email address.",
    "auth/too-many-requests": "Too many attempts. Please wait a moment and try again.",
    "auth/weak-password": "Use a stronger password with at least 6 characters.",
    "auth/popup-closed-by-user": "Google sign-in was cancelled.",
    "auth/popup-blocked": "Your browser blocked the Google sign-in window. Allow pop-ups for this site and try again.",
    "auth/operation-not-allowed": "This sign-in method is not enabled yet.",
    "auth/unauthorized-domain": "Google sign-in is not authorized for this website domain yet.",
    "auth/account-exists-with-different-credential": "An account already exists for this email using another sign-in method.",
  };

  return messages[error?.code] || "We could not complete that request. Please try again.";
};

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

function Login() {
  const [isSignup, setIsSignup] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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

        await setDoc(doc(db, "users", userCredential.user.uid), {
          name: fullName.trim(),
          email: email.trim(),
          createdAt: new Date().toISOString(),
          chats: [],
          projects: [],
          projectChats: {},
          projectFiles: {},
          projectNotes: {},
          chatMessages: {},
          archivedChats: [],
          archivedProjects: [],
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
      const result = await signInWithPopup(auth, googleProvider);

      await setDoc(
        doc(db, "users", result.user.uid),
        {
          name: result.user.displayName || "OrbitalAI User",
          email: result.user.email || "",
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (error) {
      console.error("Google sign-in error:", error?.code, error?.message);
      setErrorMessage(getFriendlyAuthError(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async () => {
    setErrorMessage("");
    setSuccessMessage("");

    if (!email.trim()) {
      setErrorMessage("Enter your email address first, then select Forgot password.");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email.trim());
      setSuccessMessage("Password reset email sent. Check your inbox.");
    } catch (error) {
      setErrorMessage(getFriendlyAuthError(error));
    }
  };

  const switchMode = () => {
    setIsSignup((current) => !current);
    setFullName("");
    setEmail("");
    setPassword("");
    setShowPassword(false);
    setErrorMessage("");
    setSuccessMessage("");
  };

  return (
    <main className="auth-shell relative min-h-dvh overflow-x-hidden bg-[#02050f] text-white">
      <div
        className="pointer-events-none fixed inset-0 bg-cover bg-[36%_center] lg:bg-center"
        style={{ backgroundImage: "url('/orbital-auth-bg.png')" }}
      />
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(90deg,rgba(1,5,15,0.28),rgba(1,5,15,0.06)_45%,rgba(1,5,15,0.38))]" />
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_center,transparent_25%,rgba(1,4,13,0.5)_100%)]" />

      <div className="relative mx-auto min-h-dvh w-full max-w-[1600px] p-0 sm:p-5 lg:p-8">
        <div className="grid min-h-dvh overflow-hidden border-white/15 bg-[#030817]/30 shadow-[0_40px_120px_rgba(0,0,0,0.5)] backdrop-blur-[2px] sm:min-h-[calc(100dvh-2.5rem)] sm:rounded-[30px] sm:border lg:grid-cols-[1.08fr_0.92fr]">
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
                  ["✦", "Gemini", "Image understanding and multimodal research.", "text-blue-300"],
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

          <section className="flex min-h-dvh items-center justify-center px-5 py-8 sm:min-h-[calc(100dvh-2.5rem)] sm:px-8 lg:px-14 xl:px-20">
            <div className="w-full max-w-[500px]">
              <div className="mb-5 flex h-[78px] justify-center overflow-hidden lg:hidden">
                <img
                  src={logo}
                  alt="OrbitalAI"
                  className="w-[245px] -translate-y-[18px] object-contain"
                />
              </div>

              <div className="rounded-[24px] border border-white/20 bg-[#040a1a]/60 px-5 py-7 shadow-[0_28px_90px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:px-8 sm:py-9 lg:px-10">
                <div className="mb-7 text-center">
                  <h2 className="text-3xl font-semibold tracking-[-0.035em] text-white">
                    {isSignup ? "Create Account" : "Sign In"}
                  </h2>
                  <p className="mt-2 text-sm text-slate-300/80">
                    {isSignup
                      ? "Start your journey with OrbitalAI"
                      : "Welcome back to OrbitalAI"}
                  </p>
                </div>

                {errorMessage && (
                  <div role="alert" className="mb-5 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">
                    {errorMessage}
                  </div>
                )}

                {successMessage && (
                  <div role="status" className="mb-5 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">
                    {successMessage}
                  </div>
                )}

                <form onSubmit={handleAuth} className="space-y-5">
                  {isSignup && (
                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-slate-100">Name</span>
                      <input
                        type="text"
                        autoComplete="name"
                        placeholder="Your full name"
                        className="auth-input"
                        value={fullName}
                        onChange={(event) => setFullName(event.target.value)}
                      />
                    </label>
                  )}

                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-100">Email</span>
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
                    <span className="mb-2 block text-sm font-medium text-slate-100">Password</span>
                    <span className="relative block">
                      <input
                        type={showPassword ? "text" : "password"}
                        autoComplete={isSignup ? "new-password" : "current-password"}
                        placeholder={isSignup ? "Create a password" : "Enter your password"}
                        className="auth-input pr-14"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((current) => !current)}
                        className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-slate-400 transition hover:text-white"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? "◉" : "◎"}
                      </button>
                    </span>
                  </label>

                  {!isSignup && (
                    <div className="-mt-2 text-right">
                      <button type="button" onClick={handleForgotPassword} className="text-sm text-blue-300 transition hover:text-blue-200">
                        Forgot password?
                      </button>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-blue-300/20 bg-gradient-to-r from-[#1458ed] via-[#4d50f4] to-[#7542ed] px-5 py-3.5 font-semibold text-white shadow-[0_12px_30px_rgba(55,67,238,0.32)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSubmitting && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />}
                    {isSubmitting
                      ? isSignup
                        ? "Creating account..."
                        : "Signing in..."
                      : isSignup
                      ? "Create account"
                      : "Continue"}
                  </button>
                </form>

                <div className="my-6 flex items-center gap-4 text-xs text-slate-400">
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
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs font-bold text-[#4285f4]">G</span>
                  Continue with Google
                </button>

                <p className="mt-7 text-center text-sm text-slate-300/80">
                  {isSignup ? "Already have an account?" : "Don’t have an account?"}{" "}
                  <button type="button" onClick={switchMode} className="font-medium text-blue-300 transition hover:text-blue-200">
                    {isSignup ? "Sign in" : "Create account"}
                  </button>
                </p>
              </div>

              <p className="mx-auto mt-4 max-w-sm text-center text-xs leading-5 text-slate-400/65">
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
