import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.FIREBASE_CONFIG_apiKey,
  authDomain: process.env.FIREBASE_CONFIG_authDomain,
  projectId: process.env.FIREBASE_CONFIG_projectId,
  storageBucket: process.env.FIREBASE_CONFIG_storageBucket,
  messagingSenderId: process.env.FIREBASE_CONFIG_messagingSenderId,
  appId: process.env.FIREBASE_CONFIG_appId,
  measurementId: process.env.FIREBASE_CONFIG_measurementId,
};

export const app = initializeApp(firebaseConfig);

export const auth = getAuth();
  // signInWithEmailAndPassword(auth, process.env.FIREBASE_ADMIN_EMAIL as string, process.env.FIREBASE_ADMIN_PASSWORD as string)
  //   .then((userCredential) => {
  //     console.log('login admin');
  //   })
  //   .catch((error) => {
  //     const errorCode = error.code;
  //     const errorMessage = error.message;
  //     console.error(errorCode, errorMessage);
  //   });

export const db = getFirestore(app);
