import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AlertTriangle, ArrowLeft, NotebookPen } from 'lucide-react-native';
import { useState, type ReactNode } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Input } from '@/components/ui/Input';
import { KaydedilenKararSatiri } from '@/components/dosyalar/KaydedilenKararSatiri';
import { useDosya } from '@/hooks/useDosyalar';
import { useKaydedilenKararlar } from '@/hooks/useKaydedilenKararlar';
import { useNotEkle, useNotlar } from '@/hooks/useNotlar';
import { colors } from '@/theme';
import type { Not } from '@/types/dosya';

// Sekmeler bir dizi olarak tanımlanır: ileride üçüncü bir sekme (ör. "Belgeler")
// eklenmesi gerektiğinde ekran mimarisi değişmez, yalnızca bu diziye ve
// içerigiOlustur()'a bir dal daha eklenir. Ayrı route AÇILMAZ.
type DosyaDetaySekme = 'kararlar' | 'notlar';

const SEKMELER: { key: DosyaDetaySekme; label: string }[] = [
  { key: 'kararlar', label: 'Kaydedilen Kararlar' },
  { key: 'notlar', label: 'Notlar' },
];

function SatirSkeleton() {
  return (
    <View className="mb-3 rounded-theme border border-border bg-card p-4">
      <View className="h-3 w-24 rounded-full bg-muted" />
      <View className="mt-2 h-4 w-40 rounded-full bg-muted" />
    </View>
  );
}

export default function DosyaDetayScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const dosyaId = typeof id === 'string' ? id : '';
  const [aktifSekme, setAktifSekme] = useState<DosyaDetaySekme>('kararlar');
  const [yeniNotMetni, setYeniNotMetni] = useState('');

  const { data: dosya } = useDosya(dosyaId);
  const kararlarQuery = useKaydedilenKararlar(dosyaId);
  const notlarQuery = useNotlar(dosyaId);
  const notEkleMutation = useNotEkle();

  async function handleNotEkle() {
    if (!yeniNotMetni.trim()) return;
    await notEkleMutation.mutateAsync({ dosyaId, metin: yeniNotMetni.trim() });
    setYeniNotMetni('');
  }

  function kararlarIcerigiOlustur(): ReactNode {
    if (kararlarQuery.isLoading) {
      return (
        <View style={{ paddingHorizontal: 20, paddingTop: 16 }}>
          {Array.from({ length: 3 }).map((_, index) => (
            <SatirSkeleton key={index} />
          ))}
        </View>
      );
    }

    if (kararlarQuery.isError) {
      return (
        <View accessibilityRole="alert" className="items-center gap-3 px-8 py-10">
          <AlertTriangle size={20} color={colors.destructive.DEFAULT} />
          <Text className="text-center text-sm text-muted-foreground">Kararlar yüklenemedi.</Text>
          <Button label="Tekrar Dene" variant="secondary" onPress={() => kararlarQuery.refetch()} />
        </View>
      );
    }

    if (!kararlarQuery.data || kararlarQuery.data.length === 0) {
      return (
        <View className="items-center px-8 py-10">
          <Text className="text-center text-sm text-muted-foreground">Bu dosyaya henüz karar kaydedilmedi.</Text>
        </View>
      );
    }

    return (
      <FlatList
        data={kararlarQuery.data}
        keyExtractor={(item) => item.kaydedilenKarar.id}
        renderItem={({ item }) => (
          <KaydedilenKararSatiri
            item={item}
            onPress={() =>
              router.push({ pathname: '/karar-detay/[id]', params: { id: item.kaydedilenKarar.kararId } })
            }
          />
        )}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: insets.bottom + 24 }}
      />
    );
  }

  function notlarIcerigiOlustur(): ReactNode {
    return (
      <FlatList
        data={[...(notlarQuery.data ?? [])].reverse()}
        keyExtractor={(item: Not) => item.id}
        renderItem={({ item }) => (
          <View className="mb-3 rounded-theme border border-border bg-card p-4">
            <Text className="text-sm leading-5 text-card-foreground">{item.metin}</Text>
            <Text className="mt-2 font-mono text-2xs text-muted-foreground">
              {new Date(item.olusturmaTarihi).toLocaleDateString('tr-TR')}
            </Text>
          </View>
        )}
        ListHeaderComponent={
          <View className="mb-4 gap-2">
            <Input
              value={yeniNotMetni}
              onChangeText={setYeniNotMetni}
              placeholder="Not ekleyin…"
              multiline
              accessibilityLabel="Yeni not metni"
            />
            <Button
              label="Not Ekle"
              icon={<NotebookPen size={16} color={colors.primary.foreground} />}
              onPress={handleNotEkle}
              disabled={!yeniNotMetni.trim() || notEkleMutation.isPending}
            />
          </View>
        }
        ListEmptyComponent={
          notlarQuery.isLoading ? (
            <>
              <SatirSkeleton />
              <SatirSkeleton />
            </>
          ) : notlarQuery.isError ? (
            <View accessibilityRole="alert" className="items-center gap-3 py-6">
              <AlertTriangle size={20} color={colors.destructive.DEFAULT} />
              <Text className="text-center text-sm text-muted-foreground">Notlar yüklenemedi.</Text>
              <Button label="Tekrar Dene" variant="secondary" onPress={() => notlarQuery.refetch()} />
            </View>
          ) : (
            <Text className="py-6 text-center text-sm text-muted-foreground">Henüz not eklenmedi.</Text>
          )
        }
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: insets.bottom + 24 }}
        keyboardShouldPersistTaps="handled"
      />
    );
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
        <Text accessibilityRole="header" numberOfLines={1} className="min-w-0 flex-1 font-heading text-lg text-foreground">
          {dosya?.ad ?? 'Dosya Detayı'}
        </Text>
      </View>

      <View className="flex-row gap-2 border-b border-border px-5 py-3">
        {SEKMELER.map((sekme) => (
          <Chip
            key={sekme.key}
            label={sekme.label}
            selected={aktifSekme === sekme.key}
            onPress={() => setAktifSekme(sekme.key)}
            accessibilityLabel={sekme.label}
          />
        ))}
      </View>

      <View className="flex-1">{aktifSekme === 'kararlar' ? kararlarIcerigiOlustur() : notlarIcerigiOlustur()}</View>
    </View>
  );
}
