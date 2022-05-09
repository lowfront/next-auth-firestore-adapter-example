import { DocumentData, QueryDocumentSnapshot } from "firebase-admin/firestore";
import { db } from "../firebase-server";

export async function getTodoRefs(email: string) {
  const docs = await db.collection('store').doc(email).collection('store').get();
  const result: QueryDocumentSnapshot<DocumentData>[] = [];
  docs.forEach(doc => result.push(doc));
  return result;
}
