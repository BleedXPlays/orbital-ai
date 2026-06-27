import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAe9vgd1epSZFjZyBl5akM2MKWljwid4Q8",
  authDomain: "orbital-ai-957b9.firebaseapp.com",
  projectId: "orbital-ai-957b9",
  storageBucket: "orbital-ai-957b9.firebasestorage.app",
  messagingSenderId: "58566665634",
  appId: "1:58566665634:web:686d2f64bc657db77abefb",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);