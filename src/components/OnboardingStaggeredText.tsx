import type { ReactNode } from "react";
import { View, type StyleProp, type TextStyle, type ViewStyle } from "react-native";
import Animated from "react-native-reanimated";
import { onboardingWordEnter } from "@/src/ui/motion";

export const splitWordTokens = (line: string): string[] =>
  line.split(/(\s+)/).filter((s) => s.length > 0);

export const countStaggerSteps = (text: string): number => {
  let n = 0;
  for (const line of text.split("\n")) {
    n += splitWordTokens(line).length;
  }
  return n;
};

export type StaggerTextSegment = {
  text: string;
  style?: TextStyle;
};

type ParagraphProps = {
  text: string;
  style: TextStyle;
  startDelay?: number;
  staggerMs?: number;
  lineGap?: number;
  containerStyle?: StyleProp<ViewStyle>;
  /** Kelime satırlarını yatayda hizalar (ör. ortalı alıntı). */
  lineJustifyContent?: "flex-start" | "center" | "flex-end";
};

export const OnboardingStaggeredParagraph = ({
  text,
  style,
  startDelay = 0,
  staggerMs = 48,
  lineGap = 6,
  containerStyle,
  lineJustifyContent = "flex-start",
}: ParagraphProps) => {
  const lines = text.split("\n");
  let step = 0;

  return (
    <View style={[{ gap: lineGap }, containerStyle]}>
      {lines.map((line, li) => {
        const tokens = splitWordTokens(line);
        return (
          <View
            key={li}
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              alignItems: "baseline",
              justifyContent: lineJustifyContent,
            }}
          >
            {tokens.map((token, ti) => {
              const delay = startDelay + step * staggerMs;
              step += 1;
              return (
                <Animated.Text
                  key={`l${li}-t${ti}-${token}`}
                  entering={onboardingWordEnter(delay)}
                  style={style}
                >
                  {token}
                </Animated.Text>
              );
            })}
          </View>
        );
      })}
    </View>
  );
};

type SegmentsProps = {
  segments: StaggerTextSegment[];
  baseStyle: TextStyle;
  startDelay?: number;
  staggerMs?: number;
  rowStyle?: StyleProp<ViewStyle>;
};

export const OnboardingStaggeredSegments = ({
  segments,
  baseStyle,
  startDelay = 0,
  staggerMs = 48,
  rowStyle,
}: SegmentsProps) => {
  let step = 0;
  const nodes: ReactNode[] = [];

  segments.forEach((seg, si) => {
    splitWordTokens(seg.text).forEach((token, ti) => {
      const delay = startDelay + step * staggerMs;
      step += 1;
      nodes.push(
        <Animated.Text
          key={`s${si}-t${ti}-${token}`}
          entering={onboardingWordEnter(delay)}
          style={[baseStyle, seg.style]}
        >
          {token}
        </Animated.Text>,
      );
    });
  });

  return (
    <View
      style={[
        { flexDirection: "row", flexWrap: "wrap", alignItems: "baseline" },
        rowStyle,
      ]}
    >
      {nodes}
    </View>
  );
};
