import { FlatList } from "react-native";
import { TodoItem } from "./TodoItem";
import type { TodoItemModel } from "@state/useTodoStore";
export const TodoList = ({ todos, onToggle, onPress }: { todos: TodoItemModel[]; onToggle: (id: string) => void; onPress: (id: string) => void }) => <FlatList data={todos} keyExtractor={(item) => item.id} renderItem={({ item }) => <TodoItem item={item} onToggle={() => onToggle(item.id)} onPress={() => onPress(item.id)} />} />;
