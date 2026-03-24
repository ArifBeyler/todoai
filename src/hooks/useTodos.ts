import { useTodoStore } from "@state/useTodoStore";
export const useTodos = () => { const { todos, addTodo, removeTodo, toggleTodo, updateTodo } = useTodoStore(); return { todos, addTodo, removeTodo, toggleTodo, updateTodo }; };
