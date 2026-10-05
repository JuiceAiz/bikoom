/** Colors mirror the web app's @theme tokens (src/index.css). */
export const colors = {
  brand50: "#ecfdf3",
  brand100: "#d3f8e2",
  brand200: "#acefd0",
  brand500: "#1faf7f",
  brand600: "#128c64",
  brand700: "#0e7052",
  brand950: "#052a20",

  accent100: "#ffeec7",
  accent500: "#f59e0b",
  accent600: "#d97706",

  ink50: "#f8fafc",
  ink100: "#f1f5f9",
  ink200: "#e2e8f0",
  ink300: "#cbd5e1",
  ink400: "#94a3b8",
  ink500: "#64748b",
  ink600: "#475569",
  ink700: "#334155",
  ink950: "#0b1220",

  white: "#ffffff",
  red: "#dc2626",
  redBg: "#fef2f2",
  amber: "#b45309",
  amberBg: "#fffbeb",
  blue: "#2563eb",
  blueBg: "#eff6ff",
  green: "#15803d",
  greenBg: "#f0fdf4",

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
