import { initializeApp } from "firebase/app";
import { getFirestore } from 'firebase/firestore';
import { getMessaging } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: "AIzaSyCK_9YG5-gjPzJyDG9FhEElRDg-YzHoyYQ",
  authDomain: "ffff-c3e3c.firebaseapp.com",
  projectId: "ffff-c3e3c",
  storageBucket: "ffff-c3e3c.firebasestorage.app",
  messagingSenderId: "481502978134",
  appId: "1:481502978134:web:ae913f9cad7a9a77dd9bf7",
  measurementId: "G-R1YVMQ6LFW"
};

// Initialize Firebase
// const app = initializeApp(firebaseConfig);
// const db = getFirestore(app);
// const messaging = getMessaging(app)
// export { app, db, messaging };

// Проверьте, что приложение инициализируется только один раз
let app;
try {
  app = initializeApp(firebaseConfig);
  console.log("Firebase initialized successfully");
} catch (error) {
  console.error("Firebase initialization error:", error);
}

const db = getFirestore(app);

export { app, db };