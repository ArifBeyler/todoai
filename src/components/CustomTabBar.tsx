import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { AnimatedBottomActionBar } from "@/src/components/AnimatedBottomActionBar";

export const CustomTabBar = (props: BottomTabBarProps) => (
  <AnimatedBottomActionBar {...props} />
);
