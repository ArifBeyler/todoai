import { useEffect, useRef, useState } from "react";
import {
  Pressable,
  StyleSheet,
  View,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import Animated, {
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import {
  CAPSULE_SPRING,
  FOCUS_PROGRESS,
  ITEM_CONTENT_SCALE,
  ITEM_OPACITY,
  LABEL_SPRING,
  PRESS_SCALE_DOWN,
  PRESS_SPRING,
} from "@/src/ui/motionTokens";

const CONTAINER_PADDING = 3;
const CAPSULE_BORDER_RADIUS = 14;
const CAPSULE_COLOR = "#111111";
const CONTAINER_COLOR = "#EDEDEB";
const CONTAINER_BORDER_COLOR = "rgba(0,0,0,0.04)";
const ACTIVE_TEXT_COLOR = "#FFFFFF";
const INACTIVE_TEXT_COLOR = "rgba(17,17,17,0.52)";
const BADGE_ACTIVE_COLOR = "rgba(255,255,255,0.55)";
const BADGE_INACTIVE_COLOR = "#E8643B";

export type SegmentTab = {
  label: string;
  badge?: number;
};

type Props = {
  tabs: SegmentTab[];
  activeIndex: number;
  onChange: (index: number) => void;
  containerStyle?: StyleProp<ViewStyle>;
};

// ─── Main component ───────────────────────────────────────────────────────────

export const AnimatedSegmentedControl = ({
  tabs,
  activeIndex,
  onChange,
  containerStyle,
}: Props) => {
  const [tabWidth, setTabWidth] = useState(0);
  const capsuleX = useSharedValue(0);
  const isFirstLayout = useRef(true);

  const handleContainerLayout = (e: LayoutChangeEvent) => {
    const innerWidth = e.nativeEvent.layout.width - CONTAINER_PADDING * 2;
    const newTabWidth = innerWidth / tabs.length;

    setTabWidth(newTabWidth);

    // Instant position on first layout — no spring jank on mount
    capsuleX.value = newTabWidth * activeIndex;
    isFirstLayout.current = false;
  };

  useEffect(() => {
    if (tabWidth > 0 && !isFirstLayout.current) {
      capsuleX.value = withSpring(tabWidth * activeIndex, CAPSULE_SPRING);
    }
  }, [activeIndex, tabWidth]);

  const capsuleAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: capsuleX.value }],
  }));

  return (
    <View
      style={[styles.container, containerStyle]}
      onLayout={handleContainerLayout}
      accessibilityRole="tablist"
    >
      {/* Absolutely positioned capsule — slides behind tab items */}
      {tabWidth > 0 && (
        <Animated.View
          style={[
            styles.capsule,
            { width: tabWidth },
            capsuleAnimStyle,
          ]}
        />
      )}

      {/* Tab items — flex row above the capsule */}
      {tabs.map((tab, index) => (
        <SegmentItem
          key={index}
          label={tab.label}
          badge={tab.badge}
          isFocused={index === activeIndex}
          onPress={() => onChange(index)}
        />
      ))}
    </View>
  );
};

// ─── Individual segment item ──────────────────────────────────────────────────

type SegmentItemProps = {
  label: string;
  badge?: number;
  isFocused: boolean;
  onPress: () => void;
};

const SegmentItem = ({ label, badge, isFocused, onPress }: SegmentItemProps) => {
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

  // Press feedback — outer wrapper scales down on touch
  const pressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressScale.value }],
  }));

  // Active/inactive content — fades and subtly scales with focus state
  const contentStyle = useAnimatedStyle(() => ({
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

  // Text color cross-fades between inactive dark and active white
  const textStyle = useAnimatedStyle(() => ({
    color: interpolateColor(
      focusProgress.value,
      [FOCUS_PROGRESS.inactive, FOCUS_PROGRESS.active],
      [INACTIVE_TEXT_COLOR, ACTIVE_TEXT_COLOR],
    ),
  }));

  // Badge dot color fades to a soft white tint when active
  const badgeStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      focusProgress.value,
      [FOCUS_PROGRESS.inactive, FOCUS_PROGRESS.active],
      [BADGE_INACTIVE_COLOR, BADGE_ACTIVE_COLOR],
    ),
  }));

  const handlePressIn = () => {
    pressScale.value = withSpring(PRESS_SCALE_DOWN, PRESS_SPRING);
  };

  const handlePressOut = () => {
    pressScale.value = withSpring(1, PRESS_SPRING);
  };

  const showBadge = (badge ?? 0) > 0;

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={styles.tabItem}
      accessibilityRole="tab"
      accessibilityState={{ selected: isFocused }}
      accessibilityLabel={label}
    >
      <Animated.View style={pressStyle}>
        <Animated.View style={[styles.tabContent, contentStyle]}>
          <Animated.Text style={[styles.tabLabel, textStyle]}>
            {label}
          </Animated.Text>
          {showBadge && (
            <Animated.View style={[styles.badgeDot, badgeStyle]} />
          )}
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    padding: CONTAINER_PADDING,
    borderRadius: 18,
    backgroundColor: CONTAINER_COLOR,
    borderWidth: 1,
    borderColor: CONTAINER_BORDER_COLOR,
    position: "relative",
  },
  capsule: {
    position: "absolute",
    top: CONTAINER_PADDING,
    left: CONTAINER_PADDING,
    bottom: CONTAINER_PADDING,
    borderRadius: CAPSULE_BORDER_RADIUS,
    backgroundColor: CAPSULE_COLOR,
    shadowColor: "rgba(0,0,0,0.28)",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 4,
  },
  tabItem: {
    flex: 1,
    zIndex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 9,
  },
  tabContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: -0.1,
  },
  badgeDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
});
