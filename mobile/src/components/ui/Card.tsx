import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';

export type CardVariant = 'default' | 'highlighted';
export type CardPadding = 'md' | 'lg';

interface CardProps {
  children: ReactNode;
  variant?: CardVariant;
  padding?: CardPadding;
  onPress?: () => void;
  accessibilityLabel?: string;
  className?: string;
}

const variantStyles: Record<CardVariant, string> = {
  default: 'border-border bg-card',
  highlighted: 'border-primary/35 bg-card',
};

const paddingStyles: Record<CardPadding, string> = {
  md: 'p-4',
  lg: 'p-5',
};

export function Card({
  children,
  variant = 'default',
  padding = 'md',
  onPress,
  accessibilityLabel,
  className = '',
}: CardProps) {
  const classes = `rounded-theme border ${variantStyles[variant]} ${paddingStyles[padding]} ${className}`;

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        className={classes}>
        {children}
      </Pressable>
    );
  }

  return (
    <View accessibilityLabel={accessibilityLabel} className={classes}>
      {children}
    </View>
  );
}
