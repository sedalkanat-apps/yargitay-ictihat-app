import { AlertTriangle, Bookmark, ChevronRight, FolderPlus, X } from 'lucide-react-native';
import { useState, type ReactNode } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Input } from '@/components/ui/Input';
import { useDosyaOlustur, useDosyalar } from '@/hooks/useDosyalar';
import { useKararKaydet } from '@/hooks/useKaydedilenKararlar';
import { useMuvekkiller } from '@/hooks/useMuvekkiller';
import { colors } from '@/theme';

interface KararKaydetSheetProps {
  gorunur: boolean;
  kararId: string;
  onKapat: () => void;
  onKaydedildi: (dosyaId: string) => void;
}

const DOSYA_ADI_ONERILERI = ['Kira Tespiti', 'Tahliye Davası', 'İşçilik Alacağı', 'Miras', 'Boşanma'];

export function KararKaydetSheet({ gorunur, kararId, onKapat, onKaydedildi }: KararKaydetSheetProps) {
  const [secilenMuvekkilId, setSecilenMuvekkilId] = useState<string | null>(null);
  const [secilenDosyaId, setSecilenDosyaId] = useState<string | null>(null);
  const [yeniDosyaModu, setYeniDosyaModu] = useState(false);
  const [yeniDosyaAdi, setYeniDosyaAdi] = useState('');

  // Sheet her açılışta baştan başlar. Bir efekt yerine render sırasında
  // state karşılaştırması yapılır (React'in "prop değiştiğinde state'i
  // sıfırla" deseni) — bu, gereksiz bir ekstra render turunu önler.
  const [oncekiGorunur, setOncekiGorunur] = useState(gorunur);
  if (gorunur !== oncekiGorunur) {
    setOncekiGorunur(gorunur);
    if (gorunur) {
      setSecilenMuvekkilId(null);
      setSecilenDosyaId(null);
      setYeniDosyaModu(false);
      setYeniDosyaAdi('');
    }
  }

  const muvekkilQuery = useMuvekkiller('');
  const muvekkiller = muvekkilQuery.data;
  const otomatikMuvekkilId = muvekkiller && muvekkiller.length === 1 ? muvekkiller[0].muvekkil.id : null;
  const etkinMuvekkilId = secilenMuvekkilId ?? otomatikMuvekkilId;

  const dosyaQuery = useDosyalar(etkinMuvekkilId ?? '');
  const dosyalar = dosyaQuery.data;
  const otomatikDosyaId = dosyalar && dosyalar.length === 1 ? dosyalar[0].dosya.id : null;
  const etkinDosyaId = secilenDosyaId ?? otomatikDosyaId;

  const dosyaOlusturMutation = useDosyaOlustur();
  const kararKaydetMutation = useKararKaydet();
  const kaydediliyor = dosyaOlusturMutation.isPending || kararKaydetMutation.isPending;

  const secilenMuvekkil = muvekkiller?.find((item) => item.muvekkil.id === etkinMuvekkilId)?.muvekkil;
  const secilenDosya = dosyalar?.find((item) => item.dosya.id === etkinDosyaId)?.dosya;

  async function handleKaydet(dosyaId: string) {
    await kararKaydetMutation.mutateAsync({ dosyaId, kararId });
    onKaydedildi(dosyaId);
  }

  async function handleOlusturVeKaydet() {
    if (!etkinMuvekkilId || !yeniDosyaAdi.trim()) return;
    const yeniDosya = await dosyaOlusturMutation.mutateAsync({ muvekkilId: etkinMuvekkilId, ad: yeniDosyaAdi.trim() });
    await kararKaydetMutation.mutateAsync({ dosyaId: yeniDosya.id, kararId });
    onKaydedildi(yeniDosya.id);
  }

  function icerigiOlustur(): ReactNode {
    if (muvekkilQuery.isLoading) {
      return <Text className="px-1 py-6 text-center text-sm text-muted-foreground">Müvekkiller yükleniyor…</Text>;
    }

    if (muvekkilQuery.isError) {
      return (
        <View className="items-center gap-3 px-1 py-6">
          <AlertTriangle size={20} color={colors.destructive.DEFAULT} />
          <Text className="text-center text-sm text-muted-foreground">Müvekkil listesi yüklenemedi.</Text>
          <Button label="Tekrar Dene" variant="secondary" onPress={() => muvekkilQuery.refetch()} />
        </View>
      );
    }

    if (!muvekkiller || muvekkiller.length === 0) {
      return (
        <View className="items-center gap-3 px-1 py-6">
          <Text className="text-center text-sm text-muted-foreground">
            Karar kaydedebilmek için önce bir müvekkil eklemelisiniz.
          </Text>
        </View>
      );
    }

    if (!etkinMuvekkilId) {
      return (
        <View>
          <Text className="mb-3 font-heading text-base text-foreground">Müvekkil Seçin</Text>
          {muvekkiller.map((item) => (
            <Pressable
              key={item.muvekkil.id}
              onPress={() => setSecilenMuvekkilId(item.muvekkil.id)}
              accessibilityRole="button"
              accessibilityLabel={item.muvekkil.ad}
              className="mb-2 flex-row items-center justify-between rounded-theme border border-border bg-card px-4 py-3.5">
              <Text className="font-body-semibold text-sm text-card-foreground">{item.muvekkil.ad}</Text>
              <ChevronRight size={16} color={colors.muted.foreground} />
            </Pressable>
          ))}
        </View>
      );
    }

    if (dosyaQuery.isLoading) {
      return <Text className="px-1 py-6 text-center text-sm text-muted-foreground">Dosyalar yükleniyor…</Text>;
    }

    if (dosyaQuery.isError) {
      return (
        <View className="items-center gap-3 px-1 py-6">
          <AlertTriangle size={20} color={colors.destructive.DEFAULT} />
          <Text className="text-center text-sm text-muted-foreground">Dosyalar yüklenemedi.</Text>
          <Button label="Tekrar Dene" variant="secondary" onPress={() => dosyaQuery.refetch()} />
        </View>
      );
    }

    if (yeniDosyaModu || (dosyalar && dosyalar.length === 0)) {
      return (
        <View>
          <View className="mb-3 flex-row items-center justify-between">
            <Text className="font-heading text-base text-foreground">Yeni Dosya</Text>
            {dosyalar && dosyalar.length > 0 ? (
              <Pressable onPress={() => setYeniDosyaModu(false)} hitSlop={8} accessibilityRole="button" accessibilityLabel="Dosya listesine dön">
                <Text className="text-xs font-body-semibold text-primary">Listeden Seç</Text>
              </Pressable>
            ) : null}
          </View>
          <Input
            value={yeniDosyaAdi}
            onChangeText={setYeniDosyaAdi}
            placeholder="Dosya adı"
            accessibilityLabel="Yeni dosya adı"
            className="mb-3"
          />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
            <View className="flex-row gap-2">
              {DOSYA_ADI_ONERILERI.map((oneri) => (
                <Chip key={oneri} label={oneri} onPress={() => setYeniDosyaAdi(oneri)} />
              ))}
            </View>
          </ScrollView>
          <Button
            label="Oluştur ve Kaydet"
            icon={<Bookmark size={16} color={colors.primary.foreground} />}
            onPress={handleOlusturVeKaydet}
            disabled={!yeniDosyaAdi.trim() || kaydediliyor}
            className="w-full"
          />
        </View>
      );
    }

    if (!etkinDosyaId) {
      return (
        <View>
          <Text className="mb-3 font-heading text-base text-foreground">Dosya Seçin</Text>
          {(dosyalar ?? []).map((item) => (
            <Pressable
              key={item.dosya.id}
              onPress={() => setSecilenDosyaId(item.dosya.id)}
              accessibilityRole="button"
              accessibilityLabel={item.dosya.ad}
              className="mb-2 flex-row items-center justify-between rounded-theme border border-border bg-card px-4 py-3.5">
              <Text className="font-body-semibold text-sm text-card-foreground">{item.dosya.ad}</Text>
              <ChevronRight size={16} color={colors.muted.foreground} />
            </Pressable>
          ))}
          <Pressable
            onPress={() => setYeniDosyaModu(true)}
            accessibilityRole="button"
            accessibilityLabel="Yeni dosya oluştur"
            className="mt-1 flex-row items-center gap-2 rounded-theme border border-dashed border-primary/50 px-4 py-3.5">
            <FolderPlus size={16} color={colors.primary.DEFAULT} />
            <Text className="font-body-semibold text-sm text-primary">Yeni Dosya</Text>
          </Pressable>
        </View>
      );
    }

    return (
      <View>
        <Text className="mb-1 text-xs text-muted-foreground">Kararı şu dosyaya kaydedeceksiniz:</Text>
        <View className="mb-4 rounded-theme border border-border bg-card px-4 py-3.5">
          <Text className="text-xs text-muted-foreground">{secilenMuvekkil?.ad}</Text>
          <Text className="mt-0.5 font-heading text-base text-card-foreground">{secilenDosya?.ad}</Text>
        </View>
        <Button
          label="Kaydet"
          icon={<Bookmark size={16} color={colors.primary.foreground} />}
          onPress={() => handleKaydet(etkinDosyaId)}
          disabled={kaydediliyor}
          className="w-full"
        />
      </View>
    );
  }

  return (
    <Modal visible={gorunur} transparent animationType="slide" onRequestClose={onKapat}>
      <View className="flex-1 justify-end">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Kapat"
          className="absolute inset-0 bg-black/50"
          onPress={onKapat}
        />
        <View
          style={{ maxHeight: '80%' }}
          className="rounded-t-theme border-t border-border bg-background px-5 pb-8 pt-4">
          <View className="mb-4 flex-row items-center justify-between">
            <Text accessibilityRole="header" className="font-heading text-lg text-foreground">
              Dosyalarıma Kaydet
            </Text>
            <Pressable
              onPress={onKapat}
              accessibilityRole="button"
              accessibilityLabel="Kapat"
              hitSlop={8}
              className="h-9 w-9 items-center justify-center rounded-theme border border-border bg-card">
              <X size={16} color={colors.muted.foreground} />
            </Pressable>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>{icerigiOlustur()}</ScrollView>
        </View>
      </View>
    </Modal>
  );
}
