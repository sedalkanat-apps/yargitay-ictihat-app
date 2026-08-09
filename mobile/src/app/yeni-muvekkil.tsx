import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ArrowLeft } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '@/theme';

export default function YeniMuvekkilScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View className="flex-1 bg-background">
      <StatusBar style="light" />
      <View style={{ paddingTop: insets.top + 8 }} className="flex-row items-center gap-3 border-b border-border px-5 pb-3">
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Geri dön"
          hitSlop={8}
          className="h-11 w-11 items-center justify-center rounded-theme border border-border bg-card">
          <ArrowLeft size={18} color={colors.muted.foreground} />
        </Pressable>
        <Text accessibilityRole="header" className="font-heading text-lg text-foreground">
          Yeni Müvekkil
        </Text>
      </View>
      <View className="flex-1 items-center justify-center px-8">
        <Text className="text-center text-sm text-muted-foreground">Bu ekran yakında geliyor.</Text>
      </View>
    </View>
  );
}
