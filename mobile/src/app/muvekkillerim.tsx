import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AlertTriangle, Search, UserRoundPlus, Users, type LucideIcon } from 'lucide-react-native';
import { useEffect, useState, type ReactNode } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, type ButtonVariant } from '@/components/ui/Button';
import { IconCircle, type IconCircleColor } from '@/components/ui/IconCircle';
import { Input } from '@/components/ui/Input';
import { CustomTabBar } from '@/components/layout/CustomTabBar';
import { MuvekkilCard } from '@/components/muvekkiller/MuvekkilCard';
import { useMuvekkiller } from '@/hooks/useMuvekkiller';
import { colors } from '@/theme';

const ARAMA_DEBOUNCE_MS = 300;

function MuvekkilCardSkeleton() {
  return (
    <View className="mb-3 rounded-theme border border-border bg-card p-4">
      <View className="h-4 w-40 rounded-full bg-muted" />
      <View className="mt-3 flex-row gap-2">
        <View className="h-5 w-20 rounded-full bg-muted" />
        <View className="h-3 w-16 rounded-full bg-muted" />
      </View>
    </View>
  );
}

interface DurumMesajiProps {
  ikon: LucideIcon;
  ikonRengi: IconCircleColor;
  baslik: string;
  aciklama: string;
  aksiyonEtiket: string;
  aksiyonVaryant?: ButtonVariant;
  onAksiyon: () => void;
}

function DurumMesaji({ ikon: Ikon, ikonRengi, baslik, aciklama, aksiyonEtiket, aksiyonVaryant, onAksiyon }: DurumMesajiProps) {
  return (
    <View accessibilityRole="alert" className="flex-1 items-center justify-center gap-3 px-8">
      <IconCircle icon={<Ikon size={22} color={ikonRengi === 'destructive' ? colors.destructive.DEFAULT : colors.muted.foreground} />} color={ikonRengi} size="lg" />
      <Text className="text-center font-heading text-base text-foreground">{baslik}</Text>
      <Text className="text-center text-sm text-muted-foreground">{aciklama}</Text>
      <Button label={aksiyonEtiket} variant={aksiyonVaryant ?? 'primary'} onPress={onAksiyon} />
    </View>
  );
}

export default function MuvekkillerimScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [aramaSorgusu, setAramaSorgusu] = useState('');
  const [debounceliSorgu, setDebounceliSorgu] = useState('');

  useEffect(() => {
    const zamanlayici = setTimeout(() => setDebounceliSorgu(aramaSorgusu), ARAMA_DEBOUNCE_MS);
    return () => clearTimeout(zamanlayici);
  }, [aramaSorgusu]);

  const { data, isLoading, isError, refetch } = useMuvekkiller(debounceliSorgu);
  const aramaAktif = debounceliSorgu.trim().length > 0;

  function icerigiOlustur(): ReactNode {
    if (isLoading) {
      return (
        <View style={{ paddingHorizontal: 20, paddingTop: 16 }}>
          {Array.from({ length: 4 }).map((_, index) => (
            <MuvekkilCardSkeleton key={index} />
          ))}
        </View>
      );
    }

    if (isError) {
      return (
        <DurumMesaji
          ikon={AlertTriangle}
          ikonRengi="destructive"
          baslik="Bir şeyler ters gitti"
          aciklama="Müvekkil listesi yüklenemedi. Lütfen tekrar deneyin."
          aksiyonEtiket="Tekrar Dene"
          onAksiyon={() => refetch()}
        />
      );
    }

    if (!data || data.length === 0) {
      if (aramaAktif) {
        return (
          <DurumMesaji
            ikon={Search}
            ikonRengi="muted"
            baslik="Sonuç bulunamadı"
            aciklama={`"${debounceliSorgu}" ile eşleşen müvekkil bulunamadı.`}
            aksiyonEtiket="Aramayı Temizle"
            aksiyonVaryant="secondary"
            onAksiyon={() => setAramaSorgusu('')}
          />
        );
      }
      return (
        <DurumMesaji
          ikon={Users}
          ikonRengi="muted"
          baslik="Henüz müvekkiliniz yok"
          aciklama="İlk müvekkilinizi ekleyerek dosyalarınızı düzenlemeye başlayın."
          aksiyonEtiket="Yeni Müvekkil"
          onAksiyon={() => router.push('/yeni-muvekkil')}
        />
      );
    }

    return (
      <FlatList
        data={data}
        keyExtractor={(item) => item.muvekkil.id}
        renderItem={({ item }) => (
          <MuvekkilCard
            item={item}
            onPress={() => router.push({ pathname: '/muvekkil-detay/[id]', params: { id: item.muvekkil.id } })}
          />
        )}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: insets.bottom + 96 }}
      />
    );
  }

  return (
    <View className="flex-1 bg-background">
      <StatusBar style="light" />

      <View style={{ paddingTop: insets.top + 8 }} className="border-b border-border px-5 pb-3">
        <View className="mb-3 flex-row items-center justify-between">
          <Text className="font-heading text-2xl text-foreground">Müvekkillerim</Text>
          <Pressable
            onPress={() => router.push('/yeni-muvekkil')}
            accessibilityRole="button"
            accessibilityLabel="Yeni Müvekkil"
            accessibilityHint="Yeni müvekkil ekleme ekranını açar"
            hitSlop={8}
            className="h-11 w-11 items-center justify-center rounded-theme bg-primary">
            <UserRoundPlus size={18} color={colors.primary.foreground} />
          </Pressable>
        </View>
        <Input
          value={aramaSorgusu}
          onChangeText={setAramaSorgusu}
          placeholder="Müvekkil ara"
          accessibilityLabel="Müvekkil arama kutusu"
        />
      </View>

      <View className="flex-1">{icerigiOlustur()}</View>

      <CustomTabBar aktifSekme="dosyalarim" altBosluk={insets.bottom} />
    </View>
  );
}
