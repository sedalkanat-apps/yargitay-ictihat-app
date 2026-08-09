export interface Dosya {
  id: string;
  muvekkilId: string;
  ad: string;
  olusturmaTarihi: string;
}

export interface DosyaListeItem {
  dosya: Dosya;
  kaydedilenKararSayisi: number;
}

// Yalnızca ilişkiyi taşır. Kararın mahkeme/daire/esas/karar/tarih gibi
// görüntülenecek bilgileri BURADA KOPYALANMAZ — kararRepository'den
// kararId ile okunur. Amaç: gerçek backend'e geçişte aynı kararın
// birden fazla kopyasının oluşmasını önlemek.
export interface KaydedilenKarar {
  id: string;
  dosyaId: string;
  kararId: string;
  kaydedilmeTarihi: string;
}

// AI'a hazır ama AI'a özgü değil: bugün yalnızca düz metin. İleride bir not
// özeti/analizi eklenecekse bu değişecek alan değil, ayrı bir okuma
// fonksiyonu (ör. notRepository.getNotOzeti) olarak eklenir.
export interface Not {
  id: string;
  dosyaId: string;
  metin: string;
  olusturmaTarihi: string;
}
