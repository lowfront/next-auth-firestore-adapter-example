import { Firestore } from "firebase-admin/firestore";
import { Adapter, AdapterSession, AdapterUser, VerificationToken } from "next-auth/adapters";
import { findOne, from } from "./utils";
import { Account } from "next-auth";

export type FirebaseAdapterProps = {
  adapterCollectionName?: string;
}

export default function FirebaseAdapter(
  db: Firestore,
  options: FirebaseAdapterProps = {},
): Adapter {  
  const adapterCollectionName = options.adapterCollectionName ?? '_next_auth_firestore_adapter_';

  const userCollectionRef = db.collection(adapterCollectionName).doc('store').collection('user');
  const accountCollectionRef = db.collection(adapterCollectionName).doc('store').collection('account');
  const sessionCollectionRef = db.collection(adapterCollectionName).doc('store').collection('session');
  const verificationTokenCollectionRef = db.collection(adapterCollectionName).doc('store').collection('verificationToken');
  
  const sessionTokenCollectionRef = db.collection(adapterCollectionName).doc('store').collection('sessionToken');

  const findUserDoc = (key: string) => userCollectionRef.doc(key);
  const findAccountDoc = (key: string) => accountCollectionRef.doc(key);
  const findSessionDoc = (key: string) => sessionCollectionRef.doc(key);
  const findVerificationTokenDoc = (key: string) => verificationTokenCollectionRef.doc(key);

  return {
    async createUser(data) {
      const userData = {
        name: data.name ?? null,
        email: data.email ?? null,
        image: data.image ?? null,
        emailVerified: data.emailVerified ?? null,
      };
      
      const userRef = await userCollectionRef.add(userData);
      const user = {
        id: userRef.id,
        ...userData,
      } as AdapterUser;

      return user;
    },
    async getUser(id) {
      const userSnap = await findUserDoc(id).get();
      if (!userSnap.exists) return null;
      
      const user = userSnap.data() as AdapterUser;
      return user;
    },
    async getUserByEmail(email) {      
      const q = userCollectionRef.where('email', '==', email).limit(1);
      const userRef = await findOne(q);

      if (!userRef) return null;
      const user = {
        id: userRef.id,
        ...userRef.data(),
      } as AdapterUser;
      return user;
    },
    async getUserByAccount({provider, providerAccountId}) {
      const q = accountCollectionRef.where('provider', '==', provider).where('providerAccountId', '==', providerAccountId).limit(1);
      const accountRef = await findOne(q);
      if (!accountRef) return null;
      const account = {
        id: accountRef.id,
        ...accountRef.data(),
      } as unknown as Account;
      
      const userRef = await findUserDoc(account.userId as string).get();
      if (!userRef.exists) return null
      const userData = userRef.data();

      const user = {
        id: userRef.id,
        ...userData,
      } as AdapterUser;
      return user;
    },
    async updateUser(data) {
      const { id, ...userData } = data;
      await findUserDoc(id as string).set(userData);
      const user = data as AdapterUser;
      return user;
    },
    async deleteUser(id) {
      const q = userCollectionRef.where('id', '==', id).limit(1);
      const userRef = await findOne(q);
      if (!userRef) return;
      await findUserDoc(userRef.id).delete();
    },
    async linkAccount(data) {
      const accountData = data;
      const accountRef = await accountCollectionRef.add(accountData);

      const account = {
        id: accountRef.id,
        ...accountData,
      } as Account;

      return account;
    },
    async unlinkAccount({ provider, providerAccountId }) {
      const q = accountCollectionRef.where('provider', '==', provider).where('providerAccountId', '==', providerAccountId).limit(1);
      const accountRef = await findOne(q);
      if (!accountRef) return;
      await findAccountDoc(accountRef.id).delete()
    },
    async getSessionAndUser(sessionToken) {
      const q =sessionCollectionRef.where('sessionToken', '==', sessionToken).limit(1);
      const sessionRef = await findOne(q);
      if (!sessionRef) return null;
      const sessionData: Partial<AdapterSession> = sessionRef.data();
      const userRef = await findUserDoc(sessionData.userId as string).get();
      if (!userRef.exists) return null
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
      };
    },
    async createSession(data) {
      const sessionData = {
        sessionToken: data.sessionToken ?? null,
        userId: data.userId ?? null,
        expires: data.expires ?? null,
      };
      const sessionRef = await sessionCollectionRef.add(sessionData);
      const session = {
        id: sessionRef.id,
        ...sessionData,
      } as AdapterSession;

      return session;
    },
    async updateSession(data) {
      const { sessionToken, ...sessionData } = data;
      const q = sessionCollectionRef.where('sessionToken', '==', sessionToken).limit(1);
      const sessionRef = await findOne(q);
      if (!sessionRef) return;
      await findSessionDoc(sessionRef.id).set(sessionData);
      return data as AdapterSession;
    },
    async deleteSession(sessionToken) {
      const q = sessionCollectionRef.where('sessionToken', '==', sessionToken).limit(1);
      const sessionRef = await findOne(q);
      if (!sessionRef) return;

      const userRef = (await findUserDoc(sessionRef.data().userId as string).get());
      const email = userRef.data()?.email ?? '';
      
      await Promise.allSettled([
        findSessionDoc(sessionRef.id).delete(),
        db.collection('tokens').doc(email).collection('sessions').doc(sessionToken).delete(),
      ]);
    },
    async createVerificationToken(data) { // need test
      const verificationTokenRef = await verificationTokenCollectionRef.add(data);
      const verificationToken = {
        id: verificationTokenRef.id,
        ...data,
      };
      return verificationToken;
    },
    async useVerificationToken({ identifier, token }) { // need test
      const q = verificationTokenCollectionRef.where('identifier', '==', identifier).where('token', '==', token).limit(1);
      const verificationTokenRef = await findOne(q);
      if (!verificationTokenRef) return null;
      const verificationToken = verificationTokenRef.data();
      await findVerificationTokenDoc(verificationTokenRef.id).delete();
      return from(verificationToken) as VerificationToken;
    },
  }
}