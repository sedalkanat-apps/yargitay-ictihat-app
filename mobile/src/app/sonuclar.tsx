import { StatusBar } from 'expo-status-bar';
import {
  AlertTriangle,
  ArrowLeft,
  Bookmark,
  ChevronDown,
  Filter,
  Search,
  SearchX,
  Share2,
  SlidersHorizontal,
  UserRound,
} from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { FlatList, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { IconCircle } from '@/components/ui/IconCircle';
import { Input } from '@/components/ui/Input';
import { DecisionResultCard } from '@/components/decisions/DecisionResultCard';
import { colors } from '@/theme';

type ViewState = 'loading' | 'success' | 'empty' | 'error';

interface MockDecision {
  id: string;
  mahkeme: string;
  daire: string;
  hukukDali: string;
  esasNo: string;
  kararNo: string;
  tarih: string;
  ozet: string;
}

const SEARCH_QUERY = 'iş kazası tazminat';
const TOTAL_RESULT_COUNT = 3482;
const PAGE_SIZE = 6;
const MAX_ITEMS = 24;

const DECISION_TEMPLATES: Omit<MockDecision, 'id'>[] = [
  {
    mahkeme: 'Yargıtay',
    daire: '21. Hukuk Dairesi',
    hukukDali: 'İŞ HUKUKU',
    esasNo: '2022/4521',
    kararNo: '2023/8890',
    tarih: '14.03.2023',
    ozet: 'İşçinin iş kazası sonucu maluliyeti nedeniyle sürekli iş göremezlik tazminatının hesabında gerçek ücretin esas alınması gerekir.',
  },
  {
    mahkeme: 'Yargıtay',
    daire: '10. Hukuk Dairesi',
    hukukDali: 'İŞ HUKUKU',
    esasNo: '2021/7348',
    kararNo: '2022/11642',
    tarih: '22.12.2022',
    ozet: 'İş kazasının tespiti ve maddi tazminat talebi yönünden kusur oranının belirlenmesinde iş güvenliği uzmanı raporu dikkate alınmalıdır.',
  },
  {
    mahkeme: 'Yargıtay',
    daire: '9. Hukuk Dairesi',
    hukukDali: 'İŞ HUKUKU',
    esasNo: '2020/11876',
    kararNo: '2021/9641',
    tarih: '18.10.2021',
    ozet: 'Meslekte kazanma gücü kaybı oranının tespitinde maluliyet raporunun hükme esas alınabilmesi için denetime elverişli olması zorunludur.',
  },
  {
    mahkeme: 'Yargıtay',
    daire: 'Hukuk Genel Kurulu',
    hukukDali: 'BORÇLAR HUKUKU',
    esasNo: '2019/4482',
    kararNo: '2020/7210',
    tarih: '16.12.2020',
    ozet: 'Manevi tazminatın takdirinde tarafların sosyal ve ekonomik durumları ile olayın gelişim şekli birlikte değerlendirilmelidir.',
  },
];

function buildMockDecisions(count: number, offset: number): MockDecision[] {
  return Array.from({ length: count }, (_, i) => ({
    ...DECISION_TEMPLATES[(offset + i) % DECISION_TEMPLATES.length],
    id: `mock-${offset + i}`,
  }));
}

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
  const [viewState, setViewState] = useState<ViewState>(DEV_FORCE_VIEW_STATE ?? 'loading');
  const [query, setQuery] = useState(SEARCH_QUERY);
  const [selectedFilterChip, setSelectedFilterChip] = useState('Daire');
  const [items, setItems] = useState<MockDecision[]>(() => buildMockDecisions(PAGE_SIZE, 0));
  const [isFetchingMore, setIsFetchingMore] = useState(false);

  useEffect(() => {
    if (DEV_FORCE_VIEW_STATE) return;
    const timer = setTimeout(() => setViewState('success'), 700);
    return () => clearTimeout(timer);
  }, []);

  const handleRetry = () => {
    setViewState('loading');
    setTimeout(() => setViewState('success'), 700);
  };

  const handleEndReached = () => {
    if (isFetchingMore || items.length >= MAX_ITEMS) return;
    setIsFetchingMore(true);
    setTimeout(() => {
      setItems((prev) => [...prev, ...buildMockDecisions(PAGE_SIZE, prev.length)]);
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
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <DecisionResultCard
                mahkeme={item.mahkeme}
                daire={item.daire}
                hukukDali={item.hukukDali}
                esasNo={item.esasNo}
                kararNo={item.kararNo}
                tarih={item.tarih}
                ozet={item.ozet}
                onPress={() => {}}
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
                      {TOTAL_RESULT_COUNT.toLocaleString('tr-TR')}{' '}
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

      <View style={{ paddingBottom: insets.bottom }} className="absolute inset-x-0 bottom-0 border-t border-border bg-background/95">
        <View className="mx-auto w-full max-w-[393px] flex-row items-start justify-around px-4 pt-2" style={{ height: 78 }}>
          <Pressable
            onPress={() => {}}
            accessibilityRole="tab"
            accessibilityState={{ selected: true }}
            accessibilityLabel="Ara"
            hitSlop={4}
            className="min-w-[76px] items-center gap-1">
            <IconCircle icon={<Search size={20} color={colors.primary.foreground} />} size="md" className="bg-primary shadow-lg shadow-primary/20" />
            <Text className="text-[11px] font-body-bold text-primary">Ara</Text>
          </Pressable>
          <Pressable
            onPress={() => {}}
            accessibilityRole="tab"
            accessibilityState={{ selected: false }}
            accessibilityLabel="Dosyalarım"
            hitSlop={4}
            className="min-w-[88px] items-center gap-1">
            <IconCircle icon={<Bookmark size={20} color={colors.muted.foreground} />} color="muted" size="md" className="bg-transparent" />
            <Text className="font-body-semibold text-[11px] text-muted-foreground">Dosyalarım</Text>
          </Pressable>
          <Pressable
            onPress={() => {}}
            accessibilityRole="tab"
            accessibilityState={{ selected: false }}
            accessibilityLabel="Hesabım"
            hitSlop={4}
            className="min-w-[76px] items-center gap-1">
            <IconCircle icon={<UserRound size={20} color={colors.muted.foreground} />} color="muted" size="md" className="bg-transparent" />
            <Text className="font-body-semibold text-[11px] text-muted-foreground">Hesabım</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
