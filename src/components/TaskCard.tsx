import { useMemo, useRef, useState } from "react";
import { Animated, Easing, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { CheckCircle } from "phosphor-react-native";
import { CATEGORY_ICON_MAP, DEFAULT_ICON_ENTRY } from "@/src/constants/todoIcons";

const RECURRENCE_LABEL: Record<string, string> = {
  daily: "Her gün",
  weekly: "Her hafta",
  weekend: "Hafta sonu",
  weekdays: "Hafta içi",
  custom: "Özel tarihler",
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
  isCompleted,
  recurrence,
  onToggle,
  onPress,
}: TaskCardProps) => {
  const categoryEntry = CATEGORY_ICON_MAP[category] ?? DEFAULT_ICON_ENTRY;
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

  const hasMeta = categoryEntry.label || recurrenceLabel;

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
          {
            opacity: cardOpacity,
            transform: [{ translateX: cardTranslateX }],
          },
        ]}
      >
        <TouchableOpacity
          onPress={handleTogglePress}
          hitSlop={12}
          style={styles.checkArea}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: isCompleted || isAnimatingComplete }}
          disabled={isInteractionLocked}
        >
          {isCompleted ? (
            <CheckCircle size={24} color="#76A28A" weight="fill" />
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
                <CheckCircle size={24} color="#76A28A" weight="fill" />
              </Animated.View>
            </View>
          )}
        </TouchableOpacity>

        <Animated.View
          style={[
            styles.bodyWrap,
            {
              opacity: contentOpacity,
              transform: [{ scale: contentScale }],
            },
          ]}
        >
          <Text
            style={[styles.title, isCompleted && styles.titleDone]}
            numberOfLines={2}
          >
            {title}
          </Text>
          {hasMeta && (
            <View style={styles.metaRow}>
              <Text style={styles.metaText}>{categoryEntry.label}</Text>
              {recurrenceLabel ? (
                <>
                  <Text style={styles.dot}>·</Text>
                  <Text style={styles.metaText}>{recurrenceLabel}</Text>
                </>
              ) : null}
            </View>
          )}
        </Animated.View>
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  pressableWrap: {
    marginBottom: 10,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "rgba(0,0,0,0.05)",
    paddingVertical: 16,
    paddingHorizontal: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 6,
  },
  checkArea: {
    alignItems: "center",
    justifyContent: "center",
  },
  checkSlot: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  uncheckedCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "rgba(0,0,0,0.15)",
    backgroundColor: "transparent",
  },
  animatedCheck: {
    position: "absolute",
  },
  bodyWrap: {
    flex: 1,
    gap: 3,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111111",
  },
  titleDone: {
    textDecorationLine: "line-through",
    color: "rgba(17,17,17,0.35)",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flexWrap: "wrap",
  },
  metaText: {
    fontSize: 12,
    fontWeight: "500",
    color: "rgba(17,17,17,0.38)",
  },
  dot: {
    fontSize: 12,
    color: "rgba(17,17,17,0.2)",
    marginHorizontal: 1,
  },
});
