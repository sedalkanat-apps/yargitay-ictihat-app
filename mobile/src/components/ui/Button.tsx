import type { ReactNode } from 'react';
import { Pressable, Text, type GestureResponderEvent } from 'react-native';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';

interface ButtonProps {
  label: string;
  onPress: (event: GestureResponderEvent) => void;
  variant?: ButtonVariant;
  icon?: ReactNode;
  trailingIcon?: ReactNode;
  disabled?: boolean;
  accessibilityLabel?: string;
  className?: string;
}

const containerStyles: Record<ButtonVariant, string> = {
  primary: 'bg-primary shadow-lg shadow-primary/20 px-6 py-4',
  secondary: 'border border-border px-6 py-3.5',
  ghost: 'px-2 py-2',
};

const labelStyles: Record<ButtonVariant, string> = {
  primary: 'font-heading text-primary-foreground',
  secondary: 'font-body-semibold text-muted-foreground',
  ghost: 'font-body-semibold text-primary',
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  icon,
  trailingIcon,
  disabled = false,
  accessibilityLabel,
  className = '',
}: ButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={variant === 'ghost' ? 10 : undefined}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled }}
      className={`flex-row items-center justify-center gap-2 rounded-theme ${containerStyles[variant]} ${disabled ? 'opacity-50' : ''} ${className}`}>
      {icon}
      <Text className={`text-sm ${labelStyles[variant]}`}>{label}</Text>
      {trailingIcon}
    </Pressable>
  );
}
