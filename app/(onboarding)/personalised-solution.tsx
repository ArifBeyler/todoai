import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import {
  Lightning,
  Palette,
  Target,
  Timer,
  Smiley,
  TrendUp,
  Users,
} from "phosphor-react-native";
import { useSessionStore } from "@state/useSessionStore";
import { font, radius, semantic, shadow, spacing } from "@/src/ui/tokens";
import { onboardingTyping } from "@/src/ui/motion";
import { OnboardingProgress } from "@/src/components/OnboardingProgress";
import { OnboardingFooter } from "@/src/components/OnboardingFooter";
import { SequentialTyping } from "@/src/components/SequentialTyping";
import { useOnboardingExit } from "@/src/hooks/useOnboardingExit";

type SolutionItem = {
  painKey: string;
  painLabel: string;
  solution: string;
  icon: React.ComponentType<any>;
};

const ALL_SOLUTIONS: SolutionItem[] = [
  {
    painKey: "procrastination",
    painLabel: "Erteleme",
    solution: "Yapay zekâ görevlerini küçük adımlara böler, başlaman kolaylaşır.",
    icon: Lightning,
  },
  {
    painKey: "focus",
    painLabel: "Odaklanma zorluğu",
    solution: "Günlük 3 öncelikli görev sistemi odağını korur.",
    icon: Target,
  },
  {
    painKey: "motivation",
    painLabel: "Motivasyon eksikliği",
    solution: "Her tamamlanan görev sanat eserine dönüşür, ilerlemeniz görselleşir.",
    icon: Palette,
  },
  {
    painKey: "time_management",
    painLabel: "Zaman yönetimi",
    solution: "Senin en verimli saatlerinde hatırlatma gönderir.",
    icon: Timer,
  },
  {
    painKey: "stress",
    painLabel: "Stres",
    solution: "Görsel ilerlemeniz motivasyonunuzu artırır, liste stresi azalır.",
    icon: Smiley,
  },
];

const DEFAULT_SOLUTIONS: SolutionItem[] = [
  ALL_SOLUTIONS[0],
  ALL_SOLUTIONS[2],
  ALL_SOLUTIONS[3],
];

const STAT_LABEL =
  "Kullanıcıların ilk haftada görev tamamlama oranını artırdı";

function StaticSolutionCard({ item }: { item: SolutionItem }) {
  const IconComponent = item.icon;
  return (
    <View style={[styles.solutionCard, shadow.card]}>
      <View style={styles.solutionIcon}>
        <IconComponent size={22} color={semantic.accent} weight="fill" />
      </View>
      <View style={styles.solutionTextBlock}>
        <Text style={styles.painLabel}>{item.painLabel}</Text>
        <Text style={styles.solutionText}>{item.solution}</Text>
      </View>
    </View>
  );
}

function TypingSolutionCard({
  item,
  onComplete,
}: {
  item: SolutionItem;
  onComplete: () => void;
}) {
  const IconComponent = item.icon;
  const lines = useMemo(
    () => [
      {
        text: item.painLabel,
        pauseBeforeMs: 57,
        pauseAfterMs: 171,
        style: styles.painLabel,
      },
      {
        text: item.solution,
        pauseBeforeMs: 0,
        pauseAfterMs: 0,
        style: styles.solutionText,
      },
    ],
    [item.painLabel, item.solution],
  );
  return (
    <View style={[styles.solutionCard, shadow.card]}>
      <View style={styles.solutionIcon}>
        <IconComponent size={22} color={semantic.accent} weight="fill" />
      </View>
      <View style={styles.solutionTextBlock}>
        <SequentialTyping
          lines={lines}
          charDelayMs={onboardingTyping.charDelayMs}
          showCursor={onboardingTyping.showCursor}
          onComplete={onComplete}
          containerStyle={styles.cardTypingWrap}
        />
      </View>
    </View>
  );
}

function StaticStatCard() {
  return (
    <View style={[styles.statCard, shadow.card]}>
      <View style={styles.statIconWrap}>
        <TrendUp size={22} color={semantic.accent} weight="bold" />
      </View>
      <View style={styles.statTextBlock}>
        <Text style={styles.statNumber}>%87</Text>
        <Text style={styles.statLabel}>{STAT_LABEL}</Text>
      </View>
    </View>
  );
}

function TypingStatCard({ onComplete }: { onComplete: () => void }) {
  const lines = useMemo(
    () => [
      {
        text: "%87",
        pauseBeforeMs: 43,
        pauseAfterMs: 186,
        style: styles.statNumber,
      },
      {
        text: STAT_LABEL,
        pauseBeforeMs: 0,
        pauseAfterMs: 0,
        style: styles.statLabel,
      },
    ],
    [],
  );
  return (
    <View style={[styles.statCard, shadow.card]}>
      <View style={styles.statIconWrap}>
        <TrendUp size={22} color={semantic.accent} weight="bold" />
      </View>
      <View style={styles.statTextBlock}>
        <SequentialTyping
          lines={lines}
          charDelayMs={onboardingTyping.charDelayMs}
          showCursor={onboardingTyping.showCursor}
          onComplete={onComplete}
          containerStyle={styles.statTypingWrap}
        />
      </View>
    </View>
  );
}

export default function PersonalisedSolutionScreen() {
  const challenges = useSessionStore((s) => s.challenges);
  const profileName = useSessionStore((s) => s.profileName);

  const relevantSolutions = useMemo(
    () =>
      challenges.length > 0
        ? ALL_SOLUTIONS.filter((s) => challenges.includes(s.painKey))
        : DEFAULT_SOLUTIONS,
    [challenges],
  );

  const listKey = useMemo(
    () => relevantSolutions.map((s) => s.painKey).join(","),
    [relevantSolutions],
  );

  const [phase, setPhase] = useState(0);

  useEffect(() => {
    setPhase(0);
  }, [listKey, profileName]);

  const { triggerExit, exitStyle } = useOnboardingExit();

  const handleContinue = () => {
    triggerExit("forward", () => router.push("/(onboarding)/comparison"));
  };

  const handleBack = () => {
    triggerExit("back", () => router.back());
  };

  const advance = useCallback(() => {
    setPhase((p) => p + 1);
  }, []);

  const subText = "Seçimlerine göre sana özel çözümler hazırladık.";

  const headerLines = useMemo(() => {
    const titleText = profileName
      ? `${profileName}, işte Doara'nın\nsana yardımı`
      : "İşte Doara'nın\nsana yardımı";
    return [
      {
        text: titleText,
        pauseBeforeMs: 86,
        pauseAfterMs: 214,
        style: styles.title,
      },
      {
        text: subText,
        pauseBeforeMs: 0,
        pauseAfterMs: 257,
        style: styles.sub,
      },
    ];
  }, [profileName]);

  const userRowLines = useMemo(
    () => [
      {
        text: "10.000+ kullanıcı Doara ile üretiyor",
        pauseBeforeMs: 57,
        pauseAfterMs: 0,
        style: styles.userCountText,
      },
    ],
    [],
  );

  const n = relevantSolutions.length;
  const statPhase = 1 + n;
  const userPhase = 2 + n;
  const footerPhase = 3 + n;

  return (
    <Animated.View style={[styles.container, exitStyle]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <OnboardingProgress current={6} total={11} />

        <View style={styles.header}>
          {phase >= 1 ? (
            <View>
              <Text style={styles.title}>
                {profileName
                  ? `${profileName}, işte Doara'nın\nsana yardımı`
                  : "İşte Doara'nın\nsana yardımı"}
              </Text>
              <Text style={[styles.sub, styles.subSpacing]}>{subText}</Text>
            </View>
          ) : (
            <SequentialTyping
              lines={headerLines}
              charDelayMs={onboardingTyping.charDelayMs}
              showCursor={onboardingTyping.showCursor}
              onComplete={advance}
            />
          )}
        </View>

        <View style={styles.solutionList}>
          {relevantSolutions.map((item, i) => {
            const cardPhase = 1 + i;
            if (phase < cardPhase) return null;
            if (phase > cardPhase) {
              return <StaticSolutionCard key={item.painKey} item={item} />;
            }
            return (
              <TypingSolutionCard
                key={item.painKey}
                item={item}
                onComplete={advance}
              />
            );
          })}
        </View>

        {phase >= statPhase ? (
          phase > statPhase ? (
            <StaticStatCard />
          ) : (
            <TypingStatCard onComplete={advance} />
          )
        ) : null}

        {phase >= userPhase ? (
          phase > userPhase ? (
            <View style={styles.userCountRow}>
              <Users size={16} color={semantic.heroStart} weight="fill" />
              <View style={styles.userCountTextWrap}>
                <Text style={styles.userCountText}>
                  <Text style={styles.userCountBold}>10.000+ </Text>
                  kullanıcı Doara ile üretiyor
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.userCountRow}>
              <Users size={16} color={semantic.heroStart} weight="fill" />
              <View style={styles.userCountTextWrap}>
                <SequentialTyping
                  lines={userRowLines}
                  charDelayMs={onboardingTyping.charDelayMs}
                  showCursor={onboardingTyping.showCursor}
                  onComplete={advance}
                />
              </View>
            </View>
          )
        ) : null}
      </ScrollView>

      {phase >= footerPhase ? (
        <Animated.View entering={FadeIn.duration(257)} style={styles.bottom}>
          <OnboardingFooter onNext={handleContinue} onBack={handleBack} showBack />
        </Animated.View>
      ) : null}
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
    paddingBottom: 140,
  },
  header: {
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: 28,
    lineHeight: 33,
    fontWeight: "700",
    fontFamily: font.bold,
    color: semantic.textPrimary,
    letterSpacing: -0.5,
  },
  sub: {
    fontSize: 15,
    fontFamily: font.regular,
    color: semantic.textSecondary,
    lineHeight: 21,
  },
  subSpacing: {
    marginTop: 6,
  },
  cardTypingWrap: {
    alignSelf: "stretch",
    gap: 6,
  },
  statTypingWrap: {
    alignSelf: "stretch",
    gap: 4,
  },
  solutionList: {
    gap: 12,
  },
  solutionCard: {
    flexDirection: "row",
    gap: 14,
    borderRadius: 20,
    backgroundColor: semantic.screenSurface,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.04)",
  },
  solutionIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: semantic.accentSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  solutionTextBlock: {
    flex: 1,
    gap: 4,
    minWidth: 0,
  },
  painLabel: {
    fontSize: 12,
    fontWeight: "600",
    fontFamily: font.semiBold,
    color: semantic.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  solutionText: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: "600",
    fontFamily: font.semiBold,
    color: semantic.textPrimary,
  },
  statCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginTop: spacing.xl,
    borderRadius: 20,
    backgroundColor: "#E8F5EC",
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(63, 154, 116, 0.15)",
  },
  statIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "rgba(63, 154, 116, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  statTextBlock: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: "800",
    fontFamily: font.extraBold,
    color: semantic.success,
    letterSpacing: -1,
  },
  statLabel: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: font.regular,
    color: semantic.textPrimary,
  },
  userCountTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  userCountRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: spacing.lg,
  },
  userCountText: {
    fontSize: 14,
    fontFamily: font.regular,
    color: semantic.textSecondary,
  },
  userCountBold: {
    fontWeight: "700",
    fontFamily: font.bold,
    color: semantic.textPrimary,
  },
  bottom: {
    position: "absolute",
    left: spacing.xl,
    right: spacing.xl,
    bottom: 50,
  },
});
