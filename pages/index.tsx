import { addDoc, deleteDoc, DocumentData, DocumentSnapshot, getDoc, onSnapshot, query, setDoc, updateDoc, where } from 'firebase/firestore'
import { auth, findMany, getUserCollection, getUserDoc } from 'lib/firebase-web';
import { getAuth } from 'firebase/auth';
import type { GetServerSideProps, NextPage } from 'next'
import { Session } from 'next-auth'
import { getSession, signIn, signOut, useSession } from 'next-auth/react'
import { KeyboardEvent, SyntheticEvent, useEffect, useState } from 'react'
import Footer from 'components/Footer';
import { Todo } from 'lib/types';
import { useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

const Home: NextPage<{data: Session & {id: string}}> = ({data: session}) => {
  const router = useRouter();
  const [todoEntrys, setTodoEntrys] = useState<[string, Todo][]>([]);
  const [editingTodoId, setEditingTodoId] = useState('');

  const filter = useMemo(() => router.pathname.slice(1), [router]) as ''|'active'|'completed';
  const filteredEntrys = useMemo(() => todoEntrys.filter(([, { checked }]) => {
    switch (filter) {
    case '': return true;
    case 'active': return !checked;
    case 'completed': return checked;
    }
  }), [filter, todoEntrys]);

  const leftTodoLength = useMemo(() => todoEntrys.reduce((acc, [id, {checked}]) => acc + (+!checked), 0), [todoEntrys]);

  useEffect(() => {
    if (!session) return;
    (async () => {
      const userCollectionRef = await getUserCollection(session.id, 'store');

      // https://github.com/firebase/firebase-js-sdk/issues/5629#issuecomment-945010156
      const unsub = onSnapshot(userCollectionRef, { includeMetadataChanges: true }, (snap) => {
        snap.docChanges().forEach(({ doc, type }) => {
          if (type === 'added') {
            setTodoEntrys(data => {
              if (Object.fromEntries(data)[doc.id]) return data;
              return [...data, [doc.id, doc.data() as Todo]]
            });
          } else if (type === 'modified') {
            setTodoEntrys(data => data.map(record => {
              const [id] = record;
              return id === doc.id ? [id, doc.data() as Todo] : record;
            }));
          } else if (type === 'removed') {
            setTodoEntrys(data => data.filter(([id]) => id !== doc.id));
          }
        });
      });
      return unsub;
    })()
    
      
  }, []);

  async function addNewTodo(ev: KeyboardEvent<HTMLInputElement>) {
    const target = ev.target as HTMLInputElement;
    const { value } = target;
    if (ev.key !== 'Enter' || !value) return;
    target.value = '';
    const userCollectionRef = await getUserCollection(session.id, 'store');
    if (userCollectionRef) await addDoc(userCollectionRef, {
      checked: false,
      label: value,
    });
  }
  async function updateTodo(docId: string, ev: SyntheticEvent<HTMLInputElement>) {
    const docRef = await getUserDoc(session.id, 'store', docId);
    if (!docRef) return;
    const target = ev.target as HTMLInputElement;
    const { value } = target;
    await updateDoc(docRef, {
      label: value,
    });
    setEditingTodoId('');
  }

  function editingTodo(docId: string) {
    setEditingTodoId(docId);
  }

  async function toggleTodo(docId: string) {
    const docRef = await getUserDoc(session.id, 'store', docId);
    if (!docRef) return;
    const docSnap = await getDoc(docRef);
    const todo = docSnap.data() as Todo;
    await updateDoc(docRef, {
      checked: !todo.checked,
    });
  }

  async function toggleTodos() {
    const userCollectionRef = await getUserCollection(session.id, 'store');

    if (leftTodoLength) {
      const q = query(userCollectionRef, where('checked', '==', false));
      const docs = await findMany(q);
      await Promise.all(docs.map(doc => updateDoc(doc.ref, {
        checked: true,
      })));
    } else {
      const q = query(userCollectionRef);
      const docs = await findMany(q);
      await Promise.all(docs.map(doc => updateDoc(doc.ref, {
        checked: false,
      })));
    }
  }

  async function removeTodo(docId: string) {
    const docRef = await getUserDoc(session.id, 'store', docId);
    if (docRef) await deleteDoc(docRef);
  }

  async function clearCompletedTodo() {
    const tasks = todoEntrys.filter(([id, { checked }]) => checked).map(([id]) => removeTodo(id));
    await Promise.all(tasks);
  }

  return (
    <>
      {!session ?
        <div>
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
        </div> :
        <div>
        <span>
          <small>Signed in as</small>
          <br />
          <strong>{session?.user?.email ?? ''}</strong>
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
      </div>}
      <section className="todoapp">
        <h1>todos</h1>
        {session?.user && <>
          <header className="header">
            <input className="new-todo" placeholder="What needs to be done?" autoFocus onKeyDown={addNewTodo} />
          </header>
          <section className="main">
            <input id="toggle-all" className="toggle-all" type="checkbox" checked={!leftTodoLength} onChange={toggleTodos} />
            <label htmlFor="toggle-all">Mark all as complete</label>
            <ul className="todo-list">
              {filteredEntrys.map(([id, { checked, label }], i) => <li className={id === editingTodoId ? 'editing' : checked ? 'completed' : ''} onDoubleClick={() => editingTodo(id)} key={id}>
                {id !== editingTodoId ? 
                  <div className="view">
                    <input className="toggle" type="checkbox" checked={checked} onChange={() => toggleTodo(id)} />
                    <label>{label}</label>
                    <button className="destroy" onClick={() => removeTodo(id)}></button>
                  </div> :
                  <input className="edit" defaultValue={label} autoFocus onBlur={(ev) => updateTodo(id, ev)} onKeyDown={ev => ev.key === 'Enter' && updateTodo(id, ev)} />}
              </li>)}
            </ul>
          </section>
          {todoEntrys.length ? <footer className="footer">
            <span className="todo-count"><strong>{leftTodoLength}</strong> item left</span>
            <ul className="filters">
              <li>
                <Link href="/"><a className={filter === '' ? "selected" : ''}>All</a></Link>
              </li>
              <li>
                <Link href="/active"><a className={filter === 'active' ? "selected" : ''}>Active</a></Link>
              </li>
              <li>
                <Link href="/completed"><a className={filter === 'completed' ? "selected" : ''}>Completed</a></Link>
              </li>
            </ul>
            <button className="clear-completed" onClick={clearCompletedTodo}>Clear completed</button>
          </footer> : null}
        </>}
      </section>
      <Footer />
    </>
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