import { useCallback, useState } from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Bell, BellSlash } from "phosphor-react-native";
import { useFTUEStore } from "@state/useFTUEStore";
import { usePushNotifications } from "@/src/hooks/usePushNotifications";
import { radius, semantic, shadow, spacing } from "@/src/ui/tokens";

type NotificationPromptProps = {
  visible: boolean;
  onClose: () => void;
};

export const NotificationPrompt = ({
  visible,
  onClose,
}: NotificationPromptProps) => {
  const { requestPermissions } = usePushNotifications();
  const setNotificationPermission = useFTUEStore(
    (s) => s.setNotificationPermission,
  );
  const [isRequesting, setIsRequesting] = useState(false);

  const handleAllow = useCallback(async () => {
    if (isRequesting) return;
    setIsRequesting(true);
    try {
      await requestPermissions();
      setNotificationPermission("granted");
    } catch {
      setNotificationPermission("denied");
    } finally {
      setIsRequesting(false);
      onClose();
    }
  }, [isRequesting, requestPermissions, setNotificationPermission, onClose]);

  const handleSkip = useCallback(() => {
    setNotificationPermission("skipped");
    onClose();
  }, [setNotificationPermission, onClose]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleSkip}
    >
      <View style={styles.overlay}>
        <View style={[styles.card, shadow.soft]}>
          <View style={styles.iconWrap}>
            <Bell size={36} color={semantic.heroStart} weight="duotone" />
          </View>

          <Text style={styles.title}>Görsel hazır bildirimi</Text>
          <Text style={styles.subtitle}>
            Yeni görselin hazır olduğunda haber verelim mi?
          </Text>

          <TouchableOpacity
            style={[styles.primaryButton, shadow.soft]}
            onPress={handleAllow}
            disabled={isRequesting}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Bildirimleri aç"
          >
            <Text style={styles.primaryButtonText}>
              {isRequesting ? "İzin isteniyor..." : "Bildirimleri Aç"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.skipButton}
            onPress={handleSkip}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Daha sonra"
          >
            <BellSlash size={15} color={semantic.textSecondary} />
            <Text style={styles.skipButtonText}>Daha Sonra</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
  },
  card: {
    width: "100%",
    borderRadius: radius.xl,
    backgroundColor: semantic.screenSurface,
    padding: spacing.xl,
    alignItems: "center",
    gap: spacing.sm,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: semantic.accentSoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: semantic.textPrimary,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    color: semantic.textSecondary,
    textAlign: "center",
    lineHeight: 21,
  },
  primaryButton: {
    width: "100%",
    borderRadius: radius.lg,
    backgroundColor: semantic.heroStart,
    alignItems: "center",
    paddingVertical: 16,
    marginTop: spacing.xs,
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
    paddingVertical: 10,
  },
  skipButtonText: {
    color: semantic.textSecondary,
    fontSize: 14,
    fontWeight: "600",
  },
});
