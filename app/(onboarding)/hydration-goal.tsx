import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Animated, { ZoomIn } from "react-native-reanimated";
import { Drop, Bell, BellSlash, Check } from "phosphor-react-native";
import { useSessionStore } from "@state/useSessionStore";
import { font, semantic, spacing } from "@/src/ui/tokens";
import { preHomeMotion } from "@/src/ui/motion";
import {
  OnboardingStaggeredParagraph,
  countStaggerSteps,
} from "@/src/components/OnboardingStaggeredText";
import { OnboardingFooter } from "@/src/components/OnboardingFooter";
import { OnboardingProgress } from "@/src/components/OnboardingProgress";
import { useOnboardingExit } from "@/src/hooks/useOnboardingExit";
import { resyncHydrationReminders } from "@/src/services/hydrationReminders";
import * as Notifications from "expo-notifications";

const LAYER = {
  bg: "#F2F2F0",
  panel: "#FAFAF9",
  inset: "#EDEDEB",
  border: "rgba(0,0,0,0.04)",
  borderStrong: "rgba(0,0,0,0.08)",
  text: "#111111",
  textMuted: "rgba(17,17,17,0.55)",
  accentBlue: "#2196F3",
  accentBlueSoft: "rgba(33,150,243,0.10)",
} as const;

const CARD_SHADOW = {
  shadowColor: "rgba(0,0,0,0.06)",
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 1,
  shadowRadius: 24,
  elevation: 6,
} as const;

const WATER_AMOUNTS_ML = [1500, 1750, 2000, 2250, 2500, 2750, 3000];

const formatGoal = (ml: number): string => {
  if (ml >= 1000) {
    const liters = ml / 1000;
    return `${Number.isInteger(liters) ? liters : liters.toFixed(1)} L`;
  }
  return `${ml} ml`;
};

/**
 * Onboarding — Hydration Goal Screen
 *
 * Shows the derived personalised water goal (or lets the user pick manually).
 * Optionally enables daily water reminders within their active hours.
 *
 * Inserted after `body-metrics` and before `notifications`.
 */
export default function HydrationGoalScreen() {
  const {
    hydrationGoalMl,
    activeHoursStart,
    activeHoursEnd,
    profileName,
    setHydrationGoalMl,
    setWaterReminderEnabled,
  } = useSessionStore();

  const [selectedGoalMl, setSelectedGoalMl] = useState<number>(
    hydrationGoalMl ?? 2000,
  );
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { triggerExit, exitStyle } = useOnboardingExit();

  const handleContinue = async () => {
    setIsSaving(true);

    setHydrationGoalMl(selectedGoalMl);
    setWaterReminderEnabled(reminderEnabled);

    if (reminderEnabled) {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status === "granted") {
        try {
          await resyncHydrationReminders({
            goalMl: selectedGoalMl,
            activeHoursStart,
            activeHoursEnd,
            userName: profileName || undefined,
          });
        } catch {
          // Non-fatal — continue onboarding
        }
      }
    }

    setIsSaving(false);
    triggerExit("forward", () => router.push("/(onboarding)/notifications"));
  };

  const handleBack = () => {
    triggerExit("back", () => router.back());
  };

  const derivedGoalLiters = hydrationGoalMl ? hydrationGoalMl / 1000 : null;
  const goalStr = formatGoal(selectedGoalMl);

  const titleStr = "Günlük su hedefin";
  const subStr = derivedGoalLiters
    ? `Boy ve kilona göre tavsiye ettiğimiz günlük su miktarı yaklaşık ${derivedGoalLiters.toFixed(1)} litre. İstersen ayarlayabilirsin.`
    : "Günlük ne kadar su içmek istiyorsun?";
  const ts = 30;
  const titleSteps = countStaggerSteps(titleStr);

  return (
    <Animated.View style={[styles.container, exitStyle]}>
      <View style={[styles.panel, CARD_SHADOW]}>
        <OnboardingProgress current={12} total={13} />

        <View style={styles.header}>
          <OnboardingStaggeredParagraph
            text={titleStr}
            style={styles.title}
            staggerMs={ts}
          />
          <OnboardingStaggeredParagraph
            text={subStr}
            style={styles.sub}
            startDelay={titleSteps * ts + 60}
            staggerMs={20}
            containerStyle={{ marginTop: 8 }}
          />
        </View>

        <View style={styles.content}>
          {/* Goal display */}
          <Animated.View
            entering={preHomeMotion.cardEnter(180)}
            style={styles.goalDisplay}
          >
            <View style={styles.goalIconWrap}>
              <Drop size={28} color={LAYER.accentBlue} weight="fill" />
            </View>
            <Text style={styles.goalValue}>{goalStr}</Text>
            <Text style={styles.goalLabel}>/ gün</Text>
          </Animated.View>

          {/* Amount picker */}
          <Animated.View
            entering={preHomeMotion.cardEnter(260)}
            style={styles.pickerRow}
          >
            {WATER_AMOUNTS_ML.map((ml) => (
              <TouchableOpacity
                key={ml}
                style={[
                  styles.pickerChip,
                  selectedGoalMl === ml && styles.pickerChipSelected,
                ]}
                onPress={() => setSelectedGoalMl(ml)}
                activeOpacity={0.78}
                accessibilityRole="radio"
                accessibilityState={{ selected: selectedGoalMl === ml }}
                accessibilityLabel={`${formatGoal(ml)} hedef`}
              >
                {selectedGoalMl === ml && (
                  <Animated.View
                    entering={ZoomIn.duration(200)}
                    style={styles.pickerCheckmark}
                  >
                    <Check size={10} color="#FFF" weight="bold" />
                  </Animated.View>
                )}
                <Text
                  style={[
                    styles.pickerChipText,
                    selectedGoalMl === ml && styles.pickerChipTextSelected,
                  ]}
                >
                  {formatGoal(ml)}
                </Text>
              </TouchableOpacity>
            ))}
          </Animated.View>

          {/* Reminder toggle */}
          <Animated.View
            entering={preHomeMotion.cardEnter(360)}
            style={styles.reminderCard}
          >
            <TouchableOpacity
              style={styles.reminderRow}
              onPress={() => setReminderEnabled(!reminderEnabled)}
              activeOpacity={0.82}
              accessibilityRole="switch"
              accessibilityState={{ checked: reminderEnabled }}
              accessibilityLabel="Su hatırlatıcısı"
            >
              <View style={[styles.reminderIcon, reminderEnabled && styles.reminderIconActive]}>
                {reminderEnabled ? (
                  <Bell size={18} color={LAYER.accentBlue} weight="fill" />
                ) : (
                  <BellSlash size={18} color={LAYER.textMuted} />
                )}
              </View>
              <View style={styles.reminderTextWrap}>
                <Text style={styles.reminderTitle}>Su hatırlatıcısı</Text>
                <Text style={styles.reminderSub}>
                  {reminderEnabled
                    ? activeHoursStart != null && activeHoursEnd != null
                      ? `${String(activeHoursStart).padStart(2, "0")}:00 – ${String(activeHoursEnd).padStart(2, "0")}:00 arası hatırlatırız`
                      : "08:00 – 21:00 arası hatırlatırız"
                    : "Günlük su içme hatırlatmaları"}
                </Text>
              </View>
              <View style={[styles.toggleWrap, reminderEnabled && styles.toggleWrapActive]}>
                <View style={[styles.toggleThumb, reminderEnabled && styles.toggleThumbActive]} />
              </View>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>

      <Animated.View
        entering={preHomeMotion.ctaEnter(400)}
        style={styles.bottom}
      >
        <OnboardingFooter
          onNext={handleContinue}
          onBack={handleBack}
          nextDisabled={isSaving}
          nextLabel={isSaving ? "Kaydediliyor…" : "Devam Et"}
          showBack
        />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: LAYER.bg,
    paddingTop: 74,
    paddingBottom: 42,
    paddingHorizontal: 14,
  },
  panel: {
    flex: 1,
    borderRadius: 30,
    backgroundColor: LAYER.panel,
    borderWidth: 1,
    borderColor: LAYER.border,
    paddingTop: 28,
    paddingBottom: 20,
    paddingHorizontal: spacing.xl,
  },
  header: {
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 30,
    lineHeight: 34,
    fontWeight: "700",
    fontFamily: font.bold,
    color: LAYER.text,
    letterSpacing: -0.5,
  },
  sub: {
    marginTop: 6,
    fontSize: 15,
    fontFamily: font.regular,
    color: LAYER.textMuted,
    lineHeight: 21,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    gap: 20,
  },
  goalDisplay: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 20,
  },
  goalIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: LAYER.accentBlueSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  goalValue: {
    fontSize: 44,
    fontWeight: "700",
    fontFamily: font.bold,
    color: LAYER.text,
    letterSpacing: -1,
  },
  goalLabel: {
    fontSize: 16,
    fontFamily: font.regular,
    color: LAYER.textMuted,
    alignSelf: "flex-end",
    marginBottom: 8,
  },
  pickerRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "center",
  },
  pickerChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: LAYER.borderStrong,
    backgroundColor: LAYER.panel,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  pickerChipSelected: {
    borderColor: LAYER.accentBlue,
    backgroundColor: LAYER.accentBlueSoft,
  },
  pickerCheckmark: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: LAYER.accentBlue,
    alignItems: "center",
    justifyContent: "center",
  },
  pickerChipText: {
    fontSize: 13,
    fontFamily: font.regular,
    color: LAYER.textMuted,
    fontWeight: "500",
  },
  pickerChipTextSelected: {
    color: LAYER.accentBlue,
    fontWeight: "700",
    fontFamily: font.bold,
  },
  reminderCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: LAYER.borderStrong,
    backgroundColor: LAYER.panel,
    overflow: "hidden",
  },
  reminderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
  },
  reminderIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: LAYER.inset,
    alignItems: "center",
    justifyContent: "center",
  },
  reminderIconActive: {
    backgroundColor: LAYER.accentBlueSoft,
  },
  reminderTextWrap: {
    flex: 1,
    gap: 2,
  },
  reminderTitle: {
    fontSize: 15,
    fontWeight: "600",
    fontFamily: font.semiBold,
    color: LAYER.text,
  },
  reminderSub: {
    fontSize: 12,
    fontFamily: font.regular,
    color: LAYER.textMuted,
    lineHeight: 17,
  },
  toggleWrap: {
    width: 44,
    height: 26,
    borderRadius: 13,
    backgroundColor: LAYER.inset,
    borderWidth: 1,
    borderColor: LAYER.borderStrong,
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  toggleWrapActive: {
    backgroundColor: LAYER.accentBlue,
    borderColor: LAYER.accentBlue,
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "rgba(17,17,17,0.35)",
    alignSelf: "flex-start",
  },
  toggleThumbActive: {
    backgroundColor: "#FFFFFF",
    alignSelf: "flex-end",
  },
  bottom: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.sm,
  },
});
