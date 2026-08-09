import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ArrowLeft, FolderPlus } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Input } from '@/components/ui/Input';
import { useDosyaOlustur } from '@/hooks/useDosyalar';
import { colors } from '@/theme';

const DOSYA_ADI_ONERILERI = ['Kira Tespiti', 'Tahliye Davası', 'İşçilik Alacağı', 'Miras', 'Boşanma'];

export default function YeniDosyaScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { muvekkilId } = useLocalSearchParams<{ muvekkilId: string }>();
  const gecerliMuvekkilId = typeof muvekkilId === 'string' && muvekkilId.trim().length > 0;

  const [ad, setAd] = useState('');
  const dosyaOlusturMutation = useDosyaOlustur();

  async function handleOlustur() {
    if (!gecerliMuvekkilId || !ad.trim()) return;
    const yeniDosya = await dosyaOlusturMutation.mutateAsync({ muvekkilId, ad: ad.trim() });
    router.replace({ pathname: '/dosya-detay/[id]', params: { id: yeniDosya.id } });
  }

  return (
    <View className="flex-1 bg-background">
      <StatusBar style="light" />
      <View
        style={{ paddingTop: insets.top + 8 }}
        className="flex-row items-center gap-3 border-b border-border px-5 pb-3">
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Geri dön"
          hitSlop={8}
          className="h-11 w-11 items-center justify-center rounded-theme border border-border bg-card">
          <ArrowLeft size={18} color={colors.muted.foreground} />
        </Pressable>
        <Text accessibilityRole="header" className="font-heading text-lg text-foreground">
          Yeni Dosya
        </Text>
      </View>

      {gecerliMuvekkilId ? (
        <ScrollView contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">
          <Input
            label="Dosya Adı"
            value={ad}
            onChangeText={setAd}
            placeholder="Örn: Kira Tespiti"
            accessibilityLabel="Dosya adı"
            className="mb-4"
          />
          <Text className="mb-2 font-mono text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
            Öneriler
          </Text>
          <View className="mb-6 flex-row flex-wrap gap-2">
            {DOSYA_ADI_ONERILERI.map((oneri) => (
              <Chip key={oneri} label={oneri} selected={ad === oneri} onPress={() => setAd(oneri)} />
            ))}
          </View>
          <Button
            label="Oluştur"
            icon={<FolderPlus size={16} color={colors.primary.foreground} />}
            onPress={handleOlustur}
            disabled={!ad.trim() || dosyaOlusturMutation.isPending}
            className="w-full"
          />
        </ScrollView>
      ) : (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-center text-sm text-muted-foreground">Müvekkil bulunamadı.</Text>
        </View>
      )}
    </View>
  );
}
