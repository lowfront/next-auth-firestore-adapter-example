# Firebase adepter auth process suggestion in Next Auth
Example of a firebase adapter that works with firebase authentication. A firebase is a database that has rules functionality for use by both servers and clients. If use firebase on a client, if rule is not set, all data accessible to the client is accessible to anyone who can read the code. When storing user, account, and session data in the next-adapter in the firebase, if rule is not set, all data will be public. So if you're using firebase, for security, you have to create a limited rule for the data stored in next-auth, create a firebase user with access to that data, sign in firebase, and then read and write the data. This repository is an example and a suggestion. I was made a firestore target because I would use firestore, but could use it as a firebase in the same way.

1. Go to [firebase console](https://console.firebase.google.com/project) and select your project. 

2. Add Email/Password Provider in `Authentication > Sign-in method`

3. Add a user to grant permission to store Next Auth data in `Authentication > User` (Use any complex email and password) and copy user UID

4. Add a new rule as follow in `Firestore Database > Rules`
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /_next_auth_firestore_adapter_/{document=**} { // "_next_auth_firestore_adapter_" is default collection name for next-auth data
      allow read, write: if request.auth != null && request.auth.uid == '<user UID>'; // user's UID created in 3
    }
  }
}
```

5. Add adapter to `[...nextauth].ts`.
```ts
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export default NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_ID,
      clientSecret: process.env.GOOGLE_SECRET,
    }),
  ],
  adapter: FirebaesAdapter(db, {
    // adapterCollectionName: '_next_auth_firestore_adapter_', // It can be changed to a different value, but the rule should also be modified to the same value.
    auth: {
      email: process.env.FIREBASE_ADMIN_EMAIL, // user's email created in 3
      password: process.env.FIREBASE_ADMIN_PASSWORD, // user's password created in 3
    },
  }), // If sign in to firebase with signInWithEmailAndPassword method from outside, auth option can be omitted.
});
```

6. Run `npm run dev`

Now use your firebase data in the client, or even if the firebaseConfig is exposed, the data in the next-auth is protected private.