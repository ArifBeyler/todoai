import { Image, Text, View } from "react-native";
import type { VisualModel } from "@state/useTodoStore";
export const VisualCard = ({ visual }: { visual: VisualModel }) => <View className="overflow-hidden rounded-2xl border border-zinc-200 bg-white"><Image source={{ uri: visual.imageUrl }} className="h-36 w-full" /><View className="p-3"><Text className="text-sm font-medium text-zinc-900">{visual.styleUsed}</Text><Text className="mt-1 text-xs text-zinc-500">{new Date(visual.createdAt).toLocaleDateString()}</Text></View></View>;
