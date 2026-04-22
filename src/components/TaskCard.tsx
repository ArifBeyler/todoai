import { useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { CheckCircle, Sparkle, SealCheck, Hourglass } from "phosphor-react-native";
import { CATEGORY_ICON_MAP, DEFAULT_ICON_ENTRY } from "@/src/constants/todoIcons";
import type { TodoVisualStatus } from "@state/useTodoStore";

export type TaskGenerationState =
  | "none" // no active batch affects this row
  | "queued" // in the batch, waiting its turn
  | "generating" // currently being generated
  | "ready"; // visual produced

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
  visualStatus?: TodoVisualStatus;
  generationState?: TaskGenerationState;
  onToggle: () => void;
  onPress: () => void;
};

const GENERATION_BADGE_COPY: Record<
  TaskGenerationState,
  { label: string; testID: string } | null
> = {
  none: null,
  queued: { label: "Sırada", testID: "task-generation-queued" },
  generating: { label: "Üretiliyor", testID: "task-generation-generating" },
  ready: { label: "Hazır", testID: "task-generation-ready" },
};

export const TaskCard = ({
  title,
  category,
  isCompleted,
  recurrence,
  visualStatus = "idle",
  generationState = "none",
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
        {!isCompleted ? (() => {
          const badgeCopy = GENERATION_BADGE_COPY[generationState];
          if (badgeCopy) {
            const isGenerating = generationState === "generating";
            const isReady = generationState === "ready";
            return (
              <View
                style={[
                  styles.generationBadge,
                  isGenerating && styles.generationBadgeGenerating,
                  isReady && styles.generationBadgeReady,
                ]}
                accessibilityLabel={`Görsel ${badgeCopy.label}`}
                testID={badgeCopy.testID}
              >
                {isGenerating ? (
                  <ActivityIndicator size="small" color="#3A2E28" />
                ) : isReady ? (
                  <SealCheck size={12} color="#2F5E46" weight="fill" />
                ) : (
                  <Hourglass size={12} color="#6A5D53" weight="fill" />
                )}
                <Text
                  style={[
                    styles.generationBadgeText,
                    isGenerating && styles.generationBadgeTextGenerating,
                    isReady && styles.generationBadgeTextReady,
                  ]}
                >
                  {badgeCopy.label}
                </Text>
              </View>
            );
          }
          if (visualStatus === "pending") {
            return (
              <View
                style={styles.visualPendingWrap}
                accessibilityLabel="Görsel oluşturuluyor"
                testID="task-visual-pending"
              >
                <ActivityIndicator size="small" color="#3A2E28" />
              </View>
            );
          }
          if (visualStatus === "ready") {
            return (
              <View
                style={styles.visualReadyWrap}
                accessibilityLabel="Görsel hazır"
                testID="task-visual-ready"
              >
                <Sparkle size={14} color="#2F5E46" weight="fill" />
              </View>
            );
          }
          return null;
        })() : null}
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
  visualPendingWrap: {
    width: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  visualReadyWrap: {
    width: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  generationBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(17,17,17,0.08)",
    backgroundColor: "#F1EEE8",
  },
  generationBadgeGenerating: {
    backgroundColor: "#EAE3D5",
    borderColor: "rgba(17,17,17,0.1)",
  },
  generationBadgeReady: {
    backgroundColor: "#E0F0E2",
    borderColor: "rgba(47,94,70,0.18)",
  },
  generationBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#6A5D53",
    letterSpacing: 0.1,
  },
  generationBadgeTextGenerating: {
    color: "#3A2E28",
  },
  generationBadgeTextReady: {
    color: "#2F5E46",
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
