import { Text, TextInput, View, type KeyboardTypeOptions } from 'react-native';

import { colors } from '@/theme';

interface InputProps {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  multiline?: boolean;
  secureTextEntry?: boolean;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  errorMessage?: string;
  accessibilityLabel?: string;
  className?: string;
}

export function Input({
  label,
  value,
  onChangeText,
  placeholder,
  multiline = false,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  errorMessage,
  accessibilityLabel,
  className = '',
}: InputProps) {
  return (
    <View className={className}>
      {label ? (
        <Text className="mb-2 font-mono text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </Text>
      ) : null}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.muted.foreground}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
        textAlignVertical={multiline ? 'top' : 'center'}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        accessibilityLabel={accessibilityLabel ?? label}
        className={`min-h-11 rounded-theme border bg-input px-3.5 py-3 font-body text-base text-foreground ${
          errorMessage ? 'border-destructive' : 'border-border'
        }`}
      />
      {errorMessage ? <Text className="mt-1.5 text-xs text-destructive">{errorMessage}</Text> : null}
    </View>
  );
}
