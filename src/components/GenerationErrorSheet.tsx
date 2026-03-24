import { useCallback } from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { ArrowCounterClockwise, WarningCircle, X } from "phosphor-react-native";
import { radius, semantic, shadow, spacing } from "@/src/ui/tokens";

type GenerationErrorSheetProps = {
  visible: boolean;
  errorType: "generation_failed" | "photo_quality" | "network" | "timeout";
  onRetry: () => void;
  onClose: () => void;
};

const ERROR_CONFIG = {
  generation_failed: {
    title: "Görsel oluşturulamadı",
    message:
      "Yapay zekâ şu an görseli üretemedi. Endişelenme, otomatik olarak tekrar deneniyor.",
    retryLabel: "Tekrar Dene",
    showRetry: true,
  },
  photo_quality: {
    title: "Fotoğraf kalitesi yetersiz",
    message:
      "Yüklediğin fotoğraf yeterince net değil. Lütfen iyi aydınlatılmış, net bir selfie dene.",
    retryLabel: "Yeni Fotoğraf Yükle",
    showRetry: true,
  },
  network: {
    title: "Bağlantı sorunu",
    message:
      "İnternet bağlantında bir sorun var gibi görünüyor. Bağlantını kontrol edip tekrar dene.",
    retryLabel: "Tekrar Dene",
    showRetry: true,
  },
  timeout: {
    title: "İşlem zaman aşımına uğradı",
    message:
      "Sunucu yanıt vermedi. Genellikle birkaç dakika içinde düzelir. Otomatik yeniden deneme zamanlandı.",
    retryLabel: "Şimdi Dene",
    showRetry: true,
  },
} as const;

export const GenerationErrorSheet = ({
  visible,
  errorType,
  onRetry,
  onClose,
}: GenerationErrorSheetProps) => {
  const config = ERROR_CONFIG[errorType];

  const handleRetry = useCallback(() => {
    onRetry();
    onClose();
  }, [onRetry, onClose]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.card, shadow.soft]}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Kapat"
          >
            <X size={16} color={semantic.textSecondary} />
          </TouchableOpacity>

          <View style={styles.iconWrap}>
            <WarningCircle
              size={36}
              color={semantic.danger}
              weight="fill"
            />
          </View>

          <Text style={styles.title}>{config.title}</Text>
          <Text style={styles.message}>{config.message}</Text>

          {config.showRetry && (
            <TouchableOpacity
              style={[styles.retryButton, shadow.soft]}
              onPress={handleRetry}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={config.retryLabel}
            >
              <ArrowCounterClockwise
                size={16}
                color={semantic.textOnDark}
                weight="bold"
              />
              <Text style={styles.retryButtonText}>{config.retryLabel}</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.dismissButton}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Kapat"
          >
            <Text style={styles.dismissButtonText}>Tamam</Text>
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
  closeButton: {
    position: "absolute",
    right: spacing.md,
    top: spacing.md,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#F4F3F1",
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: "#FEEDED",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xxs,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: semantic.textPrimary,
    textAlign: "center",
  },
  message: {
    fontSize: 14,
    color: semantic.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
  retryButton: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: radius.lg,
    backgroundColor: semantic.heroStart,
    paddingVertical: 16,
    marginTop: spacing.xs,
  },
  retryButtonText: {
    color: semantic.textOnDark,
    fontSize: 16,
    fontWeight: "700",
  },
  dismissButton: {
    alignItems: "center",
    paddingVertical: 8,
  },
  dismissButtonText: {
    color: semantic.textSecondary,
    fontSize: 14,
    fontWeight: "600",
  },
});
