import { Text, TouchableOpacity, type TouchableOpacityProps } from "react-native";
type SecondaryButtonProps = TouchableOpacityProps & { label: string };
export const SecondaryButton = ({ label, className, ...props }: SecondaryButtonProps) => <TouchableOpacity className={`items-center justify-center rounded-2xl border border-zinc-200 px-5 py-4 ${className ?? ""}`} {...props}><Text className="text-base font-medium text-zinc-800">{label}</Text></TouchableOpacity>;
