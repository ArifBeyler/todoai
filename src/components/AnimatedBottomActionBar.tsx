import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { router } from "expo-router";
import {
  CalendarBlank,
  House,
  Plus,
  Timer,
  UserCircle,
} from "phosphor-react-native";
import { useEffect, useRef, useState } from "react";
import {
  Pressable,
  StyleSheet,
  View,
  type LayoutChangeEvent,
} from "react-native";
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  CAPSULE_SPRING,
  FOCUS_PROGRESS,
  ITEM_CONTENT_SCALE,
  ITEM_OPACITY,
  LABEL_SPRING,
  PRESS_SCALE_DOWN,
  PRESS_SPRING,
} from "@/src/ui/motionTokens";
import { semantic } from "@/src/ui/tokens";

// ─── Icon registry ────────────────────────────────────────────────────────────

type RouteKey = "home" | "calendar" | "focus" | "profile";

const ICON_MAP: Record<RouteKey, React.ComponentType<{ size: number; color: string; weight: "fill" | "regular" }>> = {
  home: House,
  calendar: CalendarBlank,
  focus: Timer,
  profile: UserCircle,
};

// ─── Design constants ─────────────────────────────────────────────────────────

const BAR_WIDTH = 348;
const BAR_HEIGHT = 66;
const BAR_RADIUS = 999;
const BAR_PADDING_H = 8;
const CAPSULE_SIZE = 44;
const ICON_SIZE = 22;
const PLUS_SECTION_WIDTH = 58;
const SEPARATOR_WIDTH = 1;

const ICON_ACTIVE_COLOR = "#FFFFFF";
const ICON_INACTIVE_COLOR = "#1F1F1F";
const CAPSULE_BG = "#111111";

// ─── Main component ───────────────────────────────────────────────────────────

export const AnimatedBottomActionBar = ({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) => {
  const insets = useSafeAreaInsets();
  const [slotWidth, setSlotWidth] = useState(0);
  const capsuleX = useSharedValue(0);
  const isFirstLayout = useRef(true);
  const activeIndex = state.index;

  const handleTabsLayout = (e: LayoutChangeEvent) => {
    const newSlotWidth = e.nativeEvent.layout.width / state.routes.length;
    setSlotWidth(newSlotWidth);
    capsuleX.value =
      newSlotWidth * activeIndex + (newSlotWidth - CAPSULE_SIZE) / 2;
    isFirstLayout.current = false;
  };

  useEffect(() => {
    if (slotWidth > 0 && !isFirstLayout.current) {
      const targetX =
        slotWidth * activeIndex + (slotWidth - CAPSULE_SIZE) / 2;
      capsuleX.value = withSpring(targetX, CAPSULE_SPRING);
    }
  }, [activeIndex, slotWidth]);

  const capsuleAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: capsuleX.value }],
  }));

  const bottomOffset = insets.bottom > 0 ? insets.bottom + 12 : 36;

  return (
    <View style={[styles.wrapper, { bottom: bottomOffset }]}>
      {/* ── Navigation tabs section ─────────────────────────────────── */}
      <View
        style={styles.tabsSection}
        onLayout={handleTabsLayout}
      >
        {/* Sliding capsule background */}
        {slotWidth > 0 && (
          <Animated.View style={[styles.capsule, capsuleAnimStyle]} />
        )}

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

          const handleLongPress = () => {
            navigation.emit({ type: "tabLongPress", target: route.key });
          };

          return (
            <NavTabItem
              key={route.key}
              routeName={route.name as RouteKey}
              isFocused={isFocused}
              accessibilityLabel={descriptor.options.tabBarAccessibilityLabel}
              testID={descriptor.options.tabBarButtonTestID}
              onPress={handlePress}
              onLongPress={handleLongPress}
            />
          );
        })}
      </View>

      {/* ── Separator ───────────────────────────────────────────────── */}
      <View style={styles.separator} />

      {/* ── Plus action button ──────────────────────────────────────── */}
      <PlusButton />
    </View>
  );
};

// ─── Nav tab item ─────────────────────────────────────────────────────────────

type NavTabItemProps = {
  routeName: RouteKey;
  isFocused: boolean;
  accessibilityLabel?: string;
  testID?: string;
  onPress: () => void;
  onLongPress: () => void;
};

const NavTabItem = ({
  routeName,
  isFocused,
  accessibilityLabel,
  testID,
  onPress,
  onLongPress,
}: NavTabItemProps) => {
  const Icon = ICON_MAP[routeName] ?? House;
  const pressScale = useSharedValue(1);
  const focusProgress = useSharedValue(
    isFocused ? FOCUS_PROGRESS.active : FOCUS_PROGRESS.inactive,
  );

  useEffect(() => {
    focusProgress.value = withSpring(
      isFocused ? FOCUS_PROGRESS.active : FOCUS_PROGRESS.inactive,
      LABEL_SPRING,
    );
  }, [isFocused]);

  // Outer press wrapper — scale down on touch for tactile feel
  const pressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressScale.value }],
  }));

  // Icon wrapper — opacity and scale with focus state
  const iconWrapStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      focusProgress.value,
      [FOCUS_PROGRESS.inactive, FOCUS_PROGRESS.active],
      [ITEM_OPACITY.inactive, ITEM_OPACITY.active],
    ),
    transform: [
      {
        scale: interpolate(
          focusProgress.value,
          [FOCUS_PROGRESS.inactive, FOCUS_PROGRESS.active],
          [ITEM_CONTENT_SCALE.inactive, ITEM_CONTENT_SCALE.active],
        ),
      },
    ],
  }));

  const handlePressIn = () => {
    pressScale.value = withSpring(PRESS_SCALE_DOWN, PRESS_SPRING);
  };

  const handlePressOut = () => {
    pressScale.value = withSpring(1, PRESS_SPRING);
  };

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={styles.tabItem}
      accessibilityRole="button"
      accessibilityState={isFocused ? { selected: true } : {}}
      accessibilityLabel={accessibilityLabel}
      testID={testID}
    >
      <Animated.View style={pressStyle}>
        <Animated.View style={[styles.iconWrap, iconWrapStyle]}>
          <Icon
            size={ICON_SIZE}
            color={isFocused ? ICON_ACTIVE_COLOR : ICON_INACTIVE_COLOR}
            weight={isFocused ? "fill" : "regular"}
          />
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
};

// ─── Plus button ──────────────────────────────────────────────────────────────

const PlusButton = () => {
  const pressScale = useSharedValue(1);

  const pressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressScale.value }],
  }));

  const handlePressIn = () => {
    pressScale.value = withSpring(PRESS_SCALE_DOWN, PRESS_SPRING);
  };

  const handlePressOut = () => {
    pressScale.value = withSpring(1, PRESS_SPRING);
  };

  return (
    <Pressable
      onPress={() => router.push("/todo/new")}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={styles.plusItem}
      accessibilityRole="button"
      accessibilityLabel="Yeni görev ekle"
    >
      <Animated.View style={[styles.plusShell, pressStyle]}>
        <Plus size={22} color="#1F1F1F" weight="bold" />
      </Animated.View>
    </Pressable>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    alignSelf: "center",
    width: BAR_WIDTH,
    height: BAR_HEIGHT,
    borderRadius: BAR_RADIUS,
    backgroundColor: semantic.screenSurface,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: BAR_PADDING_H,
    shadowColor: "rgba(0,0,0,0.13)",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 18,
    elevation: 10,
  },
  tabsSection: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    height: BAR_HEIGHT,
    position: "relative",
  },
  capsule: {
    position: "absolute",
    width: CAPSULE_SIZE,
    height: CAPSULE_SIZE,
    top: (BAR_HEIGHT - CAPSULE_SIZE) / 2,
    left: 0,
    borderRadius: CAPSULE_SIZE / 2,
    backgroundColor: CAPSULE_BG,
    shadowColor: "rgba(0,0,0,0.3)",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 4,
  },
  tabItem: {
    flex: 1,
    height: BAR_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  iconWrap: {
    width: CAPSULE_SIZE,
    height: CAPSULE_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  separator: {
    width: SEPARATOR_WIDTH,
    height: 22,
    backgroundColor: "rgba(0,0,0,0.08)",
    marginHorizontal: 2,
  },
  plusItem: {
    width: PLUS_SECTION_WIDTH,
    height: BAR_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
  },
  plusShell: {
    width: CAPSULE_SIZE,
    height: CAPSULE_SIZE,
    borderRadius: CAPSULE_SIZE / 2,
    backgroundColor: "#F6F8FA",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
  },
});
