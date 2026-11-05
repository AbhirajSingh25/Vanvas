/**
 * VANVAS Brand Colors & Visual Identity Tokens
 *
 * Visual feeling: Indian visual heritage + Himalayan pine forests +
 * mist overlays + warm natural paper journals + brass & terracotta accents.
 */

export const colors = {
  // Primary Forest Tones
  forestDark: "#17352C",
  forest: "#173B32",
  forestHover: "#20453B",
  pine: "#285447",
  moss: "#536B52",
  jungle: "#0F2924",

  // Warm Surfaces & Parchment
  parchment: "#FAF4E8",
  parchmentSubtle: "#EFE5D2",
  surface: "#FAF7F0",
  surfaceElevated: "#FFFFFF",
  surfaceMuted: "#E5D5BA",
  oldPaper: "#E9E1D1",

  // Accents
  terracotta: "#B65E3C",
  terracottaHover: "#9E4D2E",
  burntEarth: "#8A6547",
  brass: "#B49252",
  brassGlow: "rgba(180, 146, 82, 0.2)",
  mist: "#DCE3DD",
  mistSubtle: "#D8DED5",

  // Neutrals & Foregrounds
  charcoal: "#20211D",
  foregroundMuted: "#5A6560",
  foregroundSubtle: "#7A8580",
  border: "#D8CBB2",
  borderSubtle: "#E5D5BA",

  // Dark Mode / Night Camp Palette
  nightBackground: "#0A100D",
  nightBackgroundSubtle: "#0D1512",
  nightSurface: "#111A16",
  nightSurfaceElevated: "#16241E",
  nightSurfaceMuted: "#1A2C24",
  nightForeground: "#ECEAE4",
  nightForegroundMuted: "#A3B8B0",
  nightForegroundSubtle: "#7E948B",
  nightBorder: "rgba(216, 222, 213, 0.16)",
  nightPrimary: "#2D5A43",

  // Status & Utility
  success: "#2D7D46",
  warning: "#C77700",
  error: "#C0392B",
  info: "#2B6CB0",
} as const;

export type ColorToken = keyof typeof colors;
