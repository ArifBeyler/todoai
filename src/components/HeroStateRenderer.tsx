import {
  ActivityIndicator,
  ImageBackground,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  Camera,
  Lock,
  Sparkle,
  TrendUp,
} from "phosphor-react-native";
import type { HomeHeroVariant } from "@/src/hooks/useFTUE";
import type { VisualModel } from "@state/useTodoStore";
import { palette, semantic, shadow } from "@/src/ui/tokens";

type HeroStateRendererProps = {
  variant: HomeHeroVariant;
  visual: VisualModel | null;
  productivityScore: number;
  tasksUntilMilestone: number;
  onPressAssistant?: () => void;
  onPressScore?: () => void;
  onPressUploadPhoto?: () => void;
  onPressPremium?: () => void;
};

const fallbackHero = require("../../assets/images/hero-sample-full.png");

const TopCornerBadges = ({
  onPressAssistant,
  onPressScore,
  productivityScore,
}: {
  onPressAssistant?: () => void;
  onPressScore?: () => void;
  productivityScore: number;
}) => (
  <View style={styles.cornerRow}>
    <TouchableOpacity
      style={styles.assistantBadge}
      activeOpacity={0.85}
      onPress={onPressAssistant}
      hitSlop={10}
      accessibilityRole="button"
      accessibilityLabel="AI asistanına git"
    >
      <Sparkle size={14} color="#F8F6F2" weight="fill" />
      <Text style={styles.assistantText}>AI</Text>
    </TouchableOpacity>

    <TouchableOpacity
      style={styles.scoreBadge}
      activeOpacity={0.86}
      onPress={onPressScore}
      hitSlop={10}
      accessibilityRole="button"
      accessibilityLabel="Üretkenlik skor detaylarını aç"
    >
      <TrendUp size={11} color="#D8F8E4" weight="bold" />
      <Text style={styles.scoreValue}>{productivityScore}</Text>
    </TouchableOpacity>
  </View>
);

const PlaceholderHero = (
  props: Pick<
    HeroStateRendererProps,
    "onPressAssistant" | "onPressScore" | "productivityScore"
  >,
) => (
  <View style={styles.heroCard}>
    <ImageBackground
      source={fallbackHero}
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
      <TopCornerBadges {...props} />
    </ImageBackground>
  </View>
);

const PremiumTeaserHero = ({
  onPressPremium,
  ...badgeProps
}: Pick<
  HeroStateRendererProps,
  "onPressAssistant" | "onPressScore" | "productivityScore" | "onPressPremium"
>) => (
  <View style={styles.heroCard}>
    <ImageBackground
      source={fallbackHero}
      style={styles.imageBackground}
      imageStyle={[styles.foregroundImage, { opacity: 0.65 }]}
      resizeMode="cover"
    >
      <LinearGradient
        colors={[
          "rgba(255,255,255,0.30)",
          "rgba(18,16,14,0.22)",
          "rgba(0,0,0,0.0)",
          "rgba(30,24,18,0.35)",
        ]}
        locations={[0, 0.22, 0.56, 1]}
        style={StyleSheet.absoluteFill}
      />
      <TopCornerBadges {...badgeProps} />
      <View style={styles.overlayBottom}>
        <TouchableOpacity
          style={styles.premiumCTA}
          onPress={onPressPremium}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Kişiselleştirmek için premium'u aç"
        >
          <Lock size={14} color="#FFF" weight="fill" />
          <Text style={styles.premiumCTAText}>Bunu sana özel yap</Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  </View>
);

const UploadPromptHero = ({
  onPressUploadPhoto,
  ...badgeProps
}: Pick<
  HeroStateRendererProps,
  | "onPressAssistant"
  | "onPressScore"
  | "productivityScore"
  | "onPressUploadPhoto"
>) => (
  <View style={styles.heroCard}>
    <ImageBackground
      source={fallbackHero}
      style={styles.imageBackground}
      imageStyle={[styles.foregroundImage, { opacity: 0.5 }]}
      resizeMode="cover"
    >
      <LinearGradient
        colors={[
          "rgba(255,255,255,0.40)",
          "rgba(18,16,14,0.18)",
          "rgba(0,0,0,0.0)",
          "rgba(30,24,18,0.40)",
        ]}
        locations={[0, 0.22, 0.56, 1]}
        style={StyleSheet.absoluteFill}
      />
      <TopCornerBadges {...badgeProps} />
      <View style={styles.overlayBottom}>
        <TouchableOpacity
          style={styles.uploadCTA}
          onPress={onPressUploadPhoto}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Fotoğraf yükle"
        >
          <Camera size={16} color="#FFF" weight="fill" />
          <Text style={styles.uploadCTAText}>
            Fotoğrafını yükle, kişiselleştir
          </Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  </View>
);

const ProcessingHero = (
  props: Pick<
    HeroStateRendererProps,
    "onPressAssistant" | "onPressScore" | "productivityScore"
  >,
) => (
  <LinearGradient
    colors={[palette.steelTeal, palette.dolphinGray]}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 1 }}
    style={styles.heroLoading}
  >
    <TopCornerBadges {...props} />
    <View style={styles.loadingContent}>
      <ActivityIndicator color="#FDF7EF" size="small" />
      <Text style={styles.loadingTitle}>Görselin hazırlanıyor...</Text>
      <Text style={styles.loadingSub}>
        Yapay zekâ gününüzü sahneye dönüştürüyor.
      </Text>
    </View>
  </LinearGradient>
);

const PersonalizedHero = ({
  visual,
  ...badgeProps
}: Pick<
  HeroStateRendererProps,
  "visual" | "onPressAssistant" | "onPressScore" | "productivityScore"
>) => {
  const heroSource = visual?.imageUrl ? { uri: visual.imageUrl } : fallbackHero;

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
        <TopCornerBadges {...badgeProps} />
      </ImageBackground>
    </View>
  );
};

export const HeroStateRenderer = ({
  variant,
  visual,
  productivityScore,
  onPressAssistant,
  onPressScore,
  onPressUploadPhoto,
  onPressPremium,
}: HeroStateRendererProps) => {
  const badgeProps = { onPressAssistant, onPressScore, productivityScore };

  switch (variant) {
    case "premium_teaser":
      return (
        <PremiumTeaserHero {...badgeProps} onPressPremium={onPressPremium} />
      );
    case "upload_prompt":
      return (
        <UploadPromptHero
          {...badgeProps}
          onPressUploadPhoto={onPressUploadPhoto}
        />
      );
    case "processing":
    case "generation_pending":
      return <ProcessingHero {...badgeProps} />;
    case "personalized":
    case "generation_complete":
      return <PersonalizedHero visual={visual} {...badgeProps} />;
    case "placeholder":
    default:
      return <PlaceholderHero {...badgeProps} />;
  }
};

const styles = StyleSheet.create({
  heroCard: {
    width: "100%",
    height: 272,
    borderRadius: 32,
    overflow: "hidden",
    borderWidth: 8,
    borderColor: "#E6DED2",
    ...shadow.soft,
  },
  heroLoading: {
    width: "100%",
    height: 272,
    borderRadius: 32,
    overflow: "hidden",
    borderWidth: 8,
    borderColor: "#E6DED2",
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
  overlayBottom: {
    position: "absolute",
    bottom: 16,
    left: 14,
    right: 14,
    alignItems: "center",
  },
  premiumCTA: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 999,
    backgroundColor: "rgba(20,18,16,0.55)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  premiumCTAText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFF",
  },
  uploadCTA: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 999,
    backgroundColor: "rgba(20,18,16,0.55)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  uploadCTAText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFF",
  },
  loadingContent: {
    position: "absolute",
    bottom: 28,
    left: 24,
    right: 24,
    gap: 4,
  },
  loadingTitle: {
    marginTop: 8,
    fontSize: 20,
    fontWeight: "600",
    color: "#FDF7EF",
  },
  loadingSub: {
    fontSize: 13,
    color: "rgba(253,247,239,0.84)",
  },
});
