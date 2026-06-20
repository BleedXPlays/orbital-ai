import { useState } from "react";
import { auth } from "../firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";

function Login() {
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleAuth = async () => {
    try {
      if (isSignup) {
        await createUserWithEmailAndPassword(auth, email, password);
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
          {isSignup ? "Sign Up" : "Login"}
        </button>

        <button
          onClick={() => setIsSignup(!isSignup)}
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