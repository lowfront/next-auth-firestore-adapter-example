import { addDoc, deleteDoc, DocumentData, DocumentSnapshot, onSnapshot, query } from 'firebase/firestore'
import 'lib/firebase-web'
import { findMany, getUserCollection, getUserDoc } from '../lib/firebase-web'
import type { GetServerSideProps, NextPage } from 'next'
import { Session } from 'next-auth'
import { getSession, signIn, signOut, useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'

const Home: NextPage<{data: Session & {id: string}}> = ({data: session}) => {
  useEffect(() => {
    if (!session) return;
    (async () => {
      const userDocRef = await getUserDoc(session.id);
    })();
  }, []);

  const [snapTimes, setSnapTimes] = useState<[string, any][]>([]);

  useEffect(() => {
    if (!session) return;
    (async () => {
      const userCollectionRef = await getUserCollection(session.id, 'test');

      // https://github.com/firebase/firebase-js-sdk/issues/5629#issuecomment-945010156
      const unsub = onSnapshot(userCollectionRef, { includeMetadataChanges: true }, (snap) => {
        snap.docChanges().forEach(({ doc, type }) => {
          if (type === 'added') {
            setSnapTimes(data => {
              if (Object.fromEntries(data)[doc.id]) return data;
              return [...data, [doc.id, doc.data()]]
            });
          } else if (type === 'modified') {
            setSnapTimes(data => data.map(record => {
              const [id] = record;
              return id === doc.id ? [id, doc.data()] : record;
            }));
          } else if (type === 'removed') {
            setSnapTimes(data => data.filter(([id]) => id !== doc.id));
          }
        });
      });
      return unsub;
    })()
    
      
  }, []);

  async function addTestDoc() {
    const userCollectionRef = await getUserCollection(session.id, 'test');
    if (userCollectionRef) await addDoc(userCollectionRef, {
      now: Date.now(),
    });
  }
  async function removeTestDoc(docId: string) {
    const docRef = await getUserDoc(session.id, 'test', docId);
    if (docRef) await deleteDoc(docRef);
  }

  return (
    <div>
        {!session && (
          <>
            <span>
              You are not signed in
            </span>
            {' '}
            <a
              href={`/api/auth/signin`}
              onClick={(e) => {
                e.preventDefault()
                signIn('google')
              }}
            >
              Sign in
            </a>
          </>
        )}
        {session?.user && (
          <>
            {session.user.image && (
              <span />
            )}
            <span>
              <small>Signed in as</small>
              <br />
              <strong>{session.user.email ?? session.user.name}</strong>
            </span>
            {' '}
            <a
              href={`/api/auth/signout`}
              onClick={(e) => {
                e.preventDefault()
                signOut()
              }}
            >
              Sign out
            </a>
            <p>
              <button onClick={addTestDoc}>add doc</button>
            </p>
            {snapTimes.map(([id, data], i) => <div key={i}>
              {id} : {data.now} <button onClick={() => removeTestDoc(id)}>Delete</button>
            </div>)}
          </>
        )}
    </div>
  )
}

export default Home;

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getSession(context);
  return {
    props: {
      data: session,
    }
  };
}