import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  ArrowLeft,
  BadgeCheck,
  Bookmark,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Copy,
  MoreHorizontal,
  Quote,
  SearchX,
  Sparkles,
} from 'lucide-react-native';
import { useState } from 'react';
import { ScrollView, Text, View, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { IconCircle } from '@/components/ui/IconCircle';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { SimilarDecisionCard } from '@/components/decisions/SimilarDecisionCard';
import { KararKaydetSheet } from '@/components/dosyalar/KararKaydetSheet';
import { useKarar } from '@/hooks/useKarar';
import { colors } from '@/theme';

// Karar kimliği (mahkeme/daire/esas/karar/tarih/hukukDali) BURADA TUTULMAZ —
// route'taki id ile kararRepository'den okunur (useKarar). Aşağıdaki içerik
// yalnızca bu ekrana özgü, kararRepository'nin kapsamı dışındaki zengin
// içeriktir (AI özeti, tam metin, ilgili kanunlar, benzer kararlar) ve
// hangi karar açılırsa açılsın örnek/demo amaçlı gösterilir.
const KARAR_DETAY_ICERIGI = {
  baslik: 'İş kazasında kusur oranı ve tazminat',
  anaHukum:
    'İş kazasının meydana gelmesinde davalı işverenin %70, davacının ise %30 oranında kusurlu olduğu kabul edilmelidir.',
  sayfaSayisi: 14,
};

const AI_OZETI_MADDELERI = [
  'İşveren, iş sağlığı ve güvenliği tedbirlerini tam olarak almadığı için %70 oranında kusurlu bulunmuştur.',
  'Davacının kendi dikkatsizliği nedeniyle %30 oranında kusuru bulunduğu kabul edilmiştir.',
  'Maddi tazminat, sürekli iş göremezlik oranı ve gerçek ücret esas alınarak hesaplanmıştır.',
  'Manevi tazminat, tarafların sosyal ve ekonomik durumu gözetilerek belirlenmiştir.',
];

const KARARIN_ONEMI = ['İş Kazası', 'Kusur Oranı', 'Maddi Tazminat', 'Manevi Tazminat'];

const TAM_METIN_PARAGRAFLARI = [
  'Dava, iş kazası nedeniyle maddi ve manevi tazminat istemine ilişkindir.',
  'Mahkemece yapılan yargılama sonucunda, davacının işyerinde yürütülen işin niteliği ve çalışma koşulları dikkate alınarak uğradığı sürekli iş göremezlik oranı belirlenmiştir.',
  'Dosya kapsamındaki bilirkişi raporu, tanık anlatımları ve iş güvenliği kayıtları birlikte değerlendirildiğinde, işverenin gerekli iş sağlığı ve güvenliği tedbirlerini tam olarak almadığı anlaşılmıştır.',
  'Bu nedenle işverenin kusur oranının %70 olarak kabulü ile davacının maddi ve manevi zararlarının karşılanmasına karar verilmesi gerekir.',
];

const ILGILI_KANUNLAR = [
  { kanun: '6098 sayılı Türk Borçlar Kanunu', madde: 'm. 49' },
  { kanun: '4857 sayılı İş Kanunu', madde: 'm. 77' },
  { kanun: '5510 sayılı Sosyal Sigortalar ve Genel Sağlık Sigortası Kanunu', madde: 'm. 21' },
];

const BENZER_KARARLAR = [
  {
    title: 'İş kazasında işverenin kusur sorumluluğu',
    daire: '21. HD',
    esasNo: '2021/9012',
    kararNo: '2022/3341',
    tarih: '18.04.2022',
    benzerlikYuzdesi: 94,
  },
  {
    title: 'Maluliyet ve maddi tazminat hesabı',
    daire: '10. HD',
    esasNo: '2020/6721',
    kararNo: '2021/5804',
    tarih: '09.11.2021',
    benzerlikYuzdesi: 88,
  },
  {
    title: 'Manevi tazminatın takdirinde ölçütler',
    daire: '21. HD',
    esasNo: '2019/4482',
    kararNo: '2020/7210',
    tarih: '16.12.2020',
    benzerlikYuzdesi: 82,
  },
];

function YukleniyorEkrani() {
  return (
    <View className="flex-1 items-center justify-center bg-background">
      <StatusBar style="light" />
      <Text className="text-sm text-muted-foreground">Yükleniyor…</Text>
    </View>
  );
}

function KararBulunamadiEkrani({ onGeriDon }: { onGeriDon: () => void }) {
  return (
    <View className="flex-1 items-center justify-center gap-3 bg-background px-8">
      <StatusBar style="light" />
      <IconCircle icon={<SearchX size={22} color={colors.muted.foreground} />} color="muted" size="lg" />
      <Text className="text-center font-heading text-base text-foreground">Karar bulunamadı</Text>
      <Text className="text-center text-sm text-muted-foreground">
        Aradığınız karara ulaşılamadı. Kaldırılmış ya da hatalı bir bağlantı olabilir.
      </Text>
      <Button label="Geri Dön" variant="secondary" onPress={onGeriDon} />
    </View>
  );
}

export default function KararDetayScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const kararId = typeof id === 'string' ? id : '';

  const [isFullTextExpanded, setIsFullTextExpanded] = useState(false);
  const [sheetAcik, setSheetAcik] = useState(false);

  const { data: kararOzeti, isLoading, isError } = useKarar(kararId);

  const visibleParagraflar = isFullTextExpanded ? TAM_METIN_PARAGRAFLARI : TAM_METIN_PARAGRAFLARI.slice(0, 2);

  if (!kararId) {
    return <KararBulunamadiEkrani onGeriDon={() => router.back()} />;
  }

  if (isLoading) {
    return <YukleniyorEkrani />;
  }

  if (isError || !kararOzeti) {
    return <KararBulunamadiEkrani onGeriDon={() => router.back()} />;
  }

  return (
    <View className="flex-1 bg-background">
      <StatusBar style="light" />

      <View style={{ paddingTop: insets.top + 8 }} className="border-b border-border bg-background px-5 pb-3">
        <View className="flex-row items-center gap-3">
          {/* Geri butonu */}
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Geri dön"
            hitSlop={8}
            className="h-9 w-9 items-center justify-center rounded-theme border border-border bg-card">
            <ArrowLeft size={18} color={colors.muted.foreground} />
          </Pressable>
          <View className="min-w-0 flex-1">
            <Text className="text-2xs font-body-bold uppercase tracking-wider text-primary">Karar Detayı</Text>
            <Text numberOfLines={1} className="mt-0.5 font-heading text-sm text-foreground">
              {kararOzeti.daire}
            </Text>
          </View>
          <Pressable
            onPress={() => {}}
            accessibilityRole="button"
            accessibilityLabel="Diğer seçenekler"
            hitSlop={8}
            className="h-9 w-9 items-center justify-center rounded-theme border border-border bg-card">
            <MoreHorizontal size={18} color={colors.muted.foreground} />
          </Pressable>
        </View>
        <View className="mt-3 flex-row items-center justify-between">
          <Text className="font-mono text-2xs font-semibold text-muted-foreground">{kararOzeti.hukukDali}</Text>
          <View className="flex-row items-center gap-1.5">
            <BadgeCheck size={14} color={colors.success.DEFAULT} />
            <Text className="text-2xs font-body-semibold text-success">Güncel içtihat</Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: insets.bottom + 24 }}>
        {/* Karar kimliği */}
        <View className="mb-6">
          <Text className="text-xs font-body-semibold text-primary">
            {kararOzeti.mahkeme} {kararOzeti.daire}
          </Text>
          <Text className="mt-2 font-heading text-xl text-foreground">{KARAR_DETAY_ICERIGI.baslik}</Text>
          <View className="mt-4 flex-row items-center justify-between rounded-theme border border-border bg-card px-3 py-3">
            <View>
              <Text className="text-2xs font-body-bold uppercase tracking-wider text-muted-foreground">Esas</Text>
              <Text className="mt-1 font-mono text-sm font-body-semibold text-card-foreground">{kararOzeti.esasNo}</Text>
            </View>
            <View>
              <Text className="text-2xs font-body-bold uppercase tracking-wider text-muted-foreground">Karar</Text>
              <Text className="mt-1 font-mono text-sm font-body-semibold text-card-foreground">{kararOzeti.kararNo}</Text>
            </View>
            <View>
              <Text className="text-2xs font-body-bold uppercase tracking-wider text-muted-foreground">Tarih</Text>
              <Text className="mt-1 font-mono text-sm font-body-semibold text-card-foreground">{kararOzeti.tarih}</Text>
            </View>
          </View>
        </View>

        {/* AI Özeti */}
        <Card variant="highlighted" padding="lg" className="mb-2">
          <View className="mb-4 flex-row items-center justify-between">
            <Badge label="✨ AI Özeti" variant="primary" icon={<Sparkles size={12} color={colors.primary.DEFAULT} />} />
          </View>
          <View className="gap-3">
            {AI_OZETI_MADDELERI.map((madde) => (
              <View key={madde} className="flex-row items-start gap-2.5">
                <View className="mt-2 h-1.5 w-1.5 rounded-full bg-primary" />
                <Text className="flex-1 text-sm leading-5 text-card-foreground">{madde}</Text>
              </View>
            ))}
          </View>
          <View className="mt-4 flex-row items-start gap-2 border-t border-border pt-3">
            <Text className="text-2xs leading-4 text-muted-foreground">
              Özet, kararın tam metni yerine geçmez. Yapay zekâ hukuki tavsiye vermez, yalnızca bilgi özetler.
            </Text>
          </View>
        </Card>
        <Text className="mb-6 mt-1.5 text-2xs leading-3 text-muted-foreground">
          AI özeti yalnızca bilgilendirme amaçlıdır.
        </Text>

        {/* Kararın Önemi */}
        <View className="mb-6">
          <SectionHeader title="Kararın Önemi" className="mb-3" />
          <View className="flex-row flex-wrap gap-2">
            {KARARIN_ONEMI.map((etiket) => (
              <Chip key={etiket} label={etiket} selected />
            ))}
          </View>
        </View>

        {/* İlgili Kanunlar */}
        <View className="mb-6">
          <SectionHeader title="İlgili Kanunlar" className="mb-3" />
          <View className="gap-2.5">
            {ILGILI_KANUNLAR.map((kanun) => (
              <View
                key={kanun.kanun}
                className="flex-row items-center gap-3 rounded-theme border border-border bg-card px-4 py-3">
                <IconCircle icon={<BookOpen size={16} color={colors.primary.DEFAULT} />} color="primary" size="sm" />
                <View className="min-w-0 flex-1">
                  <Text numberOfLines={1} className="text-sm font-body-semibold text-card-foreground">
                    {kanun.kanun}
                  </Text>
                  <Text className="mt-0.5 font-mono text-2xs text-muted-foreground">{kanun.madde}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Ana Hüküm */}
        <View className="mb-6 rounded-theme border border-l-4 border-accent bg-secondary p-4">
          <Quote size={18} color={colors.accent.DEFAULT} />
          <Text className="mt-2 text-sm italic leading-6 text-secondary-foreground">{KARAR_DETAY_ICERIGI.anaHukum}</Text>
        </View>

        {/* Tam Karar Metni */}
        <View className="mb-6 overflow-hidden rounded-theme border border-border bg-card">
          <View className="flex-row items-center justify-between border-b border-border px-4 py-4">
            <View>
              <Text className="text-2xs font-body-bold uppercase tracking-wider text-primary">Tam metin</Text>
              <Text className="mt-1 font-heading text-base text-card-foreground">Karar Metni</Text>
            </View>
            <Pressable
              onPress={() => setIsFullTextExpanded((prev) => !prev)}
              accessibilityRole="button"
              accessibilityLabel={isFullTextExpanded ? 'Metni daralt' : 'Metni genişlet'}
              hitSlop={8}
              className="h-9 w-9 items-center justify-center rounded-lg bg-muted">
              {isFullTextExpanded ? (
                <ChevronUp size={18} color={colors.muted.foreground} />
              ) : (
                <ChevronDown size={18} color={colors.muted.foreground} />
              )}
            </Pressable>
          </View>
          <View className="gap-4 px-4 py-5">
            {visibleParagraflar.map((paragraf) => (
              <Text key={paragraf} className="text-sm leading-6 text-muted-foreground">
                {paragraf}
              </Text>
            ))}
            <View className="flex-row items-center justify-between border-t border-border pt-4">
              <Text className="font-mono text-2xs text-muted-foreground">
                Karar metni · {KARAR_DETAY_ICERIGI.sayfaSayisi} sayfa
              </Text>
              <Pressable
                onPress={() => setIsFullTextExpanded((prev) => !prev)}
                accessibilityRole="button"
                className="flex-row items-center gap-1.5">
                <Text className="font-body-bold text-xs text-primary">
                  {isFullTextExpanded ? 'Daralt' : 'Tümünü göster'}
                </Text>
                {isFullTextExpanded ? (
                  <ChevronUp size={14} color={colors.primary.DEFAULT} />
                ) : (
                  <ChevronDown size={14} color={colors.primary.DEFAULT} />
                )}
              </Pressable>
            </View>
          </View>
        </View>

        {/* Benzer Kararlar */}
        <View className="mb-2">
          <SectionHeader title="Benzer Kararlar" className="mb-3" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row gap-3">
              {BENZER_KARARLAR.map((karar) => (
                <SimilarDecisionCard key={karar.title} {...karar} onPress={() => {}} />
              ))}
            </View>
          </ScrollView>
        </View>
      </ScrollView>

      {/* Dosyalarıma Kaydet + Alıntıyı Kopyala */}
      <View
        style={{ paddingBottom: insets.bottom + 12 }}
        className="border-t border-border bg-background/95 px-5 pt-3">
        <View className="flex-row items-center gap-2">
          <Button
            label="Dosyalarıma Kaydet"
            icon={<Bookmark size={16} color={colors.primary.foreground} />}
            onPress={() => setSheetAcik(true)}
            className="flex-1"
          />
          <Button
            label="Alıntıyı Kopyala"
            variant="secondary"
            icon={<Copy size={14} color={colors.muted.foreground} />}
            onPress={() => {}}
          />
        </View>
      </View>

      <KararKaydetSheet
        gorunur={sheetAcik}
        kararId={kararOzeti.id}
        onKapat={() => setSheetAcik(false)}
        onKaydedildi={(dosyaId) => {
          setSheetAcik(false);
          router.push({ pathname: '/dosya-detay/[id]', params: { id: dosyaId } });
        }}
      />
    </View>
  );
}
