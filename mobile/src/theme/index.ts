import { colors as sharedColors } from "@vanvas/shared";

export const theme = {
  colors: {
    ...sharedColors,
    // Aliases for convenience
    primary: sharedColors.forest,
    primaryDark: sharedColors.forestDark,
    primaryHover: sharedColors.forestHover,
    accent: sharedColors.terracotta,
    background: sharedColors.parchment,
    backgroundSubtle: sharedColors.parchmentSubtle,
    surface: sharedColors.surface,
    surfaceElevated: sharedColors.surfaceElevated,
    surfaceMuted: sharedColors.surfaceMuted,
    foreground: sharedColors.charcoal,
    foregroundMuted: sharedColors.foregroundMuted,
    foregroundSubtle: sharedColors.foregroundSubtle,
    border: sharedColors.border,
    borderSubtle: sharedColors.borderSubtle,
    dark: {
      background: sharedColors.nightBackground,
      surface: sharedColors.nightSurface,
      surfaceElevated: sharedColors.nightSurfaceElevated,
      foreground: sharedColors.nightForeground,
      foregroundMuted: sharedColors.nightForegroundMuted,
      border: sharedColors.nightBorder,
      primary: sharedColors.nightPrimary,
    },
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    base: 16,
    lg: 20,
    xl: 24,
    "2xl": 32,
    "3xl": 40,
  },
  radius: {
    sm: 6,
    md: 10,
    lg: 14,
    xl: 20,
    full: 9999,
  },
};

export type Theme = typeof theme;
export type ThemeColors = {
  [K in keyof typeof theme.colors]: typeof theme.colors[K] extends object ? typeof theme.colors[K] : string;
};

export function getSemanticColors(isDark: boolean): ThemeColors {
  if (isDark) {
    return {
      ...theme.colors,
      background: theme.colors.dark.background,
      backgroundSubtle: theme.colors.dark.surface,
      surface: theme.colors.dark.surface,
      surfaceElevated: theme.colors.dark.surfaceElevated,
      foreground: theme.colors.dark.foreground,
      foregroundMuted: theme.colors.dark.foregroundMuted,
      border: theme.colors.dark.border,
      primary: theme.colors.dark.primary,
    };
  }
  return {
    ...theme.colors,
  };
}
