import { useState } from "react";
import { router } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Bell, BellSlash } from "phosphor-react-native";
import { usePushNotifications } from "@/src/hooks/usePushNotifications";
import { radius, semantic, shadow, spacing } from "@/src/ui/tokens";

export default function NotificationsScreen() {
  const { requestPermissions } = usePushNotifications();
  const [isRequesting, setIsRequesting] = useState(false);

  const handleAllow = async () => {
    if (isRequesting) return;
    setIsRequesting(true);
    try {
      await requestPermissions();
    } finally {
      setIsRequesting(false);
      router.push("/(onboarding)/complete");
    }
  };

  const handleSkip = () => {
    router.push("/(onboarding)/complete");
  };

  return (
    <View style={styles.container}>
      <View style={styles.iconWrap}>
        <Bell size={64} color={semantic.heroStart} weight="duotone" />
      </View>

      <Text style={styles.title}>{"Bildirimleri\naçmak ister misin?"}</Text>
      <Text style={styles.sub}>
        Görev ve alışkanlık hatırlatmalarını zamanında alabilmen için bildirim iznine ihtiyacımız var.
      </Text>

      <View style={styles.benefitList}>
        <View style={styles.benefitRow}>
          <Bell size={18} color={semantic.heroStart} weight="fill" />
          <Text style={styles.benefitText}>Görev hatırlatmaları</Text>
        </View>
        <View style={styles.benefitRow}>
          <Bell size={18} color={semantic.heroStart} weight="fill" />
          <Text style={styles.benefitText}>Günlük alışkanlık bildirimleri</Text>
        </View>
        <View style={styles.benefitRow}>
          <Bell size={18} color={semantic.heroStart} weight="fill" />
          <Text style={styles.benefitText}>Görsel hazır bildirim</Text>
        </View>
      </View>

      <View style={styles.buttonGroup}>
        <TouchableOpacity
          style={[styles.primaryButton, shadow.soft]}
          onPress={handleAllow}
          disabled={isRequesting}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Bildirimlere izin ver"
        >
          <Text style={styles.primaryButtonText}>
            {isRequesting ? "İzin isteniyor…" : "İzin Ver"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.skipButton}
          onPress={handleSkip}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Şimdilik atla"
        >
          <BellSlash size={16} color={semantic.textSecondary} />
          <Text style={styles.skipButtonText}>Şimdilik Atla</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: semantic.appBackground,
    paddingHorizontal: spacing.xl,
    paddingTop: 90,
    paddingBottom: 52,
  },
  iconWrap: {
    width: 100,
    height: 100,
    borderRadius: 30,
    backgroundColor: semantic.accentSoft,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 38,
    lineHeight: 42,
    fontWeight: "700",
    color: semantic.textPrimary,
    letterSpacing: -0.8,
  },
  sub: {
    marginTop: spacing.xs,
    fontSize: 15,
    color: semantic.textSecondary,
    lineHeight: 22,
  },
  benefitList: {
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  benefitRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: semantic.border,
    backgroundColor: semantic.screenSurface,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  benefitText: {
    fontSize: 15,
    fontWeight: "600",
    color: semantic.textPrimary,
  },
  buttonGroup: {
    marginTop: "auto",
    gap: spacing.sm,
  },
  primaryButton: {
    borderRadius: radius.lg,
    backgroundColor: semantic.heroStart,
    alignItems: "center",
    paddingVertical: 17,
  },
  primaryButtonText: {
    color: semantic.textOnDark,
    fontSize: 16,
    fontWeight: "700",
  },
  skipButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 14,
  },
  skipButtonText: {
    color: semantic.textSecondary,
    fontSize: 15,
    fontWeight: "600",
  },
});
