import type { ViewStyle } from 'react-native';

import { colors } from './colors';

type ShadowStyle = Pick<
  ViewStyle,
  'shadowColor' | 'shadowOffset' | 'shadowOpacity' | 'shadowRadius' | 'elevation'
>;

/**
 * html-export'taki shadow-sm/shadow-lg (siyah, düşük opaklık) ve
 * shadow-primary/20 (birincil renk "glow" efekti, CTA butonlarında ve
 * aktif durumlarda tekrar eder) desenlerinin React Native karşılığıdır.
 * RN'in shadow modeli CSS box-shadow ile birebir eşleşmediği için
 * yaklaşık, görsel olarak sadık değerler kullanılmıştır.
 */
export const shadows: Record<'sm' | 'lg' | 'glow', ShadowStyle> = {
  sm: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  lg: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 14,
    elevation: 8,
  },
  glow: {
    shadowColor: colors.primary.DEFAULT,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
};
