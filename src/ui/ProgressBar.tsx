import { View } from "react-native";
export const ProgressBar = ({ progress }: { progress: number }) => <View className="h-2 w-full rounded-full bg-zinc-200"><View className="h-2 rounded-full bg-indigo-600" style={{ width: `${Math.max(0, Math.min(100, progress * 100))}%` }} /></View>;
