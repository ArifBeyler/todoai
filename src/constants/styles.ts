export const VISUAL_STYLES = [
  { value: "3d", label: "Claymation", description: "Kil figürün olarak hayat bul" },
  { value: "lofi", label: "Lofi", description: "Pixel art dünyasında kendini bul" },
] as const;

export type VisualStyleValue = (typeof VISUAL_STYLES)[number]["value"];
