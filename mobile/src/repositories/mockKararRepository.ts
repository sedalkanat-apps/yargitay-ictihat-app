import type { KararRepository } from '@/repositories/kararRepository';
import type { KararOzet } from '@/types/karar';

// Tek mock veri listesi. Uygulamadaki HİÇBİR ekran kendi karar kopyasını
// tutmaz — Ara, Sonuçlar ve Karar Detayı ekranlarının tümü bu listeyi
// kararRepository sözleşmesi üzerinden okur. Kimlikler kasıtlı olarak
// string'dir ve ileride gerçek Yargıtay Karar Arama sisteminin belge/karar
// kimliğine birebir eşlenebilecek biçimde tutulur.
const MOCK_KARARLAR: KararOzet[] = [
  {
    id: 'karar-1',
    mahkeme: 'Yargıtay',
    daire: '21. Hukuk Dairesi',
    hukukDali: 'İŞ HUKUKU',
    esasNo: '2022/4521',
    kararNo: '2023/8890',
    tarih: '14.03.2023',
    ozet: 'İşçinin iş kazası sonucu maluliyeti nedeniyle sürekli iş göremezlik tazminatının hesabında gerçek ücretin esas alınması gerekir.',
  },
  {
    id: 'karar-2',
    mahkeme: 'Yargıtay',
    daire: '10. Hukuk Dairesi',
    hukukDali: 'İŞ HUKUKU',
    esasNo: '2021/7348',
    kararNo: '2022/11642',
    tarih: '22.12.2022',
    ozet: 'İş kazasının tespiti ve maddi tazminat talebi yönünden kusur oranının belirlenmesinde iş güvenliği uzmanı raporu dikkate alınmalıdır.',
  },
  {
    id: 'karar-3',
    mahkeme: 'Yargıtay',
    daire: '9. Hukuk Dairesi',
    hukukDali: 'İŞ HUKUKU',
    esasNo: '2020/11876',
    kararNo: '2021/9641',
    tarih: '18.10.2021',
    ozet: 'Meslekte kazanma gücü kaybı oranının tespitinde maluliyet raporunun hükme esas alınabilmesi için denetime elverişli olması zorunludur.',
  },
  {
    id: 'karar-4',
    mahkeme: 'Yargıtay',
    daire: 'Hukuk Genel Kurulu',
    hukukDali: 'BORÇLAR HUKUKU',
    esasNo: '2019/4482',
    kararNo: '2020/7210',
    tarih: '16.12.2020',
    ozet: 'Manevi tazminatın takdirinde tarafların sosyal ve ekonomik durumları ile olayın gelişim şekli birlikte değerlendirilmelidir.',
  },
];

export const mockKararRepository: KararRepository = {
  async getKararById(id: string): Promise<KararOzet | null> {
    return MOCK_KARARLAR.find((karar) => karar.id === id) ?? null;
  },
  async getKararlar(): Promise<KararOzet[]> {
    return MOCK_KARARLAR;
  },
};

export { MOCK_KARARLAR };
