export const radius = {
  theme: 12, // --radius — kart, buton, input için ana köşe yuvarlaklığı
  full: 9999, // rozet, çip, ikon dairesi
} as const;

export type RadiusToken = keyof typeof radius;
