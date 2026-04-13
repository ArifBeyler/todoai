import { useEffect, useRef, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";

export type SequentialTypingLine = {
  text: string;
  pauseBeforeMs?: number;
  pauseAfterMs?: number;
  style: TextStyle;
};

type SequentialTypingProps = {
  lines: SequentialTypingLine[];
  charDelayMs?: number;
  showCursor?: boolean;
  onComplete?: () => void;
  /** Dış sarmalayıcı (ör. kartta ortalama, tam genişlik). */
  containerStyle?: StyleProp<ViewStyle>;
};

const delay = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });

export const SequentialTyping = ({
  lines,
  charDelayMs = 38,
  showCursor = true,
  onComplete,
  containerStyle,
}: SequentialTypingProps) => {
  const [lineIdx, setLineIdx] = useState(0);
  const [colIdx, setColIdx] = useState(0);
  const [cursorVisible, setCursorVisible] = useState(true);
  const doneRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const linesRef = useRef(lines);
  linesRef.current = lines;

  useEffect(() => {
    const blink = setInterval(() => setCursorVisible((v) => !v), 530);
    return () => clearInterval(blink);
  }, []);

  useEffect(() => {
    let cancelled = false;
    doneRef.current = false;
    const seq = linesRef.current;

    const run = async () => {
      for (let li = 0; li < seq.length; li += 1) {
        const line = seq[li];
        const pauseBefore = line.pauseBeforeMs ?? 0;
        const pauseAfter = line.pauseAfterMs ?? 0;
        const { text } = line;

        if (pauseBefore > 0) {
          await delay(pauseBefore);
        }
        if (cancelled) return;

        setLineIdx(li);
        setColIdx(0);

        for (let c = 1; c <= text.length; c += 1) {
          if (cancelled) return;
          await delay(charDelayMs);
          if (cancelled) return;
          setColIdx(c);
        }

        if (pauseAfter > 0) {
          await delay(pauseAfter);
        }
        if (cancelled) return;
      }

      if (!cancelled && !doneRef.current) {
        doneRef.current = true;
        onCompleteRef.current?.();
      }
    };

    if (seq.length === 0) {
      onCompleteRef.current?.();
      return;
    }

    run();

    return () => {
      cancelled = true;
    };
    // lines: güncel metin `linesRef` üzerinden okunur; parent `useMemo` ile sabit tutmalı
  }, [charDelayMs]);

  const cursorChar = showCursor ? (cursorVisible ? "|" : " ") : "";

  return (
    <View
      style={[styles.wrap, containerStyle]}
      accessibilityLiveRegion="polite"
    >
      {lines.map((line, i) => {
        const isPast = i < lineIdx;
        const isActive = i === lineIdx;
        const full = line.text;
        const visible = isPast ? full : isActive ? full.slice(0, colIdx) : "";
        const typing = isActive && colIdx < full.length;
        const showLineCursor = showCursor && isActive && typing;

        return (
          <Text key={`${i}-${line.text.slice(0, 12)}`} style={line.style}>
            {visible}
            {showLineCursor ? (
              <Text style={[line.style, styles.cursor]}>{cursorChar}</Text>
            ) : null}
          </Text>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    gap: 14,
    alignSelf: "stretch",
  },
  cursor: {
    opacity: 0.85,
  },
});
