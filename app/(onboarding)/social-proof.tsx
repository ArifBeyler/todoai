import { router } from "expo-router";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { Star, Users } from "phosphor-react-native";
import { font, radius, semantic, shadow, spacing } from "@/src/ui/tokens";
import { preHomeMotion } from "@/src/ui/motion";
import { OnboardingStaggeredParagraph } from "@/src/components/OnboardingStaggeredText";
import { OnboardingProgress } from "@/src/components/OnboardingProgress";
import { OnboardingFooter } from "@/src/components/OnboardingFooter";
import { useOnboardingExit } from "@/src/hooks/useOnboardingExit";

type Review = {
  id: string;
  name: string;
  initials: string;
  rating: number;
  text: string;
};

const REVIEWS: Review[] = [
  {
    id: "1",
    name: "Elif Y.",
    initials: "EY",
    rating: 5,
    text: "Her sabah görselleri görmek için görevlerimi tamamlamak istiyorum. Alışkanlık oluşturmak hiç bu kadar eğlenceli olmamıştı!",
  },
  {
    id: "2",
    name: "Can K.",
    initials: "CK",
    rating: 5,
    text: "AI görselleri inanılmaz gerçekçi. Kendimi görevlerimi yaparken görmek çok motive edici.",
  },
  {
    id: "3",
    name: "Zeynep A.",
    initials: "ZA",
    rating: 5,
    text: "Basit ve zarif tasarım. Diğer yapılacaklar uygulamalarından tamamen farklı bir deneyim.",
  },
  {
    id: "4",
    name: "Mert T.",
    initials: "MT",
    rating: 5,
    text: "Dürüst olayım, ilk gün meraktan girdim. Şimdi görev bitirince gelen görselleri görmek için kendi kendime motive oluyorum.",
  },
  {
    id: "5",
    name: "Derya S.",
    initials: "DS",
    rating: 5,
    text: "Arayüz çok temiz, yormuyor. Küçük bir to-do uygulaması gibi başlayıp gün içinde gerçekten odak toparlayan bir asistana dönüştü.",
  },
];

const StarRating = ({
  count,
  compact = false,
}: {
  count: number;
  compact?: boolean;
}) => (
  <View style={[styles.starRow, compact && styles.starRowCompact]}>
    {Array.from({ length: count }, (_, i) => (
      <Star key={i} size={14} color="#F5A623" weight="fill" />
    ))}
  </View>
);

export default function SocialProofScreen() {
  const { triggerExit, exitStyle } = useOnboardingExit();

  const handleContinue = () => {
    triggerExit("forward", () => router.push("/(onboarding)/tinder-cards"));
  };

  const handleBack = () => {
    triggerExit("back", () => router.back());
  };

  return (
    <Animated.View style={[styles.container, exitStyle]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <OnboardingProgress current={4} total={11} />
        <View style={styles.header}>
          <Animated.View
            entering={FadeInUp.duration(286).springify().damping(16).stiffness(128)}
            style={styles.ratingBlock}
          >
            <Text style={styles.ratingNumber}>4.9</Text>
            <StarRating count={5} />
          </Animated.View>
          <OnboardingStaggeredParagraph
            text="Kullanıcılar ne diyor?"
            style={styles.title}
            startDelay={86}
            staggerMs={31}
            containerStyle={{ marginTop: 12 }}
          />
        </View>

        <Animated.View
          entering={preHomeMotion.sectionEnter(100)}
          style={[styles.statBanner, shadow.card]}
        >
          <Users size={22} color={semantic.heroStart} weight="fill" />
          <View style={styles.statCopyWrap}>
            <Text style={styles.statText}>
              <Text style={styles.statHighlight}>10.000+ </Text>
              kullanıcı deneyimi keşfediyor
            </Text>
          </View>
        </Animated.View>

        <View style={styles.reviewList}>
          {REVIEWS.map((review, index) => (
            <Animated.View
              key={review.id}
              entering={preHomeMotion.cardEnter(185 + index * 79)}
              style={[styles.reviewCard, shadow.card]}
            >
              <View style={styles.reviewHeader}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{review.initials}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.reviewName}>{review.name}</Text>
                  <StarRating count={review.rating} compact />
                </View>
              </View>
              <Text style={styles.reviewText}>{review.text}</Text>
            </Animated.View>
          ))}
        </View>
      </ScrollView>

      <Animated.View entering={preHomeMotion.ctaEnter(371)} style={styles.bottom}>
        <OnboardingFooter
          onNext={handleContinue}
          onBack={handleBack}
          showBack
        />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F2F2F0",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: 74,
    paddingBottom: 132,
  },
  header: {
    gap: spacing.sm,
  },
  ratingBlock: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  ratingNumber: {
    fontSize: 42,
    fontWeight: "700",
    fontFamily: font.bold,
    color: semantic.textPrimary,
    letterSpacing: -1,
  },
  starRow: {
    flexDirection: "row",
    gap: 2,
  },
  starRowCompact: {
    marginTop: 6,
  },
  title: {
    fontSize: 28,
    lineHeight: 32,
    fontWeight: "700",
    fontFamily: font.bold,
    color: semantic.textPrimary,
    letterSpacing: -0.5,
  },
  statBanner: {
    marginTop: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: semantic.screenSurface,
    padding: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  statCopyWrap: {
    flex: 1,
    minWidth: 0,
  },
  statText: {
    fontSize: 15,
    fontFamily: font.regular,
    color: semantic.textSecondary,
    lineHeight: 22,
    flexShrink: 1,
  },
  statHighlight: {
    fontWeight: "700",
    fontFamily: font.bold,
    color: semantic.textPrimary,
  },
  reviewList: {
    marginTop: spacing.lg,
    gap: spacing.sm,
    paddingBottom: spacing.sm,
  },
  reviewCard: {
    borderRadius: radius.lg,
    backgroundColor: semantic.screenSurface,
    padding: spacing.md,
    gap: spacing.sm,
  },
  reviewHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: semantic.heroStart,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: semantic.textOnDark,
    fontSize: 13,
    fontWeight: "700",
    fontFamily: font.bold,
  },
  reviewName: {
    fontSize: 14,
    fontWeight: "700",
    fontFamily: font.bold,
    color: semantic.textPrimary,
  },
  reviewText: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: font.regular,
    color: semantic.textSecondary,
  },
  bottom: {
    position: "absolute",
    left: spacing.xl,
    right: spacing.xl,
    bottom: 50,
  },
  button: {
    borderRadius: radius.lg,
    backgroundColor: semantic.heroStart,
    alignItems: "center",
    paddingVertical: 17,
  },
  buttonText: {
    color: semantic.textOnDark,
    fontSize: 16,
    fontWeight: "700",
    fontFamily: font.bold,
  },
});
