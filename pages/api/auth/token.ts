import { createFirebaseCustomTokenHandler } from "../../../controllers/firebase-server";

export default createFirebaseCustomTokenHandler({
  additionalClaims: (session) => ({ id: session.id }),
});