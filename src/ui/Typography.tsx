import { Text, type TextProps } from "react-native";
type TypographyProps = TextProps & { variant?: "title" | "subtitle" | "body" };
export const Typography = ({ variant = "body", style, ...props }: TypographyProps) => { const classNameByVariant = { title: "text-3xl font-semibold text-zinc-900", subtitle: "text-lg text-zinc-600", body: "text-base text-zinc-800" } as const; return <Text {...props} style={style} className={classNameByVariant[variant]} />; };
