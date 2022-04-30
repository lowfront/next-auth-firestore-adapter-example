import { addDoc, collection, deleteDoc, doc, Firestore, getDoc, limit, query, setDoc, where } from "firebase/firestore";
import { Adapter, AdapterSession, AdapterUser, VerificationToken } from "next-auth/adapters";
import { findOne, from } from "./utils";
import { Account } from "next-auth";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";

export type FirebaseAdapterProps = {
  adapterCollectionName?: string;
  auth?: {
    email: string;
    password: string;
  }
}

export const getFirebaseAuth = (function () {
  let inited = false;
  let result: Promise<any>;
  return async function getFirebaseAuth({email, password}: {email?: string; password?: string} = {}) {
    if (!email || !password) return Promise.resolve();
    if (inited) return result;
    inited = true;
    const auth = getAuth();
    return result = signInWithEmailAndPassword(auth, email, password);
  }
})();

export default function FirebaesAdapter(
  db: Firestore,
  options: FirebaseAdapterProps = {},
): Adapter {  
  const adapterCollectionName = options.adapterCollectionName ?? '_next_auth_firestore_adapter_';

  if (options.auth) {
    getFirebaseAuth(options.auth);
  }

  const userCollectionRef = collection(db, adapterCollectionName, 'store', 'user');
  const accountCollectionRef = collection(db, adapterCollectionName, 'store', 'account');
  const sessionCollectionRef = collection(db, adapterCollectionName, 'store', 'session');
  const verificationTokenCollectionRef = collection(db, adapterCollectionName, 'store', 'verificationToken');
  
  const findUserDoc = (...keys: string[]) => doc(db, adapterCollectionName, 'store', 'user', ...keys);
  const findAccountDoc = (...keys: string[]) => doc(db, adapterCollectionName, 'store', 'account', ...keys);
  const findSessionDoc = (...keys: string[]) => doc(db, adapterCollectionName, 'store', 'session', ...keys);
  const findVerificationTokenDoc = (...keys: string[]) => doc(db, adapterCollectionName, 'store', 'verificationToken', ...keys);

  return {
    async createUser(data) {
      await getFirebaseAuth(options.auth);
      const userData = {
        name: data.name ?? null,
        email: data.email ?? null,
        image: data.image ?? null,
        emailVerified: data.emailVerified ?? null,
      };
      const userRef = await addDoc(userCollectionRef, userData);
      const user = {
        id: userRef.id,
        ...userData,
      } as AdapterUser;
      return user;
    },
    async getUser(id) {
      await getFirebaseAuth(options.auth);
      const userSnap = await getDoc(findUserDoc(id));
      if (!userSnap.exists()) return null;
      
      const user = userSnap.data() as AdapterUser;
      return user;
    },
    async getUserByEmail(email) {
      await getFirebaseAuth(options.auth);
      const q = query(userCollectionRef, where('email', '==', email), limit(1));
      const userRef = await findOne(q);

      if (!userRef) return null;
      const user = {
        id: userRef.id,
        ...userRef.data(),
      } as AdapterUser;
      return user;
    },
    async getUserByAccount({provider, providerAccountId}) {
      await getFirebaseAuth(options.auth);
      const q = query(accountCollectionRef, where('provider', '==', provider), where('providerAccountId', '==', providerAccountId), limit(1));
      const accountRef = await findOne(q);
      if (!accountRef) return null;
      const account = {
        id: accountRef.id,
        ...accountRef.data(),
      } as unknown as Account;

      const userRef = await getDoc(findUserDoc(account.userId as string));
      if (!userRef) return null
      const userData = userRef.data();

      const user = {
        id: userRef.id,
        ...userData,
      } as AdapterUser;
      return user;
    },
    async updateUser(data) {
      await getFirebaseAuth(options.auth);
      const { id, ...userData } = data;
      await setDoc(findUserDoc(id as string), userData);

      const user = data as AdapterUser;
      return user;
    },
    async deleteUser(id) {
      await getFirebaseAuth(options.auth);
      const q = query(userCollectionRef, where('id', '==', id), limit(1));
      const userRef = await findOne(q);
      if (!userRef) return;
      await deleteDoc(findUserDoc(userRef.id));
    },
    async linkAccount(data) {
      await getFirebaseAuth(options.auth);
      const accountData = data;

      const accountRef = await addDoc(accountCollectionRef, accountData);

      const account = {
        id: accountRef.id,
        ...accountData,
      } as Account;

      return account;
    },
    async unlinkAccount({ provider, providerAccountId }) {
      await getFirebaseAuth(options.auth);
      const q = query(accountCollectionRef, where('provider', '==', provider), where('providerAccountId', '==', providerAccountId), limit(1));
      const accountRef = await findOne(q);
      if (!accountRef) return;
      await deleteDoc(findAccountDoc(accountRef.id));
    },
    async getSessionAndUser(sessionToken) {
      await getFirebaseAuth(options.auth);
      let q;
      q = query(sessionCollectionRef, where('sessionToken', '==', sessionToken), limit(1));
      const sessionRef = await findOne(q);
      if (!sessionRef) return null;
      const sessionData: Partial<AdapterSession> = sessionRef.data();
      const userRef = await getDoc(findUserDoc(sessionData.userId as string));
      if (!userRef) return null
      const userData = userRef.data();
      
      const user = {
        id: userRef.id,
        ...userData,
      } as AdapterUser;
      const session = {
        id: sessionRef.id,
        ...sessionData,
      } as AdapterSession;

      return {
        user: user,
        session: from(session),
      }
    },
    async createSession(data) {
      await getFirebaseAuth(options.auth);
      const sessionData = {
        sessionToken: data.sessionToken ?? null,
        userId: data.userId ?? null,
        expires: data.expires ?? null,
      };
      const sessionRef = await addDoc(sessionCollectionRef, sessionData);
      const session = {
        id: sessionRef.id,
        ...sessionData,
      } as AdapterSession;
      return session;
    },
    async updateSession(data) {
      await getFirebaseAuth(options.auth);
      const { id, ...sessionData } = data;
      await setDoc(findSessionDoc(id as string), sessionData);
      return data as AdapterSession;
    },
    async deleteSession(sessionToken) {
      await getFirebaseAuth(options.auth);
      const q = query(sessionCollectionRef, where('sessionToken', '==', sessionToken), limit(1));
      const sessionRef = await findOne(q);
      if (!sessionRef) return;
      await deleteDoc(findSessionDoc(sessionRef.id));
    },
    async createVerificationToken(data) { // need test
      const verificationTokenRef = await addDoc(verificationTokenCollectionRef, data);
      const verificationToken = {
        id: verificationTokenRef.id,
        ...data,
      };
      return verificationToken;
    },
    async useVerificationToken({ identifier, token }) { // need test
      const q = query(verificationTokenCollectionRef, where('identifier', '==', identifier), where('token', '==', token), limit(1));
      const verificationTokenRef = await findOne(q);
      if (!verificationTokenRef) return null;
      const verificationToken = verificationTokenRef.data();
      await deleteDoc(findVerificationTokenDoc(verificationTokenRef.id));
      return verificationToken as VerificationToken;
    },
  }
}