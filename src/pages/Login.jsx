import { useState } from "react";
import { auth } from "../firebase";
import { db } from "../firestore";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

function Login() {
  const [isSignup, setIsSignup] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAuth = async () => {
    setErrorMessage("");

    try {
      if (isSignup) {
        if (!fullName.trim()) {
          setErrorMessage("Please enter your full name.");
          return;
        }

        if (!email.trim()) {
          setErrorMessage("Please enter your email.");
          return;
        }

        if (!password.trim()) {
          setErrorMessage("Please enter your password.");
          return;
        }

        setIsSubmitting(true);

        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );

        await updateProfile(userCredential.user, {
          displayName: fullName.trim(),
        });

        await setDoc(doc(db, "users", userCredential.user.uid), {
          name: fullName.trim(),
          email: email,
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
        if (!email.trim()) {
          setErrorMessage("Please enter your email.");
          return;
        }

        if (!password.trim()) {
          setErrorMessage("Please enter your password.");
          return;
        }

        setIsSubmitting(true);
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (error) {
      setErrorMessage(error.message || "Authentication failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#020817] text-white overflow-hidden flex items-center justify-center px-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(80,90,255,0.16),transparent_35%),linear-gradient(135deg,rgba(20,60,120,0.18),transparent_35%),linear-gradient(315deg,rgba(120,60,255,0.16),transparent_35%)]" />

      <div className="relative w-[430px] bg-[#07101F]/95 border border-[#1B2540] rounded-3xl p-8 shadow-2xl shadow-purple-950/30">
        <h1 className="text-4xl font-bold mb-2">
          Orbital
          <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            AI
          </span>
        </h1>

        <p className="text-gray-400 mb-8">
          {isSignup ? "Create your account" : "Login to your workspace"}
        </p>

        {errorMessage && (
          <div className="mb-5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 px-4 py-3 text-sm">
            {errorMessage}
          </div>
        )}

        {isSignup && (
          <input
            type="text"
            placeholder="Full Name"
            className="w-full p-4 rounded-xl bg-[#101827] border border-[#1B2540] outline-none mb-4 focus:border-purple-500/70"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        )}

        <input
          type="email"
          placeholder="Email"
          className="w-full p-4 rounded-xl bg-[#101827] border border-[#1B2540] outline-none mb-4 focus:border-purple-500/70"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full p-4 rounded-xl bg-[#101827] border border-[#1B2540] outline-none mb-6 focus:border-purple-500/70"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleAuth();
          }}
        />

        <button
          onClick={handleAuth}
          disabled={isSubmitting}
          className="w-full p-4 rounded-xl bg-purple-600 hover:bg-purple-700 font-semibold disabled:opacity-50"
        >
          {isSubmitting
            ? isSignup
              ? "Creating account..."
              : "Logging in..."
            : isSignup
            ? "Create Account"
            : "Login"}
        </button>

        <button
          onClick={() => {
            setIsSignup(!isSignup);
            setFullName("");
            setEmail("");
            setPassword("");
            setErrorMessage("");
          }}
          className="w-full mt-5 text-purple-400 hover:text-purple-300"
        >
          {isSignup
            ? "Already have an account? Login"
            : "New here? Create an account"}
        </button>
      </div>
    </div>
  );
}

export default Login;
