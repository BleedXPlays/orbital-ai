import { useState } from "react";
import { auth, db } from "../firebase";
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

  const handleAuth = async () => {
    try {
      if (isSignup) {
        if (!fullName.trim()) {
          alert("Please enter your full name.");
          return;
        }

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
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="w-[420px] bg-[#08111F] border border-[#1B2540] rounded-2xl p-8">
        <h1 className="text-4xl font-bold mb-2">
          Orbital<span className="text-purple-500">AI</span>
        </h1>

        <p className="text-gray-400 mb-8">
          {isSignup ? "Create your account" : "Login to your workspace"}
        </p>

        {isSignup && (
          <input
            type="text"
            placeholder="Full Name"
            className="w-full p-4 rounded-xl bg-[#101827] border border-[#1B2540] outline-none mb-4"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        )}

        <input
          type="email"
          placeholder="Email"
          className="w-full p-4 rounded-xl bg-[#101827] border border-[#1B2540] outline-none mb-4"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full p-4 rounded-xl bg-[#101827] border border-[#1B2540] outline-none mb-6"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={handleAuth}
          className="w-full p-4 rounded-xl bg-purple-600 hover:bg-purple-700 font-semibold"
        >
          {isSignup ? "Create Account" : "Login"}
        </button>

        <button
          onClick={() => {
            setIsSignup(!isSignup);
            setFullName("");
            setEmail("");
            setPassword("");
          }}
          className="w-full mt-5 text-purple-400"
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