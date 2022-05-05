// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, signInWithCustomToken } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";
import { getFirestore, doc, getDoc, collection, Query, DocumentData, QueryDocumentSnapshot, getDocs } from "firebase/firestore";
import ky from "ky";

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

export function validCustomToken(id: string) {
  const docRef = doc(db, 'store', id);
  return getDoc(docRef);
}

export async function getUserDoc(id: string, ...paths: string[]) {
  let failCount = 3;
  while (failCount--) {
    try {
      await validCustomToken(id);
      const docRef = doc(db, 'store', id, ...paths);
      return docRef;
    } catch (err: any) {
      console.error(err);
      const token = await ky.get('/api/auth/token').text();
      await signInWithCustomToken(auth, token);
    }
  }
}
export async function getUserCollection(id: string, ...paths: string[]) {
  let failCount = 3;
  while (failCount--) {
    try {
      await validCustomToken(id);
      const collectionRef = collection(db, 'store', id, ...paths);
      return collectionRef;
    } catch (err: any) {
      console.error(err);
      const token = await ky.get('/api/auth/token').text();
      await signInWithCustomToken(auth, token);
    }
  }

  throw new Error('Fail sign in with custom token.');
}