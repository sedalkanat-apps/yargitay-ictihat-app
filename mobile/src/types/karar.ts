// Bir kararın kimlik ve liste görünümü için gereken bilgilerini taşıyan
// salt-okunur read model. Kaynağı ileride Yargıtay Karar Arama sistemi
// olacaktır — bkz. repositories/kararRepository.ts. Uygulamadaki TEK karar
// veri şeklidir; Ara, Sonuçlar ve Karar Detayı ekranları hepsi bunu kullanır.
export interface KararOzet {
  id: string;
  mahkeme: string;
  daire: string;
  hukukDali: string;
  esasNo: string;
  kararNo: string;
  tarih: string;
  ozet: string;
}
