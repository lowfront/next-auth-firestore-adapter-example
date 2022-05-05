// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, signInWithCustomToken } from "firebase/auth";
// import { getAnalytics } from "firebase/analytics";
import { getFirestore, doc, getDoc, collection, Query, DocumentData, QueryDocumentSnapshot, getDocs } from "firebase/firestore";
import ky from "ky";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: process.env.FIREBASE_CONFIG_apiKey,
  authDomain: process.env.FIREBASE_CONFIG_authDomain,
  projectId: process.env.FIREBASE_CONFIG_projectId,
  storageBucket: process.env.FIREBASE_CONFIG_storageBucket,
  messagingSenderId: process.env.FIREBASE_CONFIG_messagingSenderId,
  appId: process.env.FIREBASE_CONFIG_appId,
  measurementId: process.env.FIREBASE_CONFIG_measurementId
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth();
// export const analytics = getAnalytics(app);
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


export async function getUserDoc(id: string, ...paths: string[]) {
  let failCount = 3;
  while (failCount--) {
    try {
      const docRef = await doc(db, 'store', id, ...paths);
      return docRef;
      break;
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
      const collectionRef = await collection(db, 'store', id, ...paths);
      return collectionRef;
      break;
    } catch (err: any) {
      console.error(err);
      const token = await ky.get('/api/auth/token').text();
      await signInWithCustomToken(auth, token);
    }
  }

  throw new Error('Fail sign in with custom token.');
}