import { View, type ViewProps } from "react-native";
export const Card = ({ className, ...props }: ViewProps) => <View className={`rounded-2xl border border-zinc-200 bg-white p-4 ${className ?? ""}`} {...props} />;
