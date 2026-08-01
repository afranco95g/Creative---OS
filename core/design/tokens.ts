export const colors = {
  background: "#050505",

  surface: "#0B0B0B",

  surfaceElevated: "#111111",

  border: "#242424",

  borderStrong: "#333333",

  text: "#FFFFFF",

  textMuted: "#8F8F8F",

  textSoft: "#666666",

  primary: "#D9FF00",

  primaryHover: "#C8ED00",

  success: "#16A34A",

  warning: "#EAB308",

  danger: "#DC2626",
} as const;

export const radius = {
  sm: "0.5rem",

  md: "1rem",

  lg: "1.5rem",

  xl: "2rem",

  full: "9999px",
} as const;

export const spacing = {
  xs: "0.25rem",

  sm: "0.5rem",

  md: "1rem",

  lg: "1.5rem",

  xl: "2rem",

  "2xl": "3rem",

  "3xl": "4rem",
} as const;

export const typography = {
  display: "text-5xl font-bold tracking-tight",

  h1: "text-4xl font-bold",

  h2: "text-3xl font-semibold",

  h3: "text-2xl font-semibold",

  body: "text-base leading-relaxed",

  small: "text-sm",

  caption: "text-xs uppercase tracking-[0.25em]",
} as const;

export const shadow = {
  card: "shadow-xl",

  floating: "shadow-2xl",
} as const;