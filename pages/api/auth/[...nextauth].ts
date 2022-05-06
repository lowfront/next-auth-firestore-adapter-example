import NextAuth, { Session } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import FirebaesAdapter from "adapters/firebase-adapter"
import { db } from "lib/firebase-server"

export default NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_ID,
      clientSecret: process.env.GOOGLE_SECRET,
    }),
  ],
  adapter: FirebaesAdapter(db),
})
