import { router } from "expo-router";
import { useMemo } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn, FadeInDown, FadeInUp, ZoomIn } from "react-native-reanimated";
import { Check, X, TrendUp, Sparkle } from "phosphor-react-native";
import { font, semantic, spacing } from "@/src/ui/tokens";
import {
  onboardingCardHeadlineEnter,
  onboardingMotion,
} from "@/src/ui/motion";
import { OnboardingProgress } from "@/src/components/OnboardingProgress";
import { OnboardingFooter } from "@/src/components/OnboardingFooter";
import {
  OnboardingStaggeredParagraph,
  countStaggerSteps,
} from "@/src/components/OnboardingStaggeredText";
import { useOnboardingExit } from "@/src/hooks/useOnboardingExit";

const ROWS = [
  { with: "AI destekli planlama", without: "Manuel liste" },
  { with: "Görsel motivasyon", without: "Sıkıcı metin" },
  { with: "Kişisel hatırlatmalar", without: "Unutulan görevler" },
  { with: "İlerleme takibi", without: "Belirsizlik" },
];

const TABLE_SHADOW = Platform.select({
  ios: {
    shadowColor: "rgba(0, 0, 0, 0.12)",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 24,
  },
  android: {
    elevation: 12,
  },
}) as object;

const BADGE_HOLD_MS = 243;
const TITLE_ST = 20;
const SUB_ST = 21;
const HEADER_ST = 24;
const CELL_ST = 16;
const TABLE_SHELL_IN_MS = 271;
const ACCENT_LINE_TAIL_MS = 286;
const ROW_ICON_TO_TEXT_MS = 186;
const ROW_TEXT_GAP_MS = 39;
const ROW_TAIL_MS = 143;
const X_AFTER_RIGHT_TEXT_MS = 50;

export default function ComparisonScreen() {
  const { triggerExit, exitStyle } = useOnboardingExit();

  const handleContinue = () => {
    triggerExit("forward", () => router.push("/(onboarding)/style"));
  };

  const handleBack = () => {
    triggerExit("back", () => router.back());
  };

  const timing = useMemo(() => {
    let cursor = 50;
    const badgeAt = cursor;
    cursor += BADGE_HOLD_MS + 24;

    const titleT0 = cursor;
    const l1 = countStaggerSteps("Kullanıcıların %73'ü");
    const l2 = countStaggerSteps("görev yönetiminde");
    const l2Start = titleT0 + l1 * TITLE_ST;
    const l3Start = l2Start + l2 * TITLE_ST + 20;
    cursor = l3Start + ACCENT_LINE_TAIL_MS + 32;

    const subStart = cursor;
    const subSteps = countStaggerSteps("Doara ile fark nasıl değişiyor?");
    cursor += subSteps * SUB_ST + 140;

    const tableShell = cursor;
    cursor += TABLE_SHELL_IN_MS + 36;

    const tableHeader = cursor;
    const hdrLeft = tableHeader + 30;
    const hdrLeftSteps = countStaggerSteps("Doara ile");
    const hdrRight = hdrLeft + hdrLeftSteps * HEADER_ST + 70;
    const hdrRightSteps = countStaggerSteps("Olmadan");
    cursor = hdrRight + hdrRightSteps * HEADER_ST + 72;

    const rowShell: number[] = [];
    const rowCheckZoom: number[] = [];
    const rowLeftText: number[] = [];
    const rowRightText: number[] = [];
    const rowXZoom: number[] = [];

    ROWS.forEach((row) => {
      const shell = cursor;
      rowShell.push(shell);
      const checkT = shell + 90;
      rowCheckZoom.push(checkT);
      const leftT = checkT + ROW_ICON_TO_TEXT_MS;
      rowLeftText.push(leftT);
      const wSteps = countStaggerSteps(row.with);
      const leftEnd = leftT + wSteps * CELL_ST;
      const rightT = leftEnd + ROW_TEXT_GAP_MS;
      rowRightText.push(rightT);
      const woSteps = countStaggerSteps(row.without);
      const rightEnd = rightT + woSteps * CELL_ST;
      const xT = rightEnd + X_AFTER_RIGHT_TEXT_MS;
      rowXZoom.push(xT);
      cursor = xT + ROW_TAIL_MS;
    });

    const footerDelay = cursor + onboardingMotion.staggerBase;

    return {
      badgeAt,
      titleT0,
      l2Start,
      l3Start,
      subStart,
      titleSt: TITLE_ST,
      subSt: SUB_ST,
      tableShell,
      tableHeader,
      hdrLeft,
      hdrRight,
      headerSt: HEADER_ST,
      rowShell,
      rowCheckZoom,
      rowLeftText,
      rowRightText,
      rowXZoom,
      cellSt: CELL_ST,
      footerDelay,
    };
  }, []);

  return (
    <Animated.View style={[styles.container, exitStyle]}>
      <OnboardingProgress current={7} total={11} />

      <View style={styles.header}>
        <Animated.View
          entering={FadeInUp.delay(timing.badgeAt).duration(360).springify().damping(16).stiffness(128)}
          style={styles.statBadge}
        >
          <View style={styles.statIconWrap}>
            <TrendUp size={14} color="#FFFFFF" weight="bold" />
          </View>
          <Text style={styles.statBadgeText}>%73</Text>
        </Animated.View>

        <View style={styles.titleBlock}>
          <OnboardingStaggeredParagraph
            text="Kullanıcıların %73'ü"
            style={styles.title}
            startDelay={timing.titleT0}
            staggerMs={timing.titleSt}
            lineGap={0}
          />
          <OnboardingStaggeredParagraph
            text="görev yönetiminde"
            style={styles.title}
            startDelay={timing.l2Start}
            staggerMs={timing.titleSt}
            lineGap={0}
          />
          <Animated.View
            entering={onboardingCardHeadlineEnter(timing.l3Start)}
          >
            <Text style={StyleSheet.flatten([styles.title, styles.titleAccent])}>
              zorlanıyor
            </Text>
          </Animated.View>
        </View>
        <OnboardingStaggeredParagraph
          text="Doara ile fark nasıl değişiyor?"
          style={styles.sub}
          startDelay={timing.subStart}
          staggerMs={timing.subSt}
          containerStyle={styles.subWrap}
        />
      </View>

      <Animated.View
        entering={FadeInDown.delay(timing.tableShell)
          .duration(480)
          .springify()
          .damping(18)}
        style={[styles.tableOuter, TABLE_SHADOW]}
      >
        <View style={styles.table}>
          <Animated.View
            entering={FadeIn.delay(timing.tableHeader).duration(320)}
            style={styles.tableHeader}
          >
            <View style={styles.headerLeft}>
              <Sparkle size={12} color={semantic.success} weight="fill" />
              <OnboardingStaggeredParagraph
                text="Doara ile"
                style={styles.headerLabel}
                startDelay={timing.hdrLeft}
                staggerMs={timing.headerSt}
                lineGap={0}
              />
            </View>
            <View style={styles.headerRightWrap}>
              <OnboardingStaggeredParagraph
                text="Olmadan"
                style={StyleSheet.flatten([
                  styles.headerLabel,
                  styles.headerLabelRight,
                ])}
                startDelay={timing.hdrRight}
                staggerMs={timing.headerSt}
                lineGap={0}
                lineJustifyContent="flex-end"
              />
            </View>
          </Animated.View>

          {ROWS.map((row, i) => (
            <Animated.View
              key={i}
              entering={FadeIn.delay(timing.rowShell[i]).duration(340)}
              style={[
                styles.tableRow,
                i === ROWS.length - 1 && styles.tableRowLast,
              ]}
            >
              <View style={styles.cellLeft}>
                <Animated.View
                  entering={ZoomIn.delay(timing.rowCheckZoom[i]).duration(260)}
                  style={styles.checkCircle}
                >
                  <Check size={13} color="#FFFFFF" weight="bold" />
                </Animated.View>
                <OnboardingStaggeredParagraph
                  text={row.with}
                  style={styles.cellTextWithToken}
                  startDelay={timing.rowLeftText[i]}
                  staggerMs={timing.cellSt}
                  lineGap={0}
                  containerStyle={styles.cellStaggerWrap}
                />
              </View>
              <View style={styles.cellRight}>
                <View style={styles.cellWithoutTextWrap}>
                  <OnboardingStaggeredParagraph
                    text={row.without}
                    style={styles.cellTextWithoutToken}
                    startDelay={timing.rowRightText[i]}
                    staggerMs={timing.cellSt}
                    lineGap={0}
                    lineJustifyContent="flex-end"
                    containerStyle={styles.cellStaggerWrapEnd}
                  />
                </View>
                <Animated.View
                  entering={ZoomIn.delay(timing.rowXZoom[i]).duration(250)}
                  style={styles.xCircle}
                >
                  <X size={11} color="#FFFFFF" weight="bold" />
                </Animated.View>
              </View>
            </Animated.View>
          ))}
        </View>
      </Animated.View>

      <View style={styles.spacer} />

      <Animated.View
        entering={FadeIn.delay(timing.footerDelay).duration(360)}
        style={styles.bottom}
      >
        <OnboardingFooter onNext={handleContinue} onBack={handleBack} showBack />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F2F2F0",
    paddingHorizontal: spacing.xl,
    paddingTop: 74,
    paddingBottom: 50,
  },
  header: {
    marginBottom: 28,
  },
  titleBlock: {
    gap: 2,
  },
  subWrap: {
    marginTop: 8,
  },
  statBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 8,
    backgroundColor: "#E8F5EC",
    borderRadius: 20,
    paddingLeft: 5,
    paddingRight: 14,
    paddingVertical: 5,
    marginBottom: 16,
  },
  statIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: semantic.success,
    alignItems: "center",
    justifyContent: "center",
  },
  statBadgeText: {
    fontSize: 16,
    fontWeight: "800",
    fontFamily: font.extraBold,
    color: semantic.success,
  },
  title: {
    fontSize: 30,
    lineHeight: 38,
    fontWeight: "800",
    fontFamily: font.extraBold,
    color: semantic.textPrimary,
    letterSpacing: -0.6,
  },
  titleAccent: {
    color: semantic.accent,
  },
  sub: {
    fontSize: 15,
    fontFamily: font.regular,
    color: semantic.textSecondary,
    lineHeight: 21,
  },
  tableOuter: {
    borderRadius: 22,
  },
  table: {
    borderRadius: 22,
    backgroundColor: semantic.screenSurface,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    overflow: "hidden",
  },
  tableHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: "rgba(0,0,0,0.025)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.06)",
  },
  headerLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  headerLabel: {
    fontSize: 12,
    fontWeight: "700",
    fontFamily: font.bold,
    color: semantic.success,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  headerLabelRight: {
    textAlign: "right",
    color: semantic.danger,
  },
  headerRightWrap: {
    flex: 1,
    alignItems: "flex-end",
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(0,0,0,0.06)",
  },
  tableRowLast: {
    borderBottomWidth: 0,
  },
  cellLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  cellRight: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 10,
  },
  cellWithoutTextWrap: {
    flex: 1,
    minWidth: 0,
    alignItems: "flex-end",
  },
  checkCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: semantic.success,
    alignItems: "center",
    justifyContent: "center",
  },
  xCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(226, 81, 62, 0.85)",
    alignItems: "center",
    justifyContent: "center",
  },
  /** Kelime tokenlarına flex verme — layout çöküp metin görünmez oluyor. */
  cellStaggerWrap: {
    flex: 1,
    minWidth: 0,
  },
  cellStaggerWrapEnd: {
    flex: 1,
    minWidth: 0,
    alignItems: "flex-end",
  },
  cellTextWithToken: {
    fontSize: 15,
    fontWeight: "600",
    fontFamily: font.semiBold,
    color: semantic.textPrimary,
  },
  cellTextWithoutToken: {
    fontSize: 14,
    fontFamily: font.regular,
    color: "#AAAAAA",
    textAlign: "right",
  },
  spacer: {
    flex: 1,
  },
  bottom: {
    paddingTop: spacing.md,
  },
});
