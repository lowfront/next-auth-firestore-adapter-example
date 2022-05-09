// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, signInWithCustomToken } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";
import { getFirestore, doc, addDoc as _addDoc, getDoc as _getDoc, getDocs as _getDocs, setDoc as _setDoc, updateDoc as _updateDoc, deleteDoc as _deleteDoc, collection, Query, DocumentData, QueryDocumentSnapshot, DocumentReference, WithFieldValue } from "firebase/firestore";
import { sleep } from "./utils";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_CONFIG_apiKey,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_CONFIG_authDomain,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_CONFIG_projectId,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_CONFIG_storageBucket,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_CONFIG_messagingSenderId,
  appId: process.env.NEXT_PUBLIC_FIREBASE_CONFIG_appId,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_CONFIG_measurementId,
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth();
export const analytics = (() => {
  if (typeof window !== 'undefined') return getAnalytics(app); // https://stackoverflow.com/a/69457158/16962686
  return null;
})();
export const db = getFirestore(app);

export async function signInFirebase() {
  const token = await fetch('/api/auth/token').then(res => res.text());
  await signInWithCustomToken(auth, token);
}

export async function trySignInWithCustomToken<T>(f?: (() => Promise<T>)|Promise<T>) { // If try continuously, it appears to fail...
  let failCount = 3;
  
  while (failCount--) {
    try {
      return await (typeof f === 'function' ? f() : f);
    } catch (err: any) {
      console.error(err);
      await signInFirebase();
    }
    await sleep(100);
  }
  
  throw new Error('Fail sign in with custom token.');
}

export const addDoc = ((reference, data) => {
  return trySignInWithCustomToken(_addDoc(reference, data));
}) as typeof _addDoc;

export const getDoc = (reference => {
  return trySignInWithCustomToken(_getDoc(reference));
}) as typeof _getDoc;

export const getDocs = (reference => {
  return trySignInWithCustomToken(_getDocs(reference));
}) as typeof _getDocs;

export const setDoc = ((reference, data, options) => {
  return trySignInWithCustomToken(_setDoc(reference, data, options));
}) as typeof _setDoc;

export const updateDoc = ((reference, field, value, ...moreFieldsAndValues) => {
  return trySignInWithCustomToken(_updateDoc(reference, field, value, ...moreFieldsAndValues));
}) as typeof _updateDoc;

export const deleteDoc = (reference => {
  return trySignInWithCustomToken(_deleteDoc(reference));
}) as typeof _deleteDoc;

export function validCustomToken(id: string) {
  const docRef = doc(db, 'store', id);
  return _getDoc(docRef);
}

export function getUserDoc(email: string, ...paths: string[]) {
  return doc(db, 'store', email, ...paths);
}

export function getUserCollection(email: string, ...paths: string[]) {
  return collection(db, 'store', email, ...paths);
}

export async function findOne(q: Query<DocumentData>): Promise<QueryDocumentSnapshot<DocumentData>|null> {
  const querySnap = await getDocs(q);
  return querySnap.docs[0] ?? null;
}

export async function findMany(q: Query<DocumentData>): Promise<QueryDocumentSnapshot<DocumentData>[]> {
  const querySnap = await getDocs(q);
  const result: QueryDocumentSnapshot<DocumentData>[] = [];
  querySnap.forEach(doc => result.push(doc));
  return result;
}