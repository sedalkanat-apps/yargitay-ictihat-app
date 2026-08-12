import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  AlertTriangle,
  ArrowLeft,
  ChevronDown,
  Filter,
  Search,
  SearchX,
  Share2,
  SlidersHorizontal,
} from 'lucide-react-native';
import { useState } from 'react';
import { FlatList, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { IconCircle } from '@/components/ui/IconCircle';
import { Input } from '@/components/ui/Input';
import { CustomTabBar } from '@/components/layout/CustomTabBar';
import { DecisionResultCard } from '@/components/decisions/DecisionResultCard';
import { useKararlar } from '@/hooks/useKararlar';
import { colors } from '@/theme';
import type { KararOzet } from '@/types/karar';

type ViewState = 'loading' | 'success' | 'empty' | 'error';

// Bu ekranın kendi karar verisi YOKTUR. Aşağıdaki satır, aynı 4 karar
// kaydını "sonsuz kaydırma" hissi vermek için tekrar tekrar gösterir —
// hepsi kararRepository'den (useKararlar) gelir, ayrı bir mock liste
// tutulmaz. Aynı karar birden fazla satırda görünebileceği için satır
// anahtarı karar id'si DEĞİL, `${karar.id}-${index}` ile üretilir.
interface SonucSatiri {
  key: string;
  karar: KararOzet;
}

function buildResultRows(kararlar: KararOzet[], count: number): SonucSatiri[] {
  return kararlar.slice(0, count).map((karar) => ({
    key: karar.id,
    karar,
  }));
}

const SEARCH_QUERY = 'iş kazası tazminat';
const PAGE_SIZE = 6;
const MAX_ITEMS = 24;

const FILTER_CHIPS = ['Daire', 'Yıl', 'Esas/Karar No', 'Hukuk/Ceza'];

// Test için 'loading' | 'success' | 'empty' | 'error' yapın; null = normal akış.
const DEV_FORCE_VIEW_STATE: ViewState | null = null;

function DecisionCardSkeleton() {
  return (
    <View className="mb-3 rounded-theme border border-border bg-card p-4">
      <View className="h-3 w-24 rounded-full bg-muted" />
      <View className="mt-3 h-4 w-40 rounded-full bg-muted" />
      <View className="mt-3 flex-row gap-3">
        <View className="h-2.5 w-16 rounded-full bg-muted" />
        <View className="h-2.5 w-16 rounded-full bg-muted" />
      </View>
      <View className="mt-4 gap-2 border-t border-border pt-3">
        <View className="h-2.5 w-full rounded-full bg-muted" />
        <View className="h-2.5 w-11/12 rounded-full bg-muted" />
        <View className="h-2.5 w-3/4 rounded-full bg-muted" />
      </View>
    </View>
  );
}

export default function SonuclarScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { q } = useLocalSearchParams<{ q?: string }>();
  const [query, setQuery] = useState(q ?? SEARCH_QUERY);
  const [selectedFilterChip, setSelectedFilterChip] = useState('Daire');
  const [itemCount, setItemCount] = useState(PAGE_SIZE);
  const [isFetchingMore, setIsFetchingMore] = useState(false);

  const kararlarQuery = useKararlar({ q: query });
  const items = buildResultRows(kararlarQuery.data ?? [], Math.min(itemCount, MAX_ITEMS));

  const viewState: ViewState =
    DEV_FORCE_VIEW_STATE ??
    (kararlarQuery.isLoading
      ? 'loading'
      : kararlarQuery.isError
        ? 'error'
        : items.length === 0
          ? 'empty'
          : 'success');

  const handleRetry = async () => {
    await kararlarQuery.refetch();
  };

  const handleEndReached = () => {
    if (isFetchingMore || itemCount >= MAX_ITEMS) return;
    setIsFetchingMore(true);
    setTimeout(() => {
      setItemCount((prev) => Math.min(prev + PAGE_SIZE, MAX_ITEMS));
      setIsFetchingMore(false);
    }, 600);
  };

  return (
    <View className="flex-1 bg-background">
      <StatusBar style="light" />

      <View style={{ paddingTop: insets.top + 8 }} className="border-b border-border px-5 pb-3">
        <View className="mb-3 flex-row items-center gap-3">
          <Pressable
            onPress={() => {}}
            accessibilityRole="button"
            accessibilityLabel="Geri dön"
            hitSlop={8}
            className="h-9 w-9 items-center justify-center rounded-theme border border-border bg-card">
            <ArrowLeft size={18} color={colors.muted.foreground} />
          </Pressable>
          <View className="min-w-0 flex-1">
            <Text className="font-heading text-2xs uppercase tracking-wider text-primary">Arama sonuçları</Text>
            <Text numberOfLines={1} className="mt-0.5 font-heading text-lg text-foreground">
              {query}
            </Text>
          </View>
          <Pressable
            onPress={() => {}}
            accessibilityRole="button"
            accessibilityLabel="Aramayı paylaş"
            hitSlop={8}
            className="h-9 w-9 items-center justify-center rounded-theme border border-border bg-card">
            <Share2 size={16} color={colors.muted.foreground} />
          </Pressable>
        </View>

        <View className="flex-row items-center gap-3 rounded-theme border border-primary/45 bg-input px-3 py-2.5">
          <Search size={18} color={colors.primary.DEFAULT} />
          <Input
            value={query}
            onChangeText={setQuery}
            accessibilityLabel="Arama sorgusunu düzenle"
            className="min-h-0 flex-1 border-transparent bg-transparent px-0 py-0"
          />
          <Pressable onPress={() => {}} accessibilityRole="button" accessibilityLabel="Aramayı düzenle" hitSlop={8}>
            <SlidersHorizontal size={18} color={colors.muted.foreground} />
          </Pressable>
        </View>
      </View>

      <View className="flex-1">
        {viewState === 'loading' && (
          <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: insets.bottom + 96 }}>
            {Array.from({ length: 4 }).map((_, index) => (
              <DecisionCardSkeleton key={index} />
            ))}
          </ScrollView>
        )}

        {viewState === 'empty' && (
          <View className="flex-1 items-center justify-center gap-3 px-8">
            <IconCircle icon={<SearchX size={22} color={colors.muted.foreground} />} color="muted" size="lg" />
            <Text className="text-center font-heading text-base text-foreground">Sonuç bulunamadı</Text>
            <Text className="text-center text-sm text-muted-foreground">
              Arama kriterlerinize uygun karar bulunamadı. Filtreleri değiştirip tekrar deneyin.
            </Text>
            <Button label="Filtreleri Temizle" variant="secondary" onPress={() => {}} />
          </View>
        )}

        {viewState === 'error' && (
          <View className="flex-1 items-center justify-center gap-3 px-8">
            <IconCircle icon={<AlertTriangle size={22} color={colors.destructive.DEFAULT} />} color="destructive" size="lg" />
            <Text className="text-center font-heading text-base text-foreground">Bir şeyler ters gitti</Text>
            <Text className="text-center text-sm text-muted-foreground">
              Sonuçlar yüklenemedi. Lütfen bağlantınızı kontrol edip tekrar deneyin.
            </Text>
            <Button label="Tekrar Dene" variant="primary" onPress={handleRetry} />
          </View>
        )}

        {viewState === 'success' && (
          <FlatList
            data={items}
            keyExtractor={(item) => item.key}
            renderItem={({ item }) => (
              <DecisionResultCard
                mahkeme={item.karar.mahkeme}
                daire={item.karar.daire}
                hukukDali={item.karar.hukukDali}
                esasNo={item.karar.esasNo}
                kararNo={item.karar.kararNo}
                tarih={item.karar.tarih}
                ozet={item.karar.ozet}
                onPress={() => router.push({ pathname: '/karar-detay/[id]', params: { id: item.karar.id } })}
                onSavePress={() => {}}
              />
            )}
            onEndReachedThreshold={0.4}
            onEndReached={handleEndReached}
            contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: insets.bottom + 96 }}
            ListHeaderComponent={
              <>
                <View className="mb-5 flex-row items-end justify-between gap-3">
                  <View>
                    <Text className="text-2xs font-body-semibold uppercase tracking-wider text-muted-foreground">
                      Arama tamamlandı
                    </Text>
                    <Text className="mt-1 font-heading text-xl text-foreground">
                      {(kararlarQuery.data?.length ?? 0).toLocaleString('tr-TR')}{' '}
                      <Text className="font-body-semibold text-base text-muted-foreground">karar bulundu</Text>
                    </Text>
                  </View>
                  <Badge label="Güncel" variant="success" />
                </View>

                <View className="mb-5">
                  <View className="mb-2.5 flex-row items-center justify-between">
                    <Text className="text-2xs font-body-bold uppercase tracking-wider text-muted-foreground">
                      Daralt ve filtrele
                    </Text>
                    <Button
                      label="Filtrele"
                      variant="ghost"
                      icon={<Filter size={14} color={colors.primary.DEFAULT} />}
                      onPress={() => {}}
                    />
                  </View>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View className="flex-row gap-2">
                      {FILTER_CHIPS.map((label) => (
                        <Chip
                          key={label}
                          label={label}
                          selected={selectedFilterChip === label}
                          trailingIcon={
                            <ChevronDown
                              size={14}
                              color={selectedFilterChip === label ? colors.primary.DEFAULT : colors.muted.foreground}
                            />
                          }
                          onPress={() => setSelectedFilterChip(label)}
                        />
                      ))}
                    </View>
                  </ScrollView>
                </View>

                <View className="mb-3 flex-row items-center justify-between border-b border-border pb-3">
                  <Text className="text-xs text-muted-foreground">
                    <Text className="font-mono text-foreground">01—{String(items.length).padStart(2, '0')}</Text> arası
                    gösteriliyor
                  </Text>
                  <Pressable onPress={() => {}} accessibilityRole="button" className="flex-row items-center gap-1.5">
                    <Text className="font-body-bold text-xs text-secondary-foreground">İlgililik</Text>
                    <ChevronDown size={14} color={colors.primary.DEFAULT} />
                  </Pressable>
                </View>
              </>
            }
            ListFooterComponent={
              isFetchingMore ? (
                <View className="flex-row items-center justify-center gap-2 py-6">
                  <View className="h-1.5 w-1.5 rounded-full bg-primary" />
                  <Text className="text-xs text-muted-foreground">Daha fazla emsal karar yükleniyor</Text>
                </View>
              ) : null
            }
          />
        )}
      </View>

      <CustomTabBar aktifSekme="ara" altBosluk={insets.bottom} />
    </View>
  );
}
