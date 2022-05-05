import { createFirebaseCustomTokenHandler } from "lib/firebase-server";

export default createFirebaseCustomTokenHandler({
  additionalClaims: (session) => ({ id: session.id }),
});