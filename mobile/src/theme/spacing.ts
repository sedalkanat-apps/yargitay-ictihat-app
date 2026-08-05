/**
 * Genel spacing ölçeği için NativeWind'in varsayılan Tailwind skalası kullanılır
 * (p-4, gap-2, px-5 vb. zaten html-export'taki tüm değerleri karşılıyor).
 * Burada yalnızca ekranlar arasında tekrar eden, isimlendirilmiş yerleşim
 * değerleri tanımlanır.
 */
export const spacing = {
  screenPadding: 20, // px-5 — tüm ekranlarda tutarlı yatay kenar boşluğu
  cardPadding: 16, // p-4 — kart iç boşluğu
  sectionGap: 24, // mt-6 — bölümler arası dikey boşluk
} as const;

export type SpacingToken = keyof typeof spacing;
