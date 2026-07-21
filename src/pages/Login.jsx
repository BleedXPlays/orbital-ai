import { useState } from "react";
import { auth } from "../firebase";
import { db } from "../firestore";
import logo from "../assets/orbital-logo.png";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
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
  };

  return messages[error?.code] || "We could not complete that request. Please try again.";
};

function Login() {
  const [isSignup, setIsSignup] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAuth = async (event) => {
    event?.preventDefault();
    setErrorMessage("");

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

  const switchMode = () => {
    setIsSignup((current) => !current);
    setFullName("");
    setEmail("");
    setPassword("");
    setShowPassword(false);
    setErrorMessage("");
  };

  return (
    <main className="auth-shell relative min-h-dvh overflow-hidden bg-[#030712] text-white">
      <div className="pointer-events-none absolute inset-0 auth-grid opacity-30" />
      <div className="pointer-events-none absolute -left-32 top-[-12rem] h-[30rem] w-[30rem] rounded-full bg-blue-600/20 blur-[120px]" />
      <div className="pointer-events-none absolute -right-32 bottom-[-14rem] h-[34rem] w-[34rem] rounded-full bg-violet-600/20 blur-[130px]" />

      <div className="relative mx-auto grid min-h-dvh w-full max-w-[1440px] lg:grid-cols-[1.05fr_0.95fr]">
        <section className="hidden border-r border-white/[0.07] px-12 py-10 lg:flex lg:flex-col xl:px-20 xl:py-12">
          <img src={logo} alt="OrbitalAI" className="h-auto w-52 object-contain" />

          <div className="my-auto max-w-[620px] pb-10">
            <div className="mb-7 inline-flex items-center gap-2.5 rounded-full border border-emerald-400/20 bg-emerald-400/[0.07] px-4 py-2 text-sm font-medium text-emerald-300">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              OpenAI, Claude and Gemini connected
            </div>

            <h1 className="max-w-[590px] text-5xl font-semibold leading-[1.08] tracking-[-0.045em] xl:text-6xl">
              One workspace.
              <span className="mt-2 block bg-gradient-to-r from-[#71a7ff] via-[#9b8cff] to-[#d779ff] bg-clip-text text-transparent">
                The right AI for every task.
              </span>
            </h1>

            <p className="mt-7 max-w-[560px] text-lg leading-8 text-slate-400">
              Create, research, analyze documents and understand images without
              switching between tools. OrbitalAI routes each request to the
              best-fit model automatically.
            </p>

            <div className="mt-10 grid max-w-[590px] grid-cols-3 gap-3">
              {[
                ["01", "Ask", "Start with one clear request"],
                ["02", "Route", "OrbitalAI selects the expert"],
                ["03", "Create", "Keep every output organized"],
              ].map(([number, title, copy]) => (
                <div
                  key={number}
                  className="rounded-2xl border border-white/[0.08] bg-white/[0.035] p-4 backdrop-blur"
                >
                  <span className="text-xs font-semibold tracking-[0.16em] text-violet-300">
                    {number}
                  </span>
                  <p className="mt-3 font-semibold text-slate-100">{title}</p>
                  <p className="mt-1 text-sm leading-5 text-slate-500">{copy}</p>
                </div>
              ))}
            </div>
          </div>

          <p className="text-sm text-slate-600">
            A focused multi-AI workspace built for modern work.
          </p>
        </section>

        <section className="flex min-h-dvh items-center justify-center px-4 py-8 sm:px-8 lg:px-12 xl:px-20">
          <div className="w-full max-w-[460px]">
            <div className="mb-8 flex justify-center lg:hidden">
              <img src={logo} alt="OrbitalAI" className="h-auto w-48 object-contain" />
            </div>

            <div className="rounded-[28px] border border-white/[0.09] bg-[#0a1020]/80 p-5 shadow-[0_30px_100px_rgba(0,0,0,0.48)] backdrop-blur-2xl sm:p-8">
              <div className="mb-8">
                <p className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-violet-300">
                  {isSignup ? "Create your workspace" : "Welcome back"}
                </p>
                <h2 className="text-3xl font-semibold tracking-[-0.035em] text-white sm:text-4xl">
                  {isSignup ? "Start building with OrbitalAI" : "Sign in to continue"}
                </h2>
                <p className="mt-3 leading-6 text-slate-400">
                  {isSignup
                    ? "Create an account and keep your chats, projects and files in one place."
                    : "Access your chats, projects and connected AI workspace."}
                </p>
              </div>

              {errorMessage && (
                <div
                  role="alert"
                  className="mb-5 flex gap-3 rounded-2xl border border-red-400/20 bg-red-400/[0.08] px-4 py-3.5 text-sm leading-5 text-red-200"
                >
                  <span aria-hidden="true">!</span>
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleAuth} className="space-y-5">
                {isSignup && (
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-300">
                      Full name
                    </span>
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
                  <span className="mb-2 block text-sm font-medium text-slate-300">
                    Email address
                  </span>
                  <input
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    className="auth-input"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-300">
                    Password
                  </span>
                  <span className="relative block">
                    <input
                      type={showPassword ? "text" : "password"}
                      autoComplete={isSignup ? "new-password" : "current-password"}
                      placeholder={isSignup ? "At least 6 characters" : "Enter your password"}
                      className="auth-input pr-20"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((current) => !current)}
                      className="absolute inset-y-0 right-0 px-4 text-sm font-medium text-slate-400 transition hover:text-white"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="group mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#4f7cff] via-[#725cff] to-[#9b4dff] px-5 py-3.5 font-semibold text-white shadow-[0_14px_35px_rgba(103,78,255,0.28)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_42px_rgba(103,78,255,0.36)] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                >
                  {isSubmitting ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      {isSignup ? "Creating workspace..." : "Signing in..."}
                    </>
                  ) : (
                    <>
                      {isSignup ? "Create account" : "Sign in"}
                      <span className="transition group-hover:translate-x-0.5">→</span>
                    </>
                  )}
                </button>
              </form>

              <div className="my-7 h-px bg-white/[0.08]" />

              <p className="text-center text-sm text-slate-400">
                {isSignup ? "Already have an account?" : "New to OrbitalAI?"}{" "}
                <button
                  type="button"
                  onClick={switchMode}
                  className="font-semibold text-violet-300 transition hover:text-violet-200"
                >
                  {isSignup ? "Sign in" : "Create an account"}
                </button>
              </p>
            </div>

            <p className="mx-auto mt-5 max-w-sm text-center text-xs leading-5 text-slate-600">
              Your workspace is private and protected. AI provider keys remain
              securely on the server.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

export default Login;
