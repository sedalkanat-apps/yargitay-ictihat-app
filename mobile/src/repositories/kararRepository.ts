import { yargitayKararRepository } from '@/repositories/yargitayKararRepository';
import type { KararOzet } from '@/types/karar';

// Karar verisinin tek gerçek kaynağı Yargıtay Başkanlığı'nın resmî Karar Arama
// sistemidir. Bu sözleşme, o kaynağa erişimin biçimini (mock ya da gerçek)
// UI ve hook katmanından tamamen gizler.
//
// Mobil uygulama Yargıtay'a veya mevzuat.gov.tr'ye DOĞRUDAN istek atmaz.
// Gerçek implementasyon, bir Supabase Edge Function (veya ayrı bir backend)
// üzerinden Yargıtay Karar Arama sistemine bağlanacak ve bu arayüzü
// uygulayacaktır — ör. `yargitayKararRepository.ts`. Yargıtay'a özgü URL,
// endpoint ya da HTML/DOM yapısı yalnızca o dosyada bilinir; buraya veya
// hook/UI katmanına asla sızmaz. Gerçek erişimde kullanılabilecek API,
// izin, kullanım koşulu, rate limit ve CAPTCHA durumu ayrı bir "gerçek veri"
// sprintinde araştırılıp tasarlanacaktır — bu sözleşme bugünden onların var
// olduğunu varsaymaz.
//
// Kanun/mevzuat verisi (T.C. Mevzuat Bilgi Sistemi — mevzuat.gov.tr) için de
// ileride aynı desende ayrı bir `MevzuatRepository` sözleşmesi ve
// `repositories/mevzuatRepository.ts` dosyası açılacaktır. Bu sprintte
// mevzuat için repository veya feature geliştirilmemiştir; bu yalnızca bir
// mimari nottur.
export interface KararAramaParametreleri {
  q: string;
  page?: number;
  limit?: number;
  sort?: 'relevance' | 'date';
}

export interface KararRepository {
  getKararById(id: string): Promise<KararOzet | null>;
  getKararlar(params: KararAramaParametreleri): Promise<KararOzet[]>;
}

// Şu an aktif implementasyon mock'tur. Gerçek implementasyon hazır
// olduğunda değişecek tek satır budur — hook'lar ve ekranlar hiç değişmez.
export const kararRepository: KararRepository = yargitayKararRepository;
