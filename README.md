# Firebase adepter auth process with custom token example in Next Auth

Example of a firebase adapter that works with firebase authentication. A firebase is a database that has rules functionality for use by both servers and clients. If use firebase on a client, if rule is not set, all data accessible to the client is accessible to anyone who can read the code. When storing user, account, and session data in the next-adapter in the firebase, if rule is not set, all data will be public. This example uses the method of sign in using customToken to protect the data in the firebase at the frontend. After sign in through next-auth's provider, allow api endpoint that issues customToken of the firebase service on the server. When working with the firebase database at the frontend, if the client is not currently sign in as customToken, the user receives a token from the customToken api endpoint and then sign in and proceeds with the database operation. This example was created as a fireestore target, but can also use the same method for the firebase realtime database if necessary.

### Database Structure
```
firestore root
├── _next_auth_firestore_adapter_ [collection]
│  └── store [document]
│     ├── account [collection] # account scheme from next-auth
│     ├── session [collection] # session scheme from next-auth
│     ├── user [collection] # user scheme from next-auth
│     └── customToken [collection]
│        └── <session token> [document] # same as session token in next-auth and when issuing custom token, it is included in additional claims.
│           ├── exires [field]
│           └── token [field]
└── store [collection]
   └── <user email> [document]
      └── store [collection]
         └── <user data uid> [document]
            ├── checked [field]
            └── label [field]
```

1. Go to [firebase console](https://console.firebase.google.com/project) and select your project. 

2. In `Project settings > Service accounts > Firebase Admin SDK`, for server, click "Generate new private key" and download "Generate Key" and write it in the `FIREBASE_ADMIN_CONFIG_` key of `.env.local`.

3. In `Project settings > General`, Click "Add app" at the bottom of the page, add a web app for frontend, and record the contents in the `.env.local` file.

4. Add a new rule as follow in `Firestore Database > Rules`
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if false;
    }
    match /store/{userId}/{document=**} {
    	allow read, write: if request.auth.token.id == userId;
// && exists(/databases/$(database)/documents/_next_auth_firestore_adapter_/store/customToken/$(request.auth.token.sessionToken)); // To enhance security, after sign out, the issued custom token is deactivated and has a session method security level, but database read costs are added for each task.
    }
  }
}
```

5. Add adapter to `pages/api/auth/[...nextauth].ts`.
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
  adapter: FirebaseAdapter(db),
});
```

6. Add custom token endpoint to `pages/api/auth/token.ts`.
```ts
export type CustomToken = {
  token: string;
  expires: string; // date
};

export async function getCustomToken(sessionToken: string) {
  const tokenDocRef = db.collection('_next_auth_firestore_adapter_').doc('store').collection('customToken').doc(sessionToken);
  const tokenDoc = await tokenDocRef.get();
  if (!tokenDoc.exists) return;
  const { token, expires } = tokenDoc.data() as CustomToken;
  if (Date.now() > new Date(expires).getTime()) return;
  return token;
}

export async function updateCustomToken(sessionToken: string, token: string) {
  const tokenDocRef = db.collection('_next_auth_firestore_adapter_').doc('store').collection('customToken').doc(sessionToken);

  await tokenDocRef.set({
    token,
    expires: Date.now() + 60 * 60 * 1000,
  });

  return token;
}

export function getSessionToken(req: NextApiRequest) {
  return req.cookies['__Secure-next-auth.session-token'] ?? req.cookies['next-auth.session-token'];
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(403).json(false);
  const session = await getSession({ req }) as Session;
  if (!session) return res.status(403).json(false);
  const sessionToken = getSessionToken(req);
  const { user } = session as unknown as {
    user: NonNullable<Session['user']>;
  };
  const email = user.email as string;
  let token = await getCustomToken(sessionToken);
  if (token) return res.json(token);

  token = await admin
    .auth()
    .createCustomToken(email, Object.assign({}, additionalClaims?.(session), { sessionToken }));

  await updateCustomToken(sessionToken, token);

  return res.json(token);
};
```

6. Run `npm run dev`

Now use your firebase data in the client, or even if the firebaseConfig is exposed, the data in the next-auth is protected private. If an commented rule is added, customToken issued after sign out is not available.
