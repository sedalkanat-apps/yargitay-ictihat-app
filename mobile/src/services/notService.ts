import type { Not } from '@/types/dosya';

// Basit düz metin not deposu. Bilinçli olarak dar tutulmuştur: yalnızca
// okuma ve ekleme. İleride bir AI özet/analiz özelliği eklenecekse bu,
// mevcut fonksiyonları değiştirmeden buraya eklenecek AYRI bir fonksiyon
// olur (ör. `getNotOzeti(dosyaId)`) — notların saklanma biçimi değişmez.
let MOCK_NOTLAR: Not[] = [
  {
    id: 'not-1',
    dosyaId: 'dosya-1',
    metin: 'Tahliye talebi için ihtarname tarihi kontrol edilecek.',
    olusturmaTarihi: '2026-07-03T14:00:00.000Z',
  },
];

let notSayaci = MOCK_NOTLAR.length;

export async function getNotlar(dosyaId: string): Promise<Not[]> {
  return MOCK_NOTLAR.filter((not) => not.dosyaId === dosyaId);
}

export async function notEkle(dosyaId: string, metin: string): Promise<Not> {
  notSayaci += 1;
  const yeniNot: Not = {
    id: `not-${notSayaci}`,
    dosyaId,
    metin,
    olusturmaTarihi: new Date().toISOString(),
  };
  MOCK_NOTLAR = [...MOCK_NOTLAR, yeniNot];
  return yeniNot;
}
