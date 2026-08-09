import type { Muvekkil } from '@/types/muvekkil';

export interface MuvekkilSunucuKaydi {
  muvekkil: Muvekkil;
}

// Yalnızca sunucudan gelecek veri: kimlik, ad, tür.
// Dosya sayısı BURADA YOK — dosyaService'teki gerçek Dosya kayıtlarından
// türetilir (bkz. useMuvekkiller.ts), aksi halde iki ayrı "dosya sayısı"
// kaynağı birbiriyle tutarsız düşebilir.
// "Son kullanılma" gibi cihaza özel etkileşim verisi de burada YOK — bkz. useMuvekkiller.ts.
const MOCK_MUVEKKIL_KAYITLARI: MuvekkilSunucuKaydi[] = [
  { muvekkil: { id: '1', ad: 'Ahmet Yılmaz', tur: 'gercek' } },
  { muvekkil: { id: '2', ad: 'Zeynep Kaya', tur: 'gercek' } },
  { muvekkil: { id: '3', ad: 'Fikirtepe İnşaat A.Ş.', tur: 'tuzel' } },
  { muvekkil: { id: '4', ad: 'Elif Demir', tur: 'gercek' } },
  { muvekkil: { id: '5', ad: 'İstanbul Lojistik Ltd. Şti.', tur: 'tuzel' } },
  { muvekkil: { id: '6', ad: 'Mehmet Öztürk', tur: 'gercek' } },
];

// Türkçe'ye özgü İ/I - i/ı dönüşümünü elle uygular; Hermes'in Intl/ICU desteğine bağımlı kalmaz.
export function turkceKucult(metin: string): string {
  return metin.replace(/İ/g, 'i').replace(/I/g, 'ı').toLowerCase();
}

export function turkceIcerir(hedef: string, sorgu: string): boolean {
  return turkceKucult(hedef).includes(turkceKucult(sorgu));
}

export async function getMuvekkilKayitlari(aramaSorgusu = ''): Promise<MuvekkilSunucuKaydi[]> {
  const sorgu = aramaSorgusu.trim();
  return sorgu
    ? MOCK_MUVEKKIL_KAYITLARI.filter((kayit) => turkceIcerir(kayit.muvekkil.ad, sorgu))
    : MOCK_MUVEKKIL_KAYITLARI;
}
