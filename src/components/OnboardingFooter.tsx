import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { ArrowLeft } from "phosphor-react-native";
import { router } from "expo-router";
import { font, shadow } from "@/src/ui/tokens";

type OnboardingFooterProps = {
  onNext: () => void;
  onBack?: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  showBack?: boolean;
};

export const OnboardingFooter = ({
  onNext,
  onBack,
  nextLabel = "Devam Et",
  nextDisabled = false,
  showBack = true,
}: OnboardingFooterProps) => {
  const handleBack = () => (onBack ? onBack() : router.back());

  return (
    <View style={styles.row}>
      {showBack ? (
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Geri"
        >
          <ArrowLeft size={20} color="#111111" weight="bold" />
        </TouchableOpacity>
      ) : (
        <View style={styles.backSpacer} />
      )}

      <TouchableOpacity
        style={[
          styles.nextButton,
          shadow.soft,
          nextDisabled && styles.nextDisabled,
        ]}
        onPress={onNext}
        disabled={nextDisabled}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={nextLabel}
      >
        <Text style={styles.nextText}>{nextLabel}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  backButton: {
    width: 52,
    height: 52,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "rgba(0, 0, 0, 0.08)",
    backgroundColor: "#FAFAF9",
    alignItems: "center",
    justifyContent: "center",
  },
  backSpacer: {
    width: 0,
  },
  nextButton: {
    flex: 1,
    height: 52,
    borderRadius: 22,
    backgroundColor: "#111111",
    alignItems: "center",
    justifyContent: "center",
  },
  nextText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    fontFamily: font.bold,
  },
  nextDisabled: {
    opacity: 0.35,
  },
});
