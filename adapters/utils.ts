import { DocumentData, getDocs, Query, QueryDocumentSnapshot } from "firebase/firestore";

export async function findOne(q: Query<DocumentData>): Promise<QueryDocumentSnapshot<DocumentData>|null> {
  const querySnap = await getDocs(q);
  return querySnap.docs[0] ?? null;
}

export function from<T = Record<string, unknown>>(object: Record<string, any>): T {
  const newObject: Record<string, unknown> = {}
  for (const key in object) {
    const value = object[key]
    if (key === "expires") {
      newObject.expires = value.toDate();
    } else {
      newObject[key] = value
    }
  }
  return newObject as T
}