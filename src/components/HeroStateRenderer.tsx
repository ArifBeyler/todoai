import { useRef, useEffect, useState } from "react";
import {
  Animated as RNAnimated,
  ActivityIndicator,
  Image,
  ImageBackground,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  FadeIn,
  FadeInLeft,
  FadeInRight,
  FadeInUp,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import {
  Camera,
  Plus,
  Sparkle,
  Trophy,
  TrendUp,
} from "phosphor-react-native";
import type { HomeHeroVariant } from "@/src/hooks/useFTUE";
import type { VisualModel } from "@state/useTodoStore";
import { LockedRevealHero } from "@/src/components/LockedRevealHero";
import { palette, semantic, shadow } from "@/src/ui/tokens";
import { Clock, Crown, SealCheck } from "phosphor-react-native";

type HeroStateRendererProps = {
  variant: HomeHeroVariant;
  visual: VisualModel | null;
  heroImageUrl?: string | null;
  starterHeroImageUrl?: string | null;
  currentTodoTitle?: string | null;
  currentTodoVisualUrl?: string | null;
  productivityScore: number;
  tasksUntilMilestone: number;
  totalTodoCount?: number;
  onPressAssistant?: () => void;
  onPressScore?: () => void;
  onPressUploadPhoto?: () => void;
  onPressPremium?: () => void;
  revealBlurAmount?: number;
  revealProgressText?: string;
  revealProgress?: number;
  isFullyRevealed?: boolean;
  dailyHeroImageUrl?: string | null;
  onPressFullScreen?: () => void;
  minutesUntilStable?: number;
};

const fallbackHero = require("../../assets/images/hero-sample-full.png");

const PREMIUM_DEMO_IMAGES = [
  require("../../assets/images/demo-todo-sport.png"),
  require("../../assets/images/demo-todo-flower.png"),
  require("../../assets/images/demo-todo-dino.png"),
];

const AnimatedScoreBadge = ({
  score,
  onPress,
}: {
  score: number;
  onPress?: () => void;
}) => {
  const prevScore = useRef(score);
  const badgeScale = useRef(new RNAnimated.Value(1)).current;
  const glowOpacity = useRef(new RNAnimated.Value(0)).current;
  const plusOpacity = useRef(new RNAnimated.Value(0)).current;
  const plusTranslateY = useRef(new RNAnimated.Value(0)).current;
  const [delta, setDelta] = useState(0);

  useEffect(() => {
    const prev = prevScore.current;
    prevScore.current = score;

    if (score <= prev || prev === 0) return;

    const diff = score - prev;
    setDelta(diff);

    badgeScale.setValue(1);
    glowOpacity.setValue(0);
    plusOpacity.setValue(1);
    plusTranslateY.setValue(0);

    RNAnimated.sequence([
      RNAnimated.spring(badgeScale, {
        toValue: 1.22,
        friction: 5,
        tension: 320,
        useNativeDriver: true,
      }),
      RNAnimated.spring(badgeScale, {
        toValue: 1,
        friction: 4,
        tension: 180,
        useNativeDriver: true,
      }),
    ]).start();

    RNAnimated.sequence([
      RNAnimated.timing(glowOpacity, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
      RNAnimated.timing(glowOpacity, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    RNAnimated.parallel([
      RNAnimated.timing(plusOpacity, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }),
      RNAnimated.timing(plusTranslateY, {
        toValue: -28,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start(() => setDelta(0));
  }, [score, badgeScale, glowOpacity, plusOpacity, plusTranslateY]);

  return (
    <View style={styles.scoreContainer}>
      {delta > 0 && (
        <RNAnimated.Text
          style={[
            styles.plusIndicator,
            {
              opacity: plusOpacity,
              transform: [{ translateY: plusTranslateY }],
            },
          ]}
        >
          +{delta}
        </RNAnimated.Text>
      )}

      <RNAnimated.View style={{ transform: [{ scale: badgeScale }] }}>
        <TouchableOpacity
          style={styles.scoreBadge}
          activeOpacity={0.86}
          onPress={onPress}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Üretkenlik skor detaylarını aç"
        >
          <RNAnimated.View
            style={[styles.scoreGlow, { opacity: glowOpacity }]}
          />
          <TrendUp size={11} color="#D8F8E4" weight="bold" />
          <Text style={styles.scoreValue}>{score}</Text>
        </TouchableOpacity>
      </RNAnimated.View>
    </View>
  );
};

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
    <Animated.View entering={FadeInLeft.delay(500).duration(450).damping(16)}>
      <TouchableOpacity
        style={styles.assistantBadge}
        activeOpacity={0.85}
        onPress={onPressAssistant}
        hitSlop={10}
        accessibilityRole="button"
        accessibilityLabel="AI asistanına git"
      >
        <Animated.View entering={FadeIn.delay(700).duration(300)}>
          <Sparkle size={14} color="#F8F6F2" weight="fill" />
        </Animated.View>
        <Animated.View entering={FadeIn.delay(800).duration(300)}>
          <Text style={styles.assistantText}>AI</Text>
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>

    <Animated.View entering={FadeInRight.delay(550).duration(450).damping(16)}>
      <AnimatedScoreBadge score={productivityScore} onPress={onPressScore} />
    </Animated.View>
  </View>
);

const EmptyHero = () => (
  <View style={[styles.heroCard, styles.emptyHeroCard]}>
    <View style={styles.emptyContent}>
      <View style={styles.emptyIconWrap}>
        <Plus size={28} color={semantic.textSecondary} weight="bold" />
      </View>
      <Text style={styles.emptyTitle}>Görev ekle, görselin oluşsun</Text>
      <Text style={styles.emptySub}>
        En az 3 görev eklediğinde karakterin canlanacak.
      </Text>
    </View>
  </View>
);

const NeedMoreTodosHero = ({
  tasksUntilMilestone,
  ...badgeProps
}: Pick<
  HeroStateRendererProps,
  | "tasksUntilMilestone"
  | "onPressAssistant"
  | "onPressScore"
  | "productivityScore"
>) => (
  <View style={styles.heroCard}>
    <ImageBackground
      source={fallbackHero}
      style={styles.imageBackground}
      imageStyle={styles.foregroundImage}
      resizeMode="cover"
    >
      <LinearGradient
        colors={[
          "rgba(0,0,0,0.18)",
          "rgba(0,0,0,0.0)",
          "rgba(0,0,0,0.0)",
          "rgba(0,0,0,0.45)",
        ]}
        locations={[0, 0.18, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />
      <TopCornerBadges {...badgeProps} />
      <Animated.View
        entering={FadeInUp.delay(650).duration(450).damping(16)}
        style={styles.overlayBottom}
      >
        <View style={styles.pillCTA}>
          <Text style={styles.pillCTAText}>
            {tasksUntilMilestone} görev daha ekle, görsellerin üretilsin
          </Text>
        </View>
      </Animated.View>
    </ImageBackground>
  </View>
);

const TodoVisualHero = ({
  currentTodoTitle,
  currentTodoVisualUrl,
  fallbackVisualUrl,
  ...badgeProps
}: Pick<
  HeroStateRendererProps,
  | "currentTodoTitle"
  | "currentTodoVisualUrl"
  | "onPressAssistant"
  | "onPressScore"
  | "productivityScore"
> & { fallbackVisualUrl?: string | null }) => {
  const resolvedVisualUrl = currentTodoVisualUrl ?? fallbackVisualUrl ?? null;
  const heroSource = resolvedVisualUrl ? { uri: resolvedVisualUrl } : fallbackHero;

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
            "rgba(0,0,0,0.12)",
            "rgba(0,0,0,0.0)",
            "rgba(0,0,0,0.0)",
            "rgba(0,0,0,0.42)",
          ]}
          locations={[0, 0.15, 0.55, 1]}
          style={StyleSheet.absoluteFill}
        />
        <TopCornerBadges {...badgeProps} />
        {currentTodoTitle ? (
          <Animated.View
            entering={FadeInUp.delay(400).duration(400).damping(16)}
            style={styles.overlayBottom}
          >
            <View style={styles.todoPill}>
              <Sparkle size={12} color="#FFF" weight="fill" />
              <Text style={styles.todoPillText} numberOfLines={1}>
                {currentTodoTitle}
              </Text>
            </View>
          </Animated.View>
        ) : null}
      </ImageBackground>
    </View>
  );
};

const TodoGeneratingHero = ({
  currentTodoTitle,
  ...badgeProps
}: Pick<
  HeroStateRendererProps,
  | "currentTodoTitle"
  | "onPressAssistant"
  | "onPressScore"
  | "productivityScore"
>) => (
  <LinearGradient
    colors={[palette.steelTeal, palette.dolphinGray]}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 1 }}
    style={styles.heroLoading}
  >
    <TopCornerBadges {...badgeProps} />
    <View style={styles.loadingContent}>
      <ActivityIndicator color="#FDF7EF" size="small" />
      <Text style={styles.loadingTitle}>Görselin hazırlanıyor...</Text>
      <Text style={styles.loadingSub} numberOfLines={1}>
        {currentTodoTitle
          ? `"${currentTodoTitle}" için karakter oluşturuluyor.`
          : "Yapay zekâ karakterini oluşturuyor."}
      </Text>
    </View>
  </LinearGradient>
);

const AllDoneHero = (
  props: Pick<
    HeroStateRendererProps,
    "onPressAssistant" | "onPressScore" | "productivityScore"
  >,
) => (
  <View style={[styles.heroCard, styles.allDoneCard]}>
    <TopCornerBadges {...props} />
    <View style={styles.allDoneContent}>
      <Trophy size={36} color="#111111" weight="fill" />
      <Text style={styles.allDoneTitle}>Tebrikler!</Text>
      <Text style={styles.allDoneSub}>
        Tüm görevlerini tamamladın. Yeni görev ekle!
      </Text>
    </View>
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
          "rgba(0,0,0,0.18)",
          "rgba(0,0,0,0.0)",
          "rgba(0,0,0,0.0)",
          "rgba(0,0,0,0.10)",
        ]}
        locations={[0, 0.18, 0.7, 1]}
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
>) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [nextIndex, setNextIndex] = useState(1);
  const fadeAnim = useRef(new RNAnimated.Value(1)).current;

  useEffect(() => {
    const interval = setInterval(() => {
      const upcoming = (currentIndex + 1) % PREMIUM_DEMO_IMAGES.length;
      setNextIndex(upcoming);

      RNAnimated.timing(fadeAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => {
        setCurrentIndex(upcoming);
        RNAnimated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }).start();
      });
    }, 3200);

    return () => clearInterval(interval);
  }, [currentIndex, fadeAnim]);

  return (
    <View style={styles.heroCard}>
      {/* Background layer: next image (visible during fade) */}
      <Image
        source={PREMIUM_DEMO_IMAGES[nextIndex]}
        style={[styles.imageBackground, styles.foregroundImage, styles.absoluteImage]}
        resizeMode="cover"
      />
      {/* Foreground layer: current image fading out */}
      <RNAnimated.Image
        source={PREMIUM_DEMO_IMAGES[currentIndex]}
        style={[styles.imageBackground, styles.foregroundImage, styles.absoluteImage, { opacity: fadeAnim }]}
        resizeMode="cover"
      />

      {/* Subtle blur — keeps image visible while hinting at premium */}
      <BlurView
        intensity={14}
        tint="dark"
        style={[StyleSheet.absoluteFill, styles.premiumBlurOverlay]}
      />

      <LinearGradient
        colors={[
          "rgba(0,0,0,0.08)",
          "rgba(0,0,0,0.0)",
          "rgba(0,0,0,0.15)",
          "rgba(0,0,0,0.62)",
        ]}
        locations={[0, 0.25, 0.55, 1]}
        style={StyleSheet.absoluteFill}
      />

      <TopCornerBadges {...badgeProps} />

      <Animated.View
        entering={FadeInUp.delay(650).duration(450).damping(16)}
        style={styles.premiumOverlayBottom}
      >
        <View style={styles.premiumTeaserContent}>
          <View style={styles.premiumTeaserLabel}>
            <Sparkle size={11} color="rgba(255,255,255,0.7)" weight="fill" />
            <Text style={styles.premiumTeaserLabelText}>Premium</Text>
          </View>
          <Text style={styles.premiumTeaserTitle}>
            Sana özel görseller
          </Text>
          <Text style={styles.premiumTeaserSubtitle}>
            Yapay zekâ hedeflerini görselleştirsin
          </Text>
          <TouchableOpacity
            style={styles.premiumCTA}
            onPress={onPressPremium}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Kişiselleştirmek için premium'u aç"
          >
            <Text style={styles.premiumCTAText}>Kilidi Aç</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
};

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
      imageStyle={styles.foregroundImage}
      resizeMode="cover"
    >
      <LinearGradient
        colors={[
          "rgba(0,0,0,0.18)",
          "rgba(0,0,0,0.0)",
          "rgba(0,0,0,0.0)",
          "rgba(0,0,0,0.38)",
        ]}
        locations={[0, 0.18, 0.55, 1]}
        style={StyleSheet.absoluteFill}
      />
      <TopCornerBadges {...badgeProps} />
      <Animated.View
        entering={FadeInUp.delay(650).duration(450).damping(16)}
        style={styles.overlayBottom}
      >
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
      </Animated.View>
    </ImageBackground>
  </View>
);

const StarterHeroCard = ({
  starterHeroImageUrl,
  tasksUntilMilestone,
  totalTodoCount,
  ...badgeProps
}: Pick<
  HeroStateRendererProps,
  | "starterHeroImageUrl"
  | "tasksUntilMilestone"
  | "totalTodoCount"
  | "onPressAssistant"
  | "onPressScore"
  | "productivityScore"
>) => {
  const heroSource = starterHeroImageUrl
    ? { uri: starterHeroImageUrl }
    : fallbackHero;

  const pillText =
    (totalTodoCount ?? 0) === 0
      ? "Görev ekle, günlük görselin üretilsin"
      : `${tasksUntilMilestone} görev daha ekle, görselin canlanacak`;

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
            "rgba(0,0,0,0.10)",
            "rgba(0,0,0,0.0)",
            "rgba(0,0,0,0.0)",
            "rgba(0,0,0,0.40)",
          ]}
          locations={[0, 0.15, 0.55, 1]}
          style={StyleSheet.absoluteFill}
        />
        <TopCornerBadges {...badgeProps} />
        {(totalTodoCount ?? 0) < 3 && (
          <Animated.View
            entering={FadeInUp.delay(650).duration(450).damping(16)}
            style={styles.overlayBottom}
          >
            <View style={styles.pillCTA}>
              <Sparkle size={12} color="#FFF" weight="fill" />
              <Text style={styles.pillCTAText}>{pillText}</Text>
            </View>
          </Animated.View>
        )}
      </ImageBackground>
    </View>
  );
};

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

// --- New AI state hero cards ---

const WaitingForStabilityHero = ({
  minutesUntilStable,
  ...badgeProps
}: Pick<
  HeroStateRendererProps,
  "onPressAssistant" | "onPressScore" | "productivityScore" | "minutesUntilStable"
>) => (
  <View style={styles.heroCard}>
    <ImageBackground
      source={fallbackHero}
      style={styles.imageBackground}
      imageStyle={styles.foregroundImage}
      resizeMode="cover"
    >
      <LinearGradient
        colors={["rgba(0,0,0,0.18)", "rgba(0,0,0,0.0)", "rgba(0,0,0,0.0)", "rgba(0,0,0,0.50)"]}
        locations={[0, 0.18, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />
      <TopCornerBadges {...badgeProps} />
      <Animated.View
        entering={FadeInUp.delay(650).duration(450).damping(16)}
        style={styles.overlayBottom}
      >
        <View style={styles.pillCTA}>
          <Clock size={13} color="#FFF" weight="fill" />
          <Text style={styles.pillCTAText}>
            {minutesUntilStable && minutesUntilStable > 60
              ? `Görevlerin sabitleniyor — ${Math.ceil(minutesUntilStable / 60)} sa. sonra`
              : "Görevlerin sabitleniyor. Bir süre sonra değerlendireceğiz."}
          </Text>
        </View>
      </Animated.View>
    </ImageBackground>
  </View>
);

const EligiblePaywallLockedHero = ({
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
      imageStyle={styles.foregroundImage}
      resizeMode="cover"
    >
      <LinearGradient
        colors={["rgba(0,0,0,0.08)", "rgba(0,0,0,0.0)", "rgba(0,0,0,0.15)", "rgba(0,0,0,0.62)"]}
        locations={[0, 0.25, 0.55, 1]}
        style={StyleSheet.absoluteFill}
      />
      <TopCornerBadges {...badgeProps} />
      <Animated.View
        entering={FadeInUp.delay(650).duration(450).damping(16)}
        style={styles.premiumOverlayBottom}
      >
        <View style={styles.premiumTeaserContent}>
          <View style={styles.premiumTeaserLabel}>
            <Sparkle size={11} color="rgba(255,255,255,0.7)" weight="fill" />
            <Text style={styles.premiumTeaserLabelText}>Premium</Text>
          </View>
          <Text style={styles.premiumTeaserTitle}>Kişisel AI görselleri</Text>
          <Text style={styles.premiumTeaserSubtitle}>
            Görevlerin hazır — görsellerin açılsın.
          </Text>
          <TouchableOpacity
            style={styles.premiumCTA}
            onPress={onPressPremium}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Premium'a geç"
          >
            <Crown size={13} color="#FFF" weight="fill" />
            <Text style={[styles.premiumCTAText, { marginLeft: 6 }]}>Premium'a Geç</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </ImageBackground>
  </View>
);

const EligibleNeedsProfileHero = ({
  onPressUploadPhoto,
  ...badgeProps
}: Pick<
  HeroStateRendererProps,
  "onPressAssistant" | "onPressScore" | "productivityScore" | "onPressUploadPhoto"
>) => (
  <View style={styles.heroCard}>
    <ImageBackground
      source={fallbackHero}
      style={styles.imageBackground}
      imageStyle={styles.foregroundImage}
      resizeMode="cover"
    >
      <LinearGradient
        colors={["rgba(0,0,0,0.18)", "rgba(0,0,0,0.0)", "rgba(0,0,0,0.0)", "rgba(0,0,0,0.48)"]}
        locations={[0, 0.18, 0.55, 1]}
        style={StyleSheet.absoluteFill}
      />
      <TopCornerBadges {...badgeProps} />
      <Animated.View
        entering={FadeInUp.delay(650).duration(450).damping(16)}
        style={styles.overlayBottom}
      >
        <TouchableOpacity
          style={styles.uploadCTA}
          onPress={onPressUploadPhoto}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="İlk görsel için fotoğraf ekle"
        >
          <Camera size={14} color="#FFF" weight="fill" />
          <Text style={styles.uploadCTAText}>İlk görselini açmak için fotoğrafını ekle</Text>
        </TouchableOpacity>
      </Animated.View>
    </ImageBackground>
  </View>
);

const DailyVisualQueuedHero = (
  props: Pick<HeroStateRendererProps, "onPressAssistant" | "onPressScore" | "productivityScore">,
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
      <Text style={styles.loadingTitle}>Günlük görsel sırada</Text>
      <Text style={styles.loadingSub}>Oluşturma başlamak üzere.</Text>
    </View>
  </LinearGradient>
);

const DailyVisualGeneratingHero = (
  props: Pick<HeroStateRendererProps, "onPressAssistant" | "onPressScore" | "productivityScore">,
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
      <Text style={styles.loadingTitle}>Bugünün görseli hazırlanıyor</Text>
      <Text style={styles.loadingSub}>Yapay zekâ çalışıyor.</Text>
    </View>
  </LinearGradient>
);

const DailyVisualReadyHero = ({
  heroImageUrl,
  onPressFullScreen,
  ...badgeProps
}: Pick<
  HeroStateRendererProps,
  "onPressAssistant" | "onPressScore" | "productivityScore" | "heroImageUrl" | "onPressFullScreen"
>) => {
  const heroSource = heroImageUrl ? { uri: heroImageUrl } : fallbackHero;
  return (
    <View style={styles.heroCard}>
      <ImageBackground
        source={heroSource}
        style={styles.imageBackground}
        imageStyle={styles.foregroundImage}
        resizeMode="cover"
      >
        <LinearGradient
          colors={["rgba(0,0,0,0.12)", "rgba(0,0,0,0.0)", "rgba(0,0,0,0.0)", "rgba(0,0,0,0.42)"]}
          locations={[0, 0.15, 0.55, 1]}
          style={StyleSheet.absoluteFill}
        />
        <TopCornerBadges {...badgeProps} />
        <Animated.View
          entering={FadeInUp.delay(400).duration(400).damping(16)}
          style={styles.overlayBottom}
        >
          <TouchableOpacity
            style={styles.pillCTA}
            onPress={onPressFullScreen}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Günün görselini aç"
          >
            <SealCheck size={13} color="#FFF" weight="fill" />
            <Text style={styles.pillCTAText}>Günün görseli hazır</Text>
          </TouchableOpacity>
        </Animated.View>
      </ImageBackground>
    </View>
  );
};

const DailyVisualFailedHero = ({
  onPressRetry,
  ...badgeProps
}: Pick<
  HeroStateRendererProps,
  "onPressAssistant" | "onPressScore" | "productivityScore"
> & { onPressRetry?: () => void }) => (
  <View style={[styles.heroCard, styles.allDoneCard]}>
    <TopCornerBadges {...badgeProps} />
    <View style={styles.allDoneContent}>
      <Text style={[styles.allDoneTitle, { fontSize: 18 }]}>Görsel oluşturulamadı</Text>
      <Text style={styles.allDoneSub}>
        Bir şeyler ters gitti. Görevlerin değişmiş olabilir.
      </Text>
      {onPressRetry && (
        <TouchableOpacity
          style={styles.retryButton}
          onPress={onPressRetry}
          activeOpacity={0.82}
          accessibilityRole="button"
          accessibilityLabel="Tekrar dene"
        >
          <Text style={styles.retryButtonText}>Tekrar Dene</Text>
        </TouchableOpacity>
      )}
    </View>
  </View>
);

const ProfileGeneratingHero = (
  props: Pick<HeroStateRendererProps, "onPressAssistant" | "onPressScore" | "productivityScore">,
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
      <Text style={styles.loadingTitle}>Profilin hazırlanıyor</Text>
      <Text style={styles.loadingSub}>Yapay zekâ stilini oluşturuyor.</Text>
    </View>
  </LinearGradient>
);

// --- End new AI state hero cards ---

export const HeroStateRenderer = ({
  variant,
  visual,
  heroImageUrl,
  starterHeroImageUrl,
  currentTodoTitle,
  currentTodoVisualUrl,
  productivityScore,
  tasksUntilMilestone,
  totalTodoCount,
  onPressAssistant,
  onPressScore,
  onPressUploadPhoto,
  onPressPremium,
  revealBlurAmount,
  revealProgressText,
  revealProgress,
  isFullyRevealed,
  dailyHeroImageUrl,
  onPressFullScreen,
  minutesUntilStable,
}: HeroStateRendererProps) => {
  const badgeProps = { onPressAssistant, onPressScore, productivityScore };
  const fallbackVisualUrl = heroImageUrl ?? visual?.imageUrl ?? null;

  switch (variant) {
    case "locked_reveal":
    case "fully_revealed":
      return (
        <LockedRevealHero
          imageUrl={dailyHeroImageUrl ?? null}
          blurAmount={revealBlurAmount ?? 25}
          progressText={revealProgressText ?? "0/0"}
          revealProgress={revealProgress ?? 0}
          isFullyRevealed={isFullyRevealed ?? false}
          onPressFullScreen={onPressFullScreen}
        />
      );
    case "starter_hero":
      return (
        <StarterHeroCard
          {...badgeProps}
          starterHeroImageUrl={starterHeroImageUrl}
          tasksUntilMilestone={tasksUntilMilestone}
          totalTodoCount={totalTodoCount}
        />
      );
    case "empty":
      return <EmptyHero />;
    case "need_more_todos":
      return (
        <NeedMoreTodosHero
          {...badgeProps}
          tasksUntilMilestone={tasksUntilMilestone}
        />
      );
    case "waiting_for_stability":
      return (
        <WaitingForStabilityHero {...badgeProps} minutesUntilStable={minutesUntilStable} />
      );
    case "eligible_paywall_locked":
      return (
        <EligiblePaywallLockedHero {...badgeProps} onPressPremium={onPressPremium} />
      );
    case "eligible_needs_profile":
      return (
        <EligibleNeedsProfileHero {...badgeProps} onPressUploadPhoto={onPressUploadPhoto} />
      );
    case "profile_generating":
      return <ProfileGeneratingHero {...badgeProps} />;
    case "daily_visual_queued":
      return <DailyVisualQueuedHero {...badgeProps} />;
    case "daily_visual_generating":
      return <DailyVisualGeneratingHero {...badgeProps} />;
    case "daily_visual_ready":
      return (
        <DailyVisualReadyHero
          {...badgeProps}
          heroImageUrl={heroImageUrl ?? fallbackVisualUrl}
          onPressFullScreen={onPressFullScreen}
        />
      );
    case "daily_visual_failed":
      return (
        <DailyVisualFailedHero
          {...badgeProps}
          onPressRetry={onPressFullScreen}
        />
      );
    case "todo_visual":
      return (
        <TodoVisualHero
          {...badgeProps}
          currentTodoTitle={currentTodoTitle}
          currentTodoVisualUrl={currentTodoVisualUrl}
          fallbackVisualUrl={fallbackVisualUrl}
        />
      );
    case "todo_generating":
      return (
        <TodoGeneratingHero {...badgeProps} currentTodoTitle={currentTodoTitle} />
      );
    case "all_done":
      return <AllDoneHero {...badgeProps} />;
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
      return <ProcessingHero {...badgeProps} />;
    case "placeholder":
    default:
      return <PlaceholderHero {...badgeProps} />;
  }
};

const styles = StyleSheet.create({
  heroCard: {
    width: "100%",
    height: 284,
    borderRadius: 28,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.07)",
    ...shadow.soft,
    // Keep elevation below the white panel (taskPanel uses elevation: 12)
    elevation: 4,
  },
  emptyHeroCard: {
    backgroundColor: "#EBEBEA",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContent: {
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 32,
  },
  emptyIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#E8E6E2",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: semantic.textPrimary,
    textAlign: "center",
  },
  emptySub: {
    fontSize: 13,
    color: semantic.textSecondary,
    textAlign: "center",
    lineHeight: 18,
  },
  allDoneCard: {
    backgroundColor: "#F8F7F5",
    justifyContent: "center",
    alignItems: "center",
  },
  allDoneContent: {
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 32,
  },
  allDoneTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111111",
    marginTop: 4,
  },
  allDoneSub: {
    fontSize: 13,
    color: semantic.textSecondary,
    textAlign: "center",
    lineHeight: 18,
  },
  heroLoading: {
    width: "100%",
    height: 284,
    borderRadius: 28,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.07)",
    elevation: 4,
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
  scoreContainer: {
    alignItems: "center",
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
    overflow: "hidden",
  },
  scoreGlow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(216,248,228,0.25)",
    borderRadius: 999,
  },
  scoreValue: {
    fontSize: 13,
    lineHeight: 16,
    fontWeight: "700",
    color: "#F8F6F2",
    letterSpacing: 0.1,
  },
  plusIndicator: {
    position: "absolute",
    top: -6,
    alignSelf: "center",
    fontSize: 13,
    fontWeight: "800",
    color: "#D8F8E4",
    textShadowColor: "rgba(0,0,0,0.4)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
    zIndex: 10,
  },
  overlayBottom: {
    position: "absolute",
    bottom: 16,
    left: 14,
    right: 14,
    alignItems: "center",
  },
  // Premium teaser needs more bottom clearance so the CTA button
  // sits fully above the white panel's 52px overlap zone
  premiumOverlayBottom: {
    position: "absolute",
    bottom: 72,
    left: 14,
    right: 14,
    alignItems: "flex-start",
  },
  pillCTA: {
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
  pillCTAText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFF",
  },
  todoPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 999,
    backgroundColor: "rgba(20,18,16,0.55)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    paddingHorizontal: 16,
    paddingVertical: 9,
    maxWidth: "90%",
  },
  todoPillText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFF",
    flexShrink: 1,
  },
  absoluteImage: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  premiumBlurOverlay: {
    borderRadius: 28,
    overflow: "hidden",
  },
  premiumTeaserContent: {
    gap: 6,
    alignItems: "flex-start",
  },
  premiumTeaserLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.14)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 4,
  },
  premiumTeaserLabelText: {
    fontSize: 11,
    fontWeight: "600",
    color: "rgba(255,255,255,0.82)",
    letterSpacing: 0.4,
  },
  premiumTeaserTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#FFF",
    lineHeight: 26,
    letterSpacing: -0.3,
  },
  premiumTeaserSubtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.68)",
    fontWeight: "400",
    lineHeight: 18,
    marginBottom: 12,
  },
  premiumCTA: {
    alignSelf: "flex-start",
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.18)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.32)",
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  premiumCTAText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFF",
    letterSpacing: 0.1,
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
  retryButton: {
    marginTop: 12,
    borderRadius: 999,
    backgroundColor: "#111111",
    paddingHorizontal: 22,
    paddingVertical: 10,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFF",
  },
});
