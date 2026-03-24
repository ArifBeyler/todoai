import { View } from "react-native";
import { Chip } from "@ui/Chip";
import { CATEGORIES } from "@/src/constants/categories";
export const CategoryPicker = ({ value, onChange }: { value: string; onChange: (value: string) => void }) => <View className="flex-row flex-wrap gap-2">{CATEGORIES.map((item) => <Chip key={item.value} label={item.label} selected={value === item.value} onPress={() => onChange(item.value)} />)}</View>;
