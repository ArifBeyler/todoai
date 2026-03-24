import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { router } from "expo-router";
import { CalendarBlank, House, Plus, Timer, UserCircle } from "phosphor-react-native";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { semantic } from "@/src/ui/tokens";

const TIMING_CONFIG = {
  duration: 280,
  easing: Easing.bezier(0.4, 0, 0.2, 1),
};

const iconByRoute = {
  home: House,
  calendar: CalendarBlank,
  focus: Timer,
  profile: UserCircle,
} as const;

const AnimatedView = Animated.createAnimatedComponent(View);

const TabButton = ({
  route,
  isFocused,
  options,
  onPress,
}: {
  route: { key: string; name: string };
  isFocused: boolean;
  options: { tabBarAccessibilityLabel?: string; tabBarButtonTestID?: string };
  onPress: () => void;
}) => {
  const Icon = iconByRoute[route.name as keyof typeof iconByRoute] ?? House;

  const shellStyle = useAnimatedStyle(() => ({
    backgroundColor: withTiming(
      isFocused ? "#111111" : "#EEF1F4",
      TIMING_CONFIG,
    ),
    transform: [
      {
        scale: withTiming(isFocused ? 1 : 0.92, TIMING_CONFIG),
      },
    ],
  }));

  return (
    <TouchableOpacity
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={isFocused ? { selected: true } : {}}
      accessibilityLabel={options.tabBarAccessibilityLabel}
      testID={options.tabBarButtonTestID}
      style={styles.tabButton}
      activeOpacity={0.8}
    >
      <AnimatedView style={[styles.iconShell, shellStyle]}>
        <Icon
          size={23}
          color={isFocused ? "#FFFFFF" : "#1F1F1F"}
          weight={isFocused ? "fill" : "regular"}
        />
      </AnimatedView>
    </TouchableOpacity>
  );
};

export const CustomTabBar = ({ state, descriptors, navigation }: BottomTabBarProps) => {
  return (
    <View style={styles.wrapper}>
      {state.routes.map((route, index) => {
        const isFocused = state.index === index;
        const descriptor = descriptors[route.key];

        const handlePress = () => {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <TabButton
            key={route.key}
            route={route}
            isFocused={isFocused}
            options={descriptor.options}
            onPress={handlePress}
          />
        );
      })}

      <TouchableOpacity
        onPress={() => router.push("/todo/new")}
        accessibilityRole="button"
        accessibilityLabel="Yeni görev ekle"
        style={styles.tabButton}
        activeOpacity={0.8}
      >
        <View style={[styles.iconShell, styles.plusShell]}>
          <Plus size={23} color="#1F1F1F" weight="bold" />
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    alignSelf: "center",
    bottom: 36,
    width: 348,
    height: 66,
    borderRadius: 999,
    backgroundColor: semantic.screenSurface,
    borderWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    shadowColor: "rgba(0,0,0,0.13)",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 18,
    elevation: 10,
  },
  tabButton: {
    width: 56,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
  },
  iconShell: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  plusShell: {
    backgroundColor: "#F6F8FA",
  },
});
