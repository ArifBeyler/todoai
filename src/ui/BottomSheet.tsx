import { type ReactNode } from "react";
import { View } from "react-native";
export const BottomSheet = ({ children }: { children: ReactNode }) => <View className="rounded-t-3xl bg-white p-5">{children}</View>;
