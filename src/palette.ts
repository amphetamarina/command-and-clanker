export type Faces = { top: number; left: number; right: number };

const BASE_COLORS = [
  0xff6b9d,
  0xc39eff,
  0x6bb6ff,
  0x6bf0c1,
  0xffd76b,
  0xff8c6b,
  0x9fff6b,
  0xff6bff,
];

function shade(hex: number, factor: number): number {
  const clamp = (n: number) => Math.min(255, Math.max(0, Math.round(n)));
  const r = clamp(((hex >> 16) & 0xff) * factor);
  const g = clamp(((hex >> 8) & 0xff) * factor);
  const b = clamp((hex & 0xff) * factor);
  return (r << 16) | (g << 8) | b;
}

export const PALETTE: Faces[] = BASE_COLORS.map((c) => ({
  top: c,
  left: shade(c, 0.78),
  right: shade(c, 0.55),
}));
