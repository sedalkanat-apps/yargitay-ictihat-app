import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

export type BadgeVariant = 'primary' | 'accent' | 'success' | 'destructive' | 'muted';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  icon?: ReactNode;
  accessibilityLabel?: string;
  className?: string;
}

const containerStyles: Record<BadgeVariant, string> = {
  primary: 'bg-primary/10',
  accent: 'bg-accent/10',
  success: 'bg-success/10',
  destructive: 'bg-destructive/10',
  muted: 'bg-muted',
};

const textStyles: Record<BadgeVariant, string> = {
  primary: 'text-primary',
  accent: 'text-accent',
  success: 'text-success',
  destructive: 'text-destructive',
  muted: 'text-muted-foreground',
};

export function Badge({ label, variant = 'muted', icon, accessibilityLabel, className = '' }: BadgeProps) {
  return (
    <View
      accessibilityLabel={accessibilityLabel}
      className={`flex-row items-center gap-1 self-start rounded-full px-2.5 py-1 ${containerStyles[variant]} ${className}`}>
      {icon}
      <Text className={`font-body-bold text-xs ${textStyles[variant]}`}>{label}</Text>
    </View>
  );
}
