import { useQuery } from '@tanstack/react-query';

import { getDosyalarByMuvekkilId } from '@/services/dosyaService';
import { getMuvekkilKayitlari, type MuvekkilSunucuKaydi } from '@/services/muvekkilService';
import type { MuvekkilListeItem } from '@/types/muvekkil';

// Cihaza özel etkileşim verisi — sunucudan gelmez. İleride yerel depolamadan
// (ör. AsyncStorage) okunacak; bugün mock bir arama tablosu ile temsil edilir.
// `muvekkilService.ts`'e KARIŞTIRILMAZ çünkü Supabase'e geçişte bu alanın
// yanlışlıkla `clients` tablosuna taşınmasını önlemek amaçlanır.
const YEREL_SON_KULLANIM_TARIHLERI: Record<string, string> = {
  '1': '2026-08-05T14:20:00.000Z',
  '2': '2026-08-04T09:10:00.000Z',
  '3': '2026-08-01T11:00:00.000Z',
  '4': '2026-07-28T16:45:00.000Z',
};

export function getYerelSonKullanimTarihi(muvekkilId: string): string | null {
  return YEREL_SON_KULLANIM_TARIHLERI[muvekkilId] ?? null;
}

// Dosya sayısı artık gerçek Dosya kayıtlarından türetilir (dosyaService),
// muvekkilService'te ayrıca bir sayı tutulmaz — bkz. muvekkilService.ts.
export async function sunucuVeYerelVeriyiBirlestir(kayitlar: MuvekkilSunucuKaydi[]): Promise<MuvekkilListeItem[]> {
  return Promise.all(
    kayitlar.map(async (kayit) => ({
      muvekkil: kayit.muvekkil,
      dosyaSayisi: (await getDosyalarByMuvekkilId(kayit.muvekkil.id)).length,
      sonKullanilmaTarihi: getYerelSonKullanimTarihi(kayit.muvekkil.id),
    }))
  );
}

export function sonKullanilmaSirasinaGoreSirala(liste: MuvekkilListeItem[]): MuvekkilListeItem[] {
  return [...liste].sort((a, b) => {
    if (a.sonKullanilmaTarihi === null && b.sonKullanilmaTarihi === null) return 0;
    if (a.sonKullanilmaTarihi === null) return 1;
    if (b.sonKullanilmaTarihi === null) return -1;
    return a.sonKullanilmaTarihi < b.sonKullanilmaTarihi ? 1 : -1;
  });
}

const BIR_DAKIKA = 60 * 1000;

export function useMuvekkiller(aramaSorgusu: string) {
  return useQuery({
    queryKey: ['muvekkiller', aramaSorgusu],
    queryFn: async (): Promise<MuvekkilListeItem[]> => {
      const kayitlar = await getMuvekkilKayitlari(aramaSorgusu);
      return sonKullanilmaSirasinaGoreSirala(await sunucuVeYerelVeriyiBirlestir(kayitlar));
    },
    staleTime: BIR_DAKIKA,
  });
}
