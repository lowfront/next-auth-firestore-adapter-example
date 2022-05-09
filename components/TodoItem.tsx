import { PropsWithoutRef, SyntheticEvent } from "react";

export type TodoLayoutProps = PropsWithoutRef<{
  id: string;
  checked: boolean;
  label: string;
  editingTodoId: string;
  onEditTodo: (id: string) => void;
  onToggleTodo: (id: string) => void;
  onRemoveTodo: (id: string) => void;
  onUpdateTodo: (id: string, ev: SyntheticEvent<HTMLInputElement>) => void;
}>;

export default function TodoLayout({id, checked, label, editingTodoId, onEditTodo, onToggleTodo, onRemoveTodo, onUpdateTodo}: TodoLayoutProps) {
  return <li className={id === editingTodoId ? 'editing' : checked ? 'completed' : ''} onDoubleClick={() => onEditTodo(id)} key={id}>
    {id !== editingTodoId ? 
      <div className="view">
        <input className="toggle" type="checkbox" checked={checked} onChange={() => onToggleTodo(id)} />
        <label>{label}</label>
        <button className="destroy" onClick={() => onRemoveTodo(id)}></button>
      </div> :
      <input className="edit" defaultValue={label} autoFocus onBlur={(ev) => onUpdateTodo(id, ev)} onKeyDown={ev => ev.key === 'Enter' && onUpdateTodo(id, ev)} />}
  </li>;
}
