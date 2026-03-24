import { Text, TouchableOpacity, type TouchableOpacityProps } from "react-native";
type PrimaryButtonProps = TouchableOpacityProps & { label: string };
export const PrimaryButton = ({ label, className, disabled, ...props }: PrimaryButtonProps) => <TouchableOpacity className={`items-center justify-center rounded-2xl bg-indigo-600 px-5 py-4 ${disabled ? "opacity-50" : ""} ${className ?? ""}`} disabled={disabled} {...props}><Text className="text-base font-semibold text-white">{label}</Text></TouchableOpacity>;
