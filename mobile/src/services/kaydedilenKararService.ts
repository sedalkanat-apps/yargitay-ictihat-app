import type { KaydedilenKarar } from '@/types/dosya';

// Yalnızca dosya-karar ilişkisini saklar. Kararın kendisi kararRepository'den
// okunur — bkz. types/dosya.ts'teki KaydedilenKarar yorumu.
//
// Aynı kararın (karar-1) hem 'dosya-1' hem 'dosya-4' için kaydedilmiş olması
// bilinçlidir: aynı kararın birden fazla dosyaya kaydedilebildiğini gösterir.
let MOCK_KAYDEDILEN_KARARLAR: KaydedilenKarar[] = [
  { id: 'kk-1', dosyaId: 'dosya-1', kararId: 'karar-1', kaydedilmeTarihi: '2026-07-02T09:00:00.000Z' },
  { id: 'kk-2', dosyaId: 'dosya-4', kararId: 'karar-1', kaydedilmeTarihi: '2026-06-21T09:00:00.000Z' },
];

let kayitSayaci = MOCK_KAYDEDILEN_KARARLAR.length;

export async function getKaydedilenKararlar(dosyaId: string): Promise<KaydedilenKarar[]> {
  return MOCK_KAYDEDILEN_KARARLAR.filter((kayit) => kayit.dosyaId === dosyaId);
}

export async function kararKaydet(dosyaId: string, kararId: string): Promise<KaydedilenKarar> {
  kayitSayaci += 1;
  const yeniKayit: KaydedilenKarar = {
    id: `kk-${kayitSayaci}`,
    dosyaId,
    kararId,
    kaydedilmeTarihi: new Date().toISOString(),
  };
  MOCK_KAYDEDILEN_KARARLAR = [...MOCK_KAYDEDILEN_KARARLAR, yeniKayit];
  return yeniKayit;
}
