import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';

interface SectionHeaderAction {
  label: string;
  onPress: () => void;
}

interface SectionHeaderProps {
  title: string;
  eyebrow?: string;
  action?: SectionHeaderAction;
  trailing?: ReactNode;
  className?: string;
}

export function SectionHeader({ title, eyebrow, action, trailing, className = '' }: SectionHeaderProps) {
  return (
    <View className={`flex-row items-end justify-between ${className}`}>
      <View>
        {eyebrow ? (
          <Text className="font-mono text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
            {eyebrow}
          </Text>
        ) : null}
        <Text accessibilityRole="header" className="font-heading text-base text-foreground">
          {title}
        </Text>
      </View>
      {action ? (
        <Pressable
          onPress={action.onPress}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={action.label}>
          <Text className="font-body-semibold text-xs text-primary">{action.label}</Text>
        </Pressable>
      ) : trailing ? (
        trailing
      ) : null}
    </View>
  );
}
