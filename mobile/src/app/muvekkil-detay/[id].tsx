import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AlertTriangle, ArrowLeft, FolderPlus, Folders } from 'lucide-react-native';
import { type ReactNode } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, type ButtonVariant } from '@/components/ui/Button';
import { IconCircle, type IconCircleColor } from '@/components/ui/IconCircle';
import { DosyaCard } from '@/components/dosyalar/DosyaCard';
import { useDosyalar } from '@/hooks/useDosyalar';
import { useMuvekkiller } from '@/hooks/useMuvekkiller';
import { colors } from '@/theme';

function DosyaCardSkeleton() {
  return (
    <View className="mb-3 rounded-theme border border-border bg-card p-4">
      <View className="h-4 w-40 rounded-full bg-muted" />
      <View className="mt-3 h-3 w-24 rounded-full bg-muted" />
    </View>
  );
}

interface DurumMesajiProps {
  ikon: typeof AlertTriangle;
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

export default function MuvekkilDetayScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const muvekkilId = typeof id === 'string' ? id : '';
  const gecerliId = muvekkilId.trim().length > 0;

  const { data: muvekkiller } = useMuvekkiller('');
  const muvekkil = muvekkiller?.find((item) => item.muvekkil.id === muvekkilId)?.muvekkil;

  const { data: dosyalar, isLoading, isError, refetch } = useDosyalar(muvekkilId);

  function icerigiOlustur(): ReactNode {
    if (isLoading) {
      return (
        <View style={{ paddingHorizontal: 20, paddingTop: 16 }}>
          {Array.from({ length: 3 }).map((_, index) => (
            <DosyaCardSkeleton key={index} />
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
          aciklama="Dosya listesi yüklenemedi. Lütfen tekrar deneyin."
          aksiyonEtiket="Tekrar Dene"
          onAksiyon={() => refetch()}
        />
      );
    }

    if (!dosyalar || dosyalar.length === 0) {
      return (
        <DurumMesaji
          ikon={Folders}
          ikonRengi="muted"
          baslik="Henüz dosya yok"
          aciklama="Bu müvekkil için ilk dosyayı oluşturarak kararları düzenlemeye başlayın."
          aksiyonEtiket="Yeni Dosya"
          onAksiyon={() => router.push({ pathname: '/yeni-dosya/[muvekkilId]', params: { muvekkilId } })}
        />
      );
    }

    return (
      <FlatList
        data={dosyalar}
        keyExtractor={(item) => item.dosya.id}
        renderItem={({ item }) => (
          <DosyaCard
            item={item}
            onPress={() => router.push({ pathname: '/dosya-detay/[id]', params: { id: item.dosya.id } })}
          />
        )}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: insets.bottom + 24 }}
      />
    );
  }

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
        <Text accessibilityRole="header" numberOfLines={1} className="min-w-0 flex-1 font-heading text-lg text-foreground">
          {muvekkil?.ad ?? 'Müvekkil Detayı'}
        </Text>
        {gecerliId ? (
          <Pressable
            onPress={() => router.push({ pathname: '/yeni-dosya/[muvekkilId]', params: { muvekkilId } })}
            accessibilityRole="button"
            accessibilityLabel="Yeni Dosya"
            accessibilityHint="Yeni dosya oluşturma ekranını açar"
            hitSlop={8}
            className="h-11 w-11 items-center justify-center rounded-theme bg-primary">
            <FolderPlus size={18} color={colors.primary.foreground} />
          </Pressable>
        ) : null}
      </View>

      <View className="flex-1">
        {gecerliId ? (
          icerigiOlustur()
        ) : (
          <Text className="flex-1 px-8 pt-10 text-center text-sm text-muted-foreground">Müvekkil bulunamadı.</Text>
        )}
      </View>
    </View>
  );
}
