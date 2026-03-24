import { useMemo, useRef, useState } from "react";
import { Animated, Easing, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { CheckCircle, Clock } from "phosphor-react-native";
import { radius, shadow, spacing } from "@/src/ui/tokens";
import { CATEGORY_ICON_MAP, DEFAULT_ICON_ENTRY } from "@/src/constants/todoIcons";
import { resolveTodoIcon } from "@/src/utils/resolveTodoIcon";

const RECURRENCE_LABEL: Record<string, string> = {
  daily: "Her gün",
  weekly: "Her hafta",
  weekend: "Hafta sonu",
};

type TaskCardProps = {
  title: string;
  category: string;
  priority: string;
  isCompleted: boolean;
  dueTime?: string;
  recurrence?: string;
  onToggle: () => void;
  onPress: () => void;
};

export const TaskCard = ({
  title,
  category,
  priority,
  isCompleted,
  dueTime,
  recurrence,
  onToggle,
  onPress,
}: TaskCardProps) => {
  const categoryEntry = CATEGORY_ICON_MAP[category] ?? DEFAULT_ICON_ENTRY;
  const resolved = resolveTodoIcon(title, category);
  const ResolvedIcon = resolved.Icon;
  const recurrenceLabel = recurrence ? RECURRENCE_LABEL[recurrence] : undefined;
  const [isAnimatingComplete, setIsAnimatingComplete] = useState(false);
  const cardOpacity = useRef(new Animated.Value(1)).current;
  const cardTranslateX = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(1)).current;
  const contentScale = useRef(new Animated.Value(1)).current;
  const checkScale = useRef(new Animated.Value(isCompleted ? 1 : 0.8)).current;
  const checkOpacity = useRef(new Animated.Value(isCompleted ? 1 : 0)).current;

  const isInteractionLocked = useMemo(() => isAnimatingComplete, [isAnimatingComplete]);

  const resetAnimationState = () => {
    cardOpacity.setValue(1);
    cardTranslateX.setValue(0);
    contentOpacity.setValue(1);
    contentScale.setValue(1);
    checkScale.setValue(1);
    checkOpacity.setValue(1);
  };

  const handleTogglePress = () => {
    if (isInteractionLocked) return;

    if (isCompleted) {
      onToggle();
      return;
    }

    setIsAnimatingComplete(true);
    checkOpacity.setValue(0);
    checkScale.setValue(0.78);

    Animated.sequence([
      Animated.parallel([
        Animated.timing(contentOpacity, {
          toValue: 0.18,
          duration: 220,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(contentScale, {
          toValue: 0.97,
          duration: 220,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(checkOpacity, {
          toValue: 1,
          duration: 180,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(checkScale, {
          toValue: 1,
          friction: 7,
          tension: 180,
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(260),
      Animated.parallel([
        Animated.timing(cardTranslateX, {
          toValue: -52,
          duration: 260,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(cardOpacity, {
          toValue: 0,
          duration: 260,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    ]).start(({ finished }) => {
      if (!finished) {
        setIsAnimatingComplete(false);
        return;
      }
      onToggle();
      resetAnimationState();
      setIsAnimatingComplete(false);
    });
  };

  return (
    <TouchableOpacity
      style={styles.pressableWrap}
      onPress={isInteractionLocked ? undefined : onPress}
      activeOpacity={0.88}
      accessibilityRole="button"
      disabled={isInteractionLocked}
    >
      <Animated.View
        style={[
          styles.card,
          shadow.card,
          {
            opacity: cardOpacity,
            transform: [{ translateX: cardTranslateX }],
          },
        ]}
      >
        <Animated.View
          style={[
            styles.leftContentWrap,
            {
              opacity: contentOpacity,
              transform: [{ scale: contentScale }],
            },
          ]}
        >
          <View style={[styles.iconArea, { backgroundColor: `${resolved.color}14` }]}>
            <ResolvedIcon size={20} color={resolved.color} weight="duotone" />
          </View>
          <View style={styles.body}>
            <Text style={[styles.title, isCompleted && styles.titleDone]} numberOfLines={2}>
              {title}
            </Text>
            <View style={styles.metaRow}>
              {dueTime ? (
                <>
                  <Clock size={13} color="#999" />
                  <Text style={styles.metaText}>{dueTime}</Text>
                  <Text style={styles.dot}>·</Text>
                </>
              ) : null}
              <Text style={styles.metaText}>{categoryEntry.label}</Text>
              {recurrenceLabel ? (
                <>
                  <Text style={styles.dot}>·</Text>
                  <View style={styles.recurrenceBadge}>
                    <Text style={styles.recurrenceBadgeText}>{recurrenceLabel}</Text>
                  </View>
                </>
              ) : null}
            </View>
          </View>
        </Animated.View>
        <TouchableOpacity
          onPress={handleTogglePress}
          hitSlop={12}
          style={styles.checkArea}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: isCompleted || isAnimatingComplete }}
          disabled={isInteractionLocked}
        >
          {isCompleted ? (
            <CheckCircle size={26} color="#76A28A" weight="fill" />
          ) : (
            <View style={styles.checkSlot}>
              <View style={styles.uncheckedCircle} />
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.animatedCheck,
                  {
                    opacity: checkOpacity,
                    transform: [{ scale: checkScale }],
                  },
                ]}
              >
                <CheckCircle size={26} color="#76A28A" weight="fill" />
              </Animated.View>
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  pressableWrap: {
    marginBottom: spacing.sm,
  },
  card: {
    borderRadius: radius.lg,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: spacing.sm,
  },
  leftContentWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  iconArea: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  title: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1A1A1A",
  },
  titleDone: {
    textDecorationLine: "line-through",
    color: "#AAAAAA",
  },
  metaRow: {
    marginTop: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flexWrap: "wrap",
  },
  metaText: {
    fontSize: 12,
    color: "#999999",
  },
  dot: {
    fontSize: 12,
    color: "#CCCCCC",
    marginHorizontal: 2,
  },
  recurrenceBadge: {
    borderRadius: radius.pill,
    backgroundColor: "#F3F3F3",
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  recurrenceBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#888888",
  },
  checkArea: {
    paddingRight: spacing.sm,
    paddingLeft: 4,
    paddingVertical: spacing.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  checkSlot: {
    width: 26,
    height: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  uncheckedCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#D5D5D5",
    backgroundColor: "transparent",
  },
  animatedCheck: {
    position: "absolute",
  },
});
