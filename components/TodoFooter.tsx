import cn from "classnames";
import { Todo, TodoFilter } from "lib/types";
import Link from "next/link";
import { PropsWithoutRef } from "react";

export type TodoFooterProps = PropsWithoutRef<{
  todos: [string, Todo][];
  leftTodoLength: number;
  filter: TodoFilter;
  onClearCompleted: () => void;
}>;

export default function TodoFooter({todos, leftTodoLength, filter, onClearCompleted}: TodoFooterProps) {
  return todos.length ? <footer className="footer">
    <span className="todo-count"><strong>{leftTodoLength}</strong> item left</span>
    <ul className="filters">
      <li>
        <Link href="/"><a className={cn({'selected': filter === TodoFilter.all})}>All</a></Link>
      </li>
      <li>
        <Link href="/active"><a className={cn({'selected': filter === TodoFilter.active})}>Active</a></Link>
      </li>
      <li>
        <Link href="/completed"><a className={cn({'selected': filter === TodoFilter.completed})}>Completed</a></Link>
      </li>
    </ul>
    <button className="clear-completed" onClick={onClearCompleted}>Clear completed</button>
  </footer> : null;
}
