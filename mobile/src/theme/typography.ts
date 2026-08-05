/**
 * html-export'taki Google Fonts linki yalnızca 400/600/700 ağırlıklarını yüklüyor
 * (font-extrabold kullanımları tarayıcının sahte kalınlaştırmasıdır, gerçek bir
 * 800 ağırlık kaynakta hiç yok) ve font-medium hiçbir ekranda kullanılmıyor.
 * Aşağıdaki isimler, ileride @expo-google-fonts ile yüklenecek gerçek font
 * anahtarlarıyla birebir eşleşecek şekilde seçildi.
 */
export const fontFamily = {
  heading: 'Manrope_700Bold',
  body: 'SourceSans3_400Regular',
  bodySemibold: 'SourceSans3_600SemiBold',
  bodyBold: 'SourceSans3_700Bold',
} as const;

/**
 * Tailwind/NativeWind'in varsayılan text-xs…text-2xl ölçeği (12/14/16/18/20/24px)
 * html-export'taki boyutların büyük çoğunluğunu zaten karşılıyor. Burada yalnızca
 * o ölçekte karşılığı olmayan iki boyut (etiket metni ve büyük başlık) tanımlanır.
 */
export const fontSize = {
  '2xs': 10,
  display: 28,
} as const;

export const lineHeight = {
  '2xs': 14,
  display: 34,
} as const;

export type FontFamilyToken = keyof typeof fontFamily;
