import type { ReactNode } from 'react';
import { View } from 'react-native';

export type IconCircleColor = 'primary' | 'accent' | 'success' | 'destructive' | 'muted';
export type IconCircleSize = 'sm' | 'md' | 'lg';

interface IconCircleProps {
  icon: ReactNode;
  color?: IconCircleColor;
  size?: IconCircleSize;
  accessibilityLabel?: string;
  className?: string;
}

const colorStyles: Record<IconCircleColor, string> = {
  primary: 'bg-primary/15',
  accent: 'bg-accent/15',
  success: 'bg-success/15',
  destructive: 'bg-destructive/15',
  muted: 'bg-muted',
};

const sizeStyles: Record<IconCircleSize, string> = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-11 w-11',
};

export function IconCircle({
  icon,
  color = 'primary',
  size = 'md',
  accessibilityLabel,
  className = '',
}: IconCircleProps) {
  return (
    <View
      accessible={Boolean(accessibilityLabel)}
      accessibilityLabel={accessibilityLabel}
      className={`items-center justify-center rounded-full ${sizeStyles[size]} ${colorStyles[color]} ${className}`}>
      {icon}
    </View>
  );
}
