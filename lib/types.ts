export type Todo = {
  checked: false;
  label: string;
}

export enum TodoFilter {
  all,
  active,
  completed
}
