import type { Dosya } from '@/types/dosya';

// Kullanıcının kendi verisi — ileride Supabase'de bir `dosyalar` tablosuna
// taşınacak sıradan bir mock repository. Karar verisinden farklı olarak
// üçüncü taraf bir kaynağa (Yargıtay) bağlı değildir, bu yüzden ayrı bir
// repository sözleşmesine ihtiyaç duymaz — bkz. repositories/kararRepository.ts.
//
// Seed verisi bilinçli olarak 0 / 1 / 2+ dosyalı müvekkil senaryolarının
// hepsini içerir (müvekkil '5': 0 dosya, '2' ve '4' ve '6': 1 dosya,
// '1' ve '3': 2+ dosya) — KararKaydetSheet'teki otomatik seçim mantığının
// her dalını gerçek veriyle sınamak için.
let MOCK_DOSYALAR: Dosya[] = [
  { id: 'dosya-1', muvekkilId: '1', ad: 'Fikirtepe Daire 322 Tahliye', olusturmaTarihi: '2026-07-01T10:00:00.000Z' },
  { id: 'dosya-2', muvekkilId: '1', ad: '2026/3266 İcra Takibi', olusturmaTarihi: '2026-07-15T10:00:00.000Z' },
  { id: 'dosya-3', muvekkilId: '2', ad: 'Kira Tespiti', olusturmaTarihi: '2026-07-10T10:00:00.000Z' },
  { id: 'dosya-4', muvekkilId: '3', ad: 'İşçilik Alacağı', olusturmaTarihi: '2026-06-20T10:00:00.000Z' },
  { id: 'dosya-5', muvekkilId: '3', ad: 'Tahliye Davası', olusturmaTarihi: '2026-06-25T10:00:00.000Z' },
  { id: 'dosya-6', muvekkilId: '3', ad: 'Miras', olusturmaTarihi: '2026-07-05T10:00:00.000Z' },
  { id: 'dosya-7', muvekkilId: '4', ad: 'Boşanma', olusturmaTarihi: '2026-07-20T10:00:00.000Z' },
  { id: 'dosya-8', muvekkilId: '6', ad: 'Trafik Kazası Tazminat', olusturmaTarihi: '2026-07-25T10:00:00.000Z' },
];

let dosyaSayaci = MOCK_DOSYALAR.length;

export async function getDosyalarByMuvekkilId(muvekkilId: string): Promise<Dosya[]> {
  return MOCK_DOSYALAR.filter((dosya) => dosya.muvekkilId === muvekkilId);
}

export async function getDosyaById(id: string): Promise<Dosya | null> {
  return MOCK_DOSYALAR.find((dosya) => dosya.id === id) ?? null;
}

export async function createDosya(muvekkilId: string, ad: string): Promise<Dosya> {
  dosyaSayaci += 1;
  const yeniDosya: Dosya = {
    id: `dosya-${dosyaSayaci}`,
    muvekkilId,
    ad,
    olusturmaTarihi: new Date().toISOString(),
  };
  MOCK_DOSYALAR = [...MOCK_DOSYALAR, yeniDosya];
  return yeniDosya;
}
