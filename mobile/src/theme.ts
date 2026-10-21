/** Colors mirror the web app's @theme tokens (src/index.css). */
export const colors = {
  brand50: "#f0fdf4",
  brand100: "#dcfce7",
  brand200: "#bbf7d0",
  brand300: "#86efac",
  brand400: "#4ade80",
  brand500: "#22c55e",
  brand600: "#16a34a",
  brand700: "#15803d",
  brand800: "#166534",
  brand900: "#14532d",
  brand950: "#052e16",

  accent100: "#dcfce7",
  accent300: "#86efac",
  accent400: "#4ade80",
  accent500: "#22c55e",
  accent600: "#16a34a",
  accent700: "#15803d",

  ink50: "#09090b",
  ink100: "#18181b",
  ink200: "#37373f",
  ink300: "#52525b",
  ink400: "#96928a",
  ink500: "#aaa69c",
  ink600: "#c3bfb5",
  ink700: "#dedbd2",
  ink800: "#e9e6df",
  ink900: "#f4f4f5",
  ink950: "#fafafa",
  cream: "#09090b",

  white: "#18181b",
  pureWhite: "#ffffff",
  red: "#dc2626",
  redBg: "#351a19",
  amber: "#f0c75e",
  amberBg: "#302815",
  blue: "#7ab7ff",
  blueBg: "#172638",
  green: "#4ade80",
  greenBg: "#173521",

  whatsapp: "#25d366",
  whatsappDark: "#128c72",
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
} as const;

export const spacing = (n: number) => n * 4;
