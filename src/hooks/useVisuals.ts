import { useTodoStore } from "@state/useTodoStore";
export const useVisuals = () => { const { visuals, latestVisual, generateVisualForTodo } = useTodoStore(); return { visuals, latestVisual, generateVisualForTodo }; };
