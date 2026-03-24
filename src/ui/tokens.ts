export const palette = {
  white: "#FFFFFF",
  offWhite: "#F8F7F5",
  lightGray: "#F2F1EF",
  midGray: "#E5E3DF",
  inkBlack: "#111111",
  coralOrange: "#FF6956",
  coralSoft: "#FFF1EF",
  steelTeal: "#111111",
  dolphinGray: "#F2F1EF",
  lightFrenchBeige: "#FFF1EF",
  milkChocolate: "#111111",
  copperRed: "#FF6956",
  cloud: "#F8F7F5",
  ivory: "#FFFFFF",
} as const;

export const semantic = {
  appBackground: palette.offWhite,
  screenSurface: palette.white,
  cardSurface: palette.white,
  heroStart: palette.inkBlack,
  heroEnd: palette.lightGray,
  accent: palette.coralOrange,
  accentSoft: palette.coralSoft,
  textPrimary: palette.inkBlack,
  textSecondary: "#888888",
  textOnDark: palette.white,
  border: palette.midGray,
  success: "#3F9A74",
  danger: "#E2513E",
  shadow: "rgba(0, 0, 0, 0.10)",
} as const;

export const radius = {
  xl: 28,
  lg: 22,
  md: 18,
  sm: 14,
  pill: 999,
} as const;

export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
} as const;

export const shadow = {
  soft: {
    shadowColor: semantic.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 14,
    elevation: 8,
  },
  card: {
    shadowColor: semantic.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 4,
  },
} as const;
