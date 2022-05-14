import { onSnapshot, query, where } from 'firebase/firestore'
import { addDoc, deleteDoc, getDoc, updateDoc, findMany, getUserCollection, getUserDoc, signInFirebase } from 'lib/firebase-web';
import type { GetServerSideProps, NextPage } from 'next'
import { Session } from 'next-auth'
import { getSession } from 'next-auth/react'
import { KeyboardEvent, SyntheticEvent, useEffect, useState } from 'react'
import Footer from 'components/Footer';
import { Todo, TodoFilter } from 'lib/types';
import { useMemo } from 'react';
import { useRouter } from 'next/router';
import User from 'components/User';
import { getTodoRefs } from 'lib/Todo/todo.controller';
import TodoFooter from 'components/TodoFooter';
import TodoLayout from 'components/TodoItem';
import Loading from 'components/Loading';

const Home: NextPage<{data: Session & {id: string}; todos: any[]}> = ({data: session, todos}) => {
  const router = useRouter();
  // const [loading, setLoading] = useState(!!session);
  const [todoEntrys, setTodoEntrys] = useState<[string, Todo][]>(todos);
  const [editingTodoId, setEditingTodoId] = useState('');

  const filter = useMemo(() => {
    const pathname = router.pathname.slice(1);
    if (!pathname) return TodoFilter.all;
    return TodoFilter[pathname as any];
  }, [router]) as TodoFilter;

  const filteredEntrys = useMemo(() => todoEntrys.filter(([, { checked }]) => {
    switch (filter) {
    case TodoFilter.all: return true;
    case TodoFilter.active: return !checked;
    case TodoFilter.completed: return checked;
    }
  }), [filter, todoEntrys]);

  const leftTodoLength = useMemo(() => todoEntrys.reduce((acc, [id, {checked}]) => acc + (+!checked), 0), [todoEntrys]);

  const email = useMemo(() => session?.user?.email ?? '', [session]);


  useEffect(() => {
    if (!session) return; // FIXME: load session;
    (async () => {
      const userCollectionRef = getUserCollection(email, 'store');
      await signInFirebase(); // loading;
      // setLoading(false);

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
    const userCollectionRef = await getUserCollection(email, 'store');
    if (userCollectionRef) await addDoc(userCollectionRef, {
      checked: false,
      label: value,
    });
  }
  async function updateTodo(docId: string, ev: SyntheticEvent<HTMLInputElement>) {
    const docRef = await getUserDoc(email, 'store', docId);
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
    const docRef = await getUserDoc(email, 'store', docId);
    if (!docRef) return;
    const docSnap = await getDoc(docRef);
    const todo = docSnap.data() as Todo;
    await updateDoc(docRef, {
      checked: !todo.checked,
    });
  }

  async function toggleTodos() {
    const userCollectionRef = await getUserCollection(email, 'store');

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
    const docRef = await getUserDoc(email, 'store', docId);
    if (docRef) await deleteDoc(docRef);
  }

  async function clearCompletedTodo() {
    const tasks = todoEntrys.filter(([id, { checked }]) => checked).map(([id]) => removeTodo(id));
    await Promise.all(tasks);
  }

  return (
    <>
      {/* <Loading block={loading} /> */}
      <User session={session} />
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
              {filteredEntrys.map(([id, { checked, label }], i) => 
                <TodoLayout 
                  id={id}
                  checked={checked}
                  label={label}
                  editingTodoId={editingTodoId}
                  onEditTodo={editingTodo}
                  onToggleTodo={toggleTodo}
                  onRemoveTodo={removeTodo}
                  onUpdateTodo={updateTodo}
                  key={id} />
              )}
            </ul>
          </section>
          <TodoFooter
            todos={todoEntrys}
            leftTodoLength={leftTodoLength}
            filter={filter}
            onClearCompleted={clearCompletedTodo} />
        </>}
      </section>
      <Footer />
    </>
  )
}

export default Home;

export const getServerSideProps: GetServerSideProps = async (context) => { // It's a lot of time every page.
  const session = await getSession(context);
  const todoRefs = session ? await getTodoRefs(session?.user?.email as string ?? '') : [];

  return {
    props: {
      data: session,
      todos: todoRefs.map(doc => [doc.id, doc.data()]),
    }
  };
}