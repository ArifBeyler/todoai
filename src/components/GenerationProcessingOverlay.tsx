import { useEffect, useState } from "react";
import { Modal, StyleSheet, Text, View } from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
} from "react-native-reanimated";
import { semantic, spacing } from "@/src/ui/tokens";
import {
  TypewriterText,
  SpinningLoader,
  AnimatedProgressBar,
} from "@/src/components/animations";

type GenerationProcessingOverlayProps = {
  visible: boolean;
  onDismiss?: () => void;
};

const OVERLAY_MESSAGES = [
  "Görselin üretiliyor...",
  "Görevlerin analiz ediliyor...",
  "Stilin uygulanıyor...",
  "Son rötuşlar yapılıyor...",
];

const MESSAGE_INTERVAL = 3_000;

export const GenerationProcessingOverlay = ({
  visible,
  onDismiss,
}: GenerationProcessingOverlayProps) => {
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    if (!visible) return;
    setMsgIndex(0);

    const interval = setInterval(() => {
      setMsgIndex((prev) => (prev + 1) % OVERLAY_MESSAGES.length);
    }, MESSAGE_INTERVAL);

    return () => clearInterval(interval);
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={onDismiss}
      statusBarTranslucent
    >
      <View style={styles.backdrop}>
        <Animated.View
          entering={FadeIn.duration(300)}
          exiting={FadeOut.duration(200)}
          style={styles.card}
        >
          <SpinningLoader
            size={36}
            containerSize={72}
            borderRadius={36}
            color={semantic.heroStart}
            backgroundColor={semantic.accentSoft}
          />

          <Text style={styles.title}>Görsel Üretiliyor</Text>

          <TypewriterText
            key={msgIndex}
            text={OVERLAY_MESSAGES[msgIndex]}
            speed={30}
            style={styles.message}
          />

          <View style={styles.progressWrapper}>
            <AnimatedProgressBar
              indeterminate
              fillColor={semantic.heroStart}
              height={4}
            />
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  card: {
    width: "100%",
    maxWidth: 320,
    backgroundColor: semantic.screenSurface,
    borderRadius: 24,
    padding: 32,
    alignItems: "center",
    gap: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: semantic.textPrimary,
    letterSpacing: -0.3,
  },
  message: {
    fontSize: 15,
    color: semantic.textSecondary,
    textAlign: "center",
    lineHeight: 21,
  },
  progressWrapper: {
    width: "100%",
    marginTop: 8,
  },
});
