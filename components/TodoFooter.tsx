import { Todo } from "lib/types";
import Link from "next/link";
import { PropsWithChildren } from "react";

export type TodoFooterProps = PropsWithChildren<{
  todos: [string, Todo][];
  leftTodoLength: number;
  filter: '' | 'active' | 'completed';
  onClearCompleted: () => void;
}>;

export default function TodoFooter({todos, leftTodoLength, filter, onClearCompleted}: TodoFooterProps) {
  return todos.length ? <footer className="footer">
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
    <button className="clear-completed" onClick={onClearCompleted}>Clear completed</button>
  </footer> : null;
}
