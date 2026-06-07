import type { ITheme } from "@xterm/xterm";

/** Palette derived from the Sirvelyn key logo (gold + navy duotone). */
export const palette = {
  ink: "#06061A",
  surface: "#11122B",
  surface2: "#1B1C3D",
  border: "#000030",
  borderSoft: "#2C2D52",
  gold: "#F5B800",
  goldLight: "#F8D038",
  goldDeep: "#C89200",
  text: "#F4EFDD",
  textMuted: "#9A9AB5",
  danger: "#E4572E",
  ok: "#8FB339",
} as const;

/** xterm.js theme harmonized with the palette but still readable for code. */
export const xtermTheme: ITheme = {
  background: palette.ink,
  foreground: palette.text,
  cursor: palette.gold,
  cursorAccent: palette.ink,
  selectionBackground: "rgba(245,184,0,0.30)",
  black: "#1B1C3D",
  red: "#E4572E",
  green: "#8FB339",
  yellow: "#F5B800",
  blue: "#5B7DB1",
  magenta: "#A36BC0",
  cyan: "#5FB3B3",
  white: "#C9C7D8",
  brightBlack: "#3A3B66",
  brightRed: "#FF7A55",
  brightGreen: "#B6D45C",
  brightYellow: "#F8D038",
  brightBlue: "#7FA0D4",
  brightMagenta: "#C490DE",
  brightCyan: "#86D0D0",
  brightWhite: "#F4EFDD",
};
