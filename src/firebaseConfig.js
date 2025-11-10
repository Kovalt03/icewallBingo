// src/firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

export const firebaseConfig = {
  apiKey: "AIzaSyBBNcQth62YNzxsCvKMduHdQPOHzVL5WjM",
  authDomain: "icewallbingo.firebaseapp.com",
  projectId: "icewallbingo",
  storageBucket: "icewallbingo.firebasestorage.app",
  messagingSenderId: "233524959277",
  appId: "1:233524959277:web:be21c64e1bd96a2b3b40a4",
  measurementId: "G-RQB9FV19DX"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
