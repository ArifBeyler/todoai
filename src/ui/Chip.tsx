import { Text, TouchableOpacity } from "react-native";
type ChipProps = { label: string; selected?: boolean; onPress: () => void };
export const Chip = ({ label, selected = false, onPress }: ChipProps) => <TouchableOpacity onPress={onPress} className={`rounded-full border px-4 py-2 ${selected ? "border-indigo-600 bg-indigo-50" : "border-zinc-200 bg-white"}`}><Text className={selected ? "text-indigo-700" : "text-zinc-700"}>{label}</Text></TouchableOpacity>;
