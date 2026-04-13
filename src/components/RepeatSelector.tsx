import { useCallback, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { ArrowsClockwise, CaretRight } from "phosphor-react-native";
import { radius, spacing } from "@/src/ui/tokens";
import {
  LAYER,
  type RepeatConfig,
  repeatConfigToLabel,
  repeatConfigToSummary,
} from "./composerShared";
import { RepeatModal } from "./RepeatModal";

type RepeatSelectorProps = {
  config: RepeatConfig;
  onChange: (config: RepeatConfig) => void;
};

export const RepeatSelector = ({ config, onChange }: RepeatSelectorProps) => {
  const [modalVisible, setModalVisible] = useState(false);

  const label = repeatConfigToLabel(config);
  const summary = repeatConfigToSummary(config);

  const handleOpen = useCallback(() => setModalVisible(true), []);
  const handleCancel = useCallback(() => setModalVisible(false), []);
  const handleApply = useCallback(
    (next: RepeatConfig) => {
      onChange(next);
      setModalVisible(false);
    },
    [onChange],
  );

  return (
    <>
      <TouchableOpacity
        style={styles.row}
        onPress={handleOpen}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={`Tekrar: ${label}`}
      >
        <View style={styles.iconWrap}>
          <ArrowsClockwise
            size={15}
            color="rgba(17, 17, 17, 0.4)"
            weight="bold"
          />
        </View>
        <View style={styles.textWrap}>
          <Text style={styles.label}>Tekrar</Text>
          <Text style={styles.value} numberOfLines={1}>
            {label}
          </Text>
        </View>
        <CaretRight size={14} color="rgba(17, 17, 17, 0.25)" weight="bold" />
      </TouchableOpacity>

      {summary.length > 0 && (
        <View style={styles.summaryRow}>
          <ArrowsClockwise
            size={12}
            color="rgba(17, 17, 17, 0.28)"
            weight="bold"
          />
          <Text style={styles.summaryText}>{summary}</Text>
        </View>
      )}

      <RepeatModal
        visible={modalVisible}
        current={config}
        onApply={handleApply}
        onCancel={handleCancel}
      />
    </>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: radius.sm,
    backgroundColor: LAYER.inset,
    borderWidth: 1,
    borderColor: LAYER.border,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "rgba(17, 17, 17, 0.04)",
    alignItems: "center",
    justifyContent: "center",
  },
  textWrap: {
    flex: 1,
    gap: 1,
  },
  label: {
    fontSize: 11,
    color: "rgba(17, 17, 17, 0.42)",
    fontWeight: "600",
  },
  value: {
    fontSize: 15,
    color: "#111111",
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingLeft: 4,
  },
  summaryText: {
    fontSize: 12,
    fontWeight: "500",
    color: "rgba(17, 17, 17, 0.36)",
    letterSpacing: -0.1,
  },
});
