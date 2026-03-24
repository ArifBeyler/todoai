import { ImageBackground, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { VisualModel } from "@state/useTodoStore";
import { LinearGradient } from "expo-linear-gradient";
import { Sparkle, TrendUp } from "phosphor-react-native";
import { palette, semantic, shadow } from "@/src/ui/tokens";

type VisualBannerProps = {
  visual: VisualModel | null;
  isGenerating?: boolean;
  profileName?: string;
  productivityScore?: number;
  onPressAssistant?: () => void;
  onPressScore?: () => void;
};

const fallbackHero = require("../../assets/images/hero-sample-full.png");

export const VisualBanner = ({
  visual,
  isGenerating,
  productivityScore = 84,
  onPressAssistant,
  onPressScore,
}: VisualBannerProps) => {
  const heroSource = visual?.imageUrl ? { uri: visual.imageUrl } : fallbackHero;

  if (isGenerating) {
    return (
      <LinearGradient
        colors={[palette.steelTeal, palette.dolphinGray]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroLoading}
      >
        <Text style={styles.loadingTitle}>Görsel hazırlanıyor...</Text>
        <Text style={styles.loadingSub}>Yapay zekâ gününüzü sahneye dönüştürüyor.</Text>
      </LinearGradient>
    );
  }

  return (
    <View style={styles.heroCard}>
      <ImageBackground
        source={heroSource}
        style={styles.imageBackground}
        imageStyle={styles.foregroundImage}
        resizeMode="cover"
      >
        <LinearGradient
          colors={[
            "rgba(255,255,255,0.30)",
            "rgba(18,16,14,0.12)",
            "rgba(0,0,0,0.0)",
            "rgba(30,24,18,0.22)",
          ]}
          locations={[0, 0.22, 0.56, 1]}
          style={StyleSheet.absoluteFill}
        />

        <View style={styles.cornerRow}>
          <TouchableOpacity
            style={styles.assistantBadge}
            activeOpacity={0.85}
            onPress={onPressAssistant}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="AI asistanina git"
          >
            <Sparkle size={14} color="#F8F6F2" weight="fill" />
            <Text style={styles.assistantText}>AI</Text>
          </TouchableOpacity>

          <View style={styles.rightGroup}>
            <TouchableOpacity
              style={styles.scoreBadge}
              activeOpacity={0.86}
              onPress={onPressScore}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Uretkenlik skor detaylarini ac"
            >
              <TrendUp size={11} color="#D8F8E4" weight="bold" />
              <Text style={styles.scoreValue}>{productivityScore}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  heroLoading: {
    width: "100%",
    height: 272,
    borderRadius: 32,
    overflow: "hidden",
    borderWidth: 8,
    borderColor: "#E6DED2",
    justifyContent: "flex-end",
    paddingHorizontal: 24,
    paddingBottom: 28,
  },
  loadingTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#FDF7EF",
    marginBottom: 4,
  },
  loadingSub: {
    fontSize: 13,
    color: "rgba(253,247,239,0.84)",
  },
  heroCard: {
    width: "100%",
    height: 272,
    borderRadius: 32,
    overflow: "hidden",
    borderWidth: 8,
    borderColor: "#E6DED2",
    ...shadow.soft,
  },
  imageBackground: {
    width: "100%",
    height: "100%",
  },
  foregroundImage: {
    width: "100%",
    height: "100%",
  },
  cornerRow: {
    position: "absolute",
    top: 14,
    left: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  rightGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  assistantBadge: {
    borderRadius: 999,
    backgroundColor: "rgba(20,18,16,0.26)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 10,
    height: 32,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },
  assistantText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#FAF6F0",
    letterSpacing: 0.2,
  },
  scoreBadge: {
    minWidth: 62,
    height: 32,
    borderRadius: 999,
    backgroundColor: "rgba(12,10,9,0.28)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },
  scoreValue: {
    fontSize: 13,
    lineHeight: 16,
    fontWeight: "700",
    color: "#F8F6F2",
    letterSpacing: 0.1,
  },
});
