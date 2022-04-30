import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import FirebaesAdapter from "../../../adapters/firebase-adapter"
import { db } from "../../../controllers/firebase-db"

export default NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_ID,
      clientSecret: process.env.GOOGLE_SECRET,
    }),
  ],
  adapter: FirebaesAdapter(db, {
    auth: {
      email: process.env.FIREBASE_ADMIN_EMAIL as string,
      password: process.env.FIREBASE_ADMIN_PASSWORD as string,
    },
  }),
})
