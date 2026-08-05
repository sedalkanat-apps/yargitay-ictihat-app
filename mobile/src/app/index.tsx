import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import {
  ArrowRight,
  ArrowUpLeft,
  Bell,
  BriefcaseBusiness,
  Bookmark,
  ChevronRight,
  Clock3,
  DatabaseZap,
  FileText,
  HeartHandshake,
  Landmark,
  LayoutGrid,
  Mic,
  ScanSearch,
  Scale,
  Search,
  SlidersHorizontal,
  UserRound,
  Zap,
} from 'lucide-react-native';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { IconCircle, type IconCircleColor } from '@/components/ui/IconCircle';
import { Input } from '@/components/ui/Input';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { colors, shadows } from '@/theme';

const HERO_IMAGE_URL =
  'https://fwtngjyirchhhysukjxi.supabase.co/storage/v1/object/public/project-images/317cb4d7-0c1f-492c-a456-bf272d527208/636a98d3-1266-4df9-8746-929874f74a06.png';

const RECENT_SEARCHES = ['kira sözleşmesi fesih', 'trafik kazası maddi manevi tazminat', 'işe iade davası'];

const RECOMMENDED_SEARCHES: { title: string; Icon: typeof Zap; iconColor: IconCircleColor }[] = [
  { title: 'kıdem tazminatı hesaplama', Icon: Zap, iconColor: 'primary' },
  { title: 'boşanma mal paylaşımı', Icon: Search, iconColor: 'muted' },
];

const CATEGORIES = [
  {
    title: 'Borçlar Hukuku',
    count: '294.561 karar',
    Icon: FileText,
    blobClassName: 'bg-primary/10',
    iconWrapClassName: 'bg-primary/15',
    iconColor: colors.primary.DEFAULT,
  },
  {
    title: 'İş Hukuku',
    count: '221.804 karar',
    Icon: BriefcaseBusiness,
    blobClassName: 'bg-[#7E9BE8]/10',
    iconWrapClassName: 'bg-[#7E9BE8]/15',
    iconColor: '#9EB4F4',
  },
  {
    title: 'Ceza Hukuku',
    count: '412.970 karar',
    Icon: Scale,
    blobClassName: 'bg-destructive/10',
    iconWrapClassName: 'bg-destructive/15',
    iconColor: colors.destructive.DEFAULT,
  },
  {
    title: 'Aile Hukuku',
    count: '156.218 karar',
    Icon: HeartHandshake,
    blobClassName: 'bg-accent/10',
    iconWrapClassName: 'bg-accent/15',
    iconColor: colors.accent.DEFAULT,
  },
];

const WIDE_CATEGORY = {
  title: 'Ticaret Hukuku',
  count: '183.944 karar',
  Icon: Landmark,
  iconWrapClassName: 'bg-success/15',
  iconColor: colors.success.DEFAULT,
};

export default function AraScreen() {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1 bg-background">
      <StatusBar style="light" />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
        contentContainerStyle={{ paddingBottom: insets.bottom + 96 }}>
        <View className="relative overflow-hidden border-b border-border">
          <Image source={{ uri: HERO_IMAGE_URL }} className="absolute inset-0 h-full w-full opacity-30" contentFit="cover" />
          <View className="absolute inset-0 bg-background/70" />

          <View style={{ paddingTop: insets.top + 12 }} className="relative px-5 pb-6">
            <View className="mb-7 flex-row items-center justify-between">
              <View className="flex-1 pr-3">
                <View className="mb-1 flex-row items-center gap-2">
                  <View className="h-2 w-2 rounded-full bg-primary" style={shadows.glow} />
                  <Text className="text-2xs font-body-semibold uppercase tracking-widest text-primary">
                    Yargıtay İçtihat
                  </Text>
                </View>
                <Text className="font-heading text-2xl text-foreground">Bugün hangi içtihadı arıyorsunuz?</Text>
                <Text className="mt-1 text-sm text-muted-foreground">Emsal içtihatlara saniyeler içinde ulaşın.</Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Bildirimler"
                hitSlop={8}
                className="h-10 w-10 items-center justify-center rounded-theme border border-border bg-card/90">
                <Bell size={20} color={colors.muted.foreground} />
              </Pressable>
            </View>

            <Card variant="highlighted" padding="md" className="border-primary/40 p-2 shadow-lg shadow-black/20">
              <View className="flex-row items-center gap-3 rounded-theme bg-input px-3 py-3">
                <Search size={20} color={colors.primary.DEFAULT} />
                <Input
                  value={query}
                  onChangeText={setQuery}
                  placeholder="Örn: kira sözleşmesi fesih, iş kazası tazminat"
                  accessibilityLabel="Emsal karar arama kutusu"
                  className="min-h-0 flex-1 border-transparent bg-transparent px-0 py-0"
                />
                <Pressable accessibilityRole="button" accessibilityLabel="Sesli arama" hitSlop={8}>
                  <Mic size={18} color={colors.muted.foreground} />
                </Pressable>
              </View>
              <Button
                label="Emsal Karar Ara"
                icon={<ScanSearch size={18} color={colors.primary.foreground} />}
                onPress={() => {}}
                className="mt-2 w-full"
              />
            </Card>

            <Card variant="default" padding="md" className="mt-3 border-border bg-card/95 p-0 shadow-lg shadow-black/10">
              {RECOMMENDED_SEARCHES.map((item, index) => (
                <Pressable
                  key={item.title}
                  onPress={() => {}}
                  accessibilityRole="button"
                  accessibilityLabel={`Önerilen arama: ${item.title}`}
                  className={`flex-row items-center gap-3 px-4 py-3 ${index === 0 ? 'border-b border-border' : ''}`}>
                  <IconCircle icon={<item.Icon size={14} color={item.iconColor === 'primary' ? colors.primary.DEFAULT : colors.muted.foreground} />} color={item.iconColor} size="sm" />
                  <View className="flex-1">
                    <Text className="font-body-semibold text-sm text-card-foreground">{item.title}</Text>
                    <Text className="mt-0.5 text-xs text-muted-foreground">Önerilen arama</Text>
                  </View>
                  <ArrowUpLeft size={16} color={colors.muted.foreground} />
                </Pressable>
              ))}
            </Card>
          </View>
        </View>

        <View className="px-5 pt-5">
          <Card variant="default" padding="md" className="shadow-sm shadow-black/20">
            <View className="flex-row items-start gap-4">
              <IconCircle icon={<DatabaseZap size={20} color={colors.primary.DEFAULT} />} color="primary" size="lg" />
              <View className="min-w-0 flex-1">
                <Text className="font-heading text-lg text-card-foreground">
                  1.842.317 <Text className="font-body-semibold text-sm text-muted-foreground">Yargıtay kararı</Text>
                </Text>
                <Text className="mt-1 text-sm text-muted-foreground">
                  Tam metin, daire bilgisi ve bağlantılı mevzuat ile taranıyor.
                </Text>
              </View>
            </View>
            <View className="mt-4 flex-row items-center justify-between border-t border-border pt-3">
              <View className="flex-row items-center gap-2">
                <View className="h-1.5 w-1.5 rounded-full bg-success" />
                <Text className="text-xs text-muted-foreground">Arşiv güncel</Text>
              </View>
              <Text className="font-mono text-xs text-muted-foreground">Son güncelleme: 3 gün önce</Text>
            </View>
          </Card>

          <Card variant="default" padding="md" className="relative mt-5 overflow-hidden border-accent/35 bg-secondary">
            <View className="absolute -right-5 -top-6 h-28 w-28 rounded-full bg-accent/10" />
            <View className="relative flex-row gap-3">
              <IconCircle icon={<Clock3 size={20} color={colors.accent.foreground} />} color="accent" size="md" className="bg-accent" />
              <View className="min-w-0 flex-1">
                <Text className="font-heading text-sm text-secondary-foreground">Deneme süreniz: 2 gün kaldı</Text>
                <Text className="mt-1 text-xs leading-5 text-muted-foreground">
                  Sınırsız karar analizi ve gelişmiş filtrelere erişin.
                </Text>
                <Pressable
                  onPress={() => {}}
                  hitSlop={10}
                  accessibilityRole="button"
                  accessibilityLabel="Yıllık plana geç"
                  className="mt-3 flex-row items-center gap-1.5 self-start">
                  <Text className="font-body-semibold text-sm text-accent">Yıllık plana geç</Text>
                  <ArrowRight size={16} color={colors.accent.DEFAULT} />
                </Pressable>
              </View>
            </View>
          </Card>

          <View className="mt-7">
            <SectionHeader title="Son Aramalarım" action={{ label: 'Tümünü temizle', onPress: () => {} }} className="mb-3" />
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row gap-2">
                {RECENT_SEARCHES.map((term) => (
                  <Chip key={term} label={term} onPress={() => {}} />
                ))}
              </View>
            </ScrollView>
          </View>

          <View className="mt-7">
            <SectionHeader
              title="Popüler Kategoriler"
              trailing={<LayoutGrid size={18} color={colors.muted.foreground} />}
              className="mb-3"
            />
            <View className="flex-row flex-wrap gap-3">
              {CATEGORIES.map((category) => (
                <Card
                  key={category.title}
                  variant="default"
                  padding="md"
                  onPress={() => {}}
                  accessibilityLabel={`${category.title}, ${category.count}`}
                  className="relative w-[47%] min-h-[104px] overflow-hidden">
                  <View className={`absolute right-0 top-0 h-20 w-20 rounded-bl-full ${category.blobClassName}`} />
                  <IconCircle
                    icon={<category.Icon size={16} color={category.iconColor} />}
                    size="sm"
                    className={`mb-5 rounded-lg ${category.iconWrapClassName}`}
                  />
                  <Text className="font-heading text-sm text-card-foreground">{category.title}</Text>
                  <Text className="mt-1 font-mono text-2xs text-muted-foreground">{category.count}</Text>
                </Card>
              ))}
              <Card
                variant="default"
                padding="md"
                onPress={() => {}}
                accessibilityLabel={`${WIDE_CATEGORY.title}, ${WIDE_CATEGORY.count}`}
                className="w-full flex-row items-center justify-between">
                <View className="flex-row items-center gap-3">
                  <IconCircle
                    icon={<WIDE_CATEGORY.Icon size={16} color={WIDE_CATEGORY.iconColor} />}
                    size="sm"
                    className={`rounded-lg ${WIDE_CATEGORY.iconWrapClassName}`}
                  />
                  <View>
                    <Text className="font-heading text-sm text-card-foreground">{WIDE_CATEGORY.title}</Text>
                    <Text className="font-mono text-2xs text-muted-foreground">{WIDE_CATEGORY.count}</Text>
                  </View>
                </View>
                <ChevronRight size={18} color={colors.muted.foreground} />
              </Card>
            </View>
          </View>

          <Button
            label="Gelişmiş Aramaya Geç"
            variant="ghost"
            icon={<SlidersHorizontal size={18} color={colors.primary.DEFAULT} />}
            trailingIcon={<ArrowRight size={16} color={colors.primary.DEFAULT} />}
            onPress={() => {}}
            className="mt-7 w-full border-t border-border pt-5"
          />
        </View>
      </ScrollView>

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
            accessibilityLabel="Kayıtlılarım"
            hitSlop={4}
            className="min-w-[88px] items-center gap-1">
            <IconCircle icon={<Bookmark size={20} color={colors.muted.foreground} />} color="muted" size="md" className="bg-transparent" />
            <Text className="font-body-semibold text-[11px] text-muted-foreground">Kayıtlılarım</Text>
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
    </KeyboardAvoidingView>
  );
}
