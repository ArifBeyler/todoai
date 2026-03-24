import { Text, TouchableOpacity } from "react-native";
export const PhotoUploader = ({ onPress }: { onPress: () => void }) => <TouchableOpacity onPress={onPress} className="items-center justify-center rounded-full bg-zinc-100 p-12"><Text className="text-zinc-500">Fotograf sec</Text></TouchableOpacity>;
