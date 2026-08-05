import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';

interface ChipProps {
  label: string;
  selected?: boolean;
  icon?: ReactNode;
  trailingIcon?: ReactNode;
  onPress?: () => void;
  accessibilityLabel?: string;
  className?: string;
}

export function Chip({
  label,
  selected = false,
  icon,
  trailingIcon,
  onPress,
  accessibilityLabel,
  className = '',
}: ChipProps) {
  const containerClasses = `flex-row items-center gap-1.5 rounded-theme border px-3 py-2 ${
    selected ? 'border-primary bg-primary/15' : 'border-border bg-secondary'
  } ${className}`;
  const textClasses = `font-body-semibold text-xs ${selected ? 'text-primary' : 'text-secondary-foreground'}`;

  if (!onPress) {
    return (
      <View className={containerClasses}>
        {icon}
        <Text className={textClasses}>{label}</Text>
        {trailingIcon}
      </View>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ selected }}
      className={containerClasses}>
      {icon}
      <Text className={textClasses}>{label}</Text>
      {trailingIcon}
    </Pressable>
  );
}
