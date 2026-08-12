import type { KararAramaParametreleri, KararRepository } from '@/repositories/kararRepository';
import { supabase } from '@/services/supabase';
import type { KararOzet } from '@/types/karar';

// Yargıtay Karar Arama sisteminin gerçek erişim noktası — kararRepository.ts
// sözleşmesindeki notta önceden duyurulmuştu. Bugün için erişim, kararlar
// tablosuna doğrudan bağlanan bir Supabase Edge Function (kararlar-search)
// üzerinden gerçekleşir; Yargıtay'a özgü herhangi bir detay bu dosyaya da
// sızmaz, yalnızca Supabase sözleşmesi bilinir.

interface KararlarSearchApiKarar {
  id: string;
  mahkeme: string;
  daire: string;
  esas_no: string;
  karar_no: string;
  tarih: string;
  hukuk_dali: string;
  ozet: string;
}

interface KararlarSearchApiResponse {
  success: boolean;
  data?: {
    results: KararlarSearchApiKarar[];
  };
  error?: {
    code: string;
    message: string;
  };
}

function apiKarariKararOzetineDonustur(karar: KararlarSearchApiKarar): KararOzet {
  return {
    id: karar.id,
    mahkeme: karar.mahkeme,
    daire: karar.daire,
    hukukDali: karar.hukuk_dali,
    esasNo: karar.esas_no,
    kararNo: karar.karar_no,
    tarih: karar.tarih,
    ozet: karar.ozet,
  };
}

export const yargitayKararRepository: KararRepository = {
  async getKararById(id: string): Promise<KararOzet | null> {
    const { data, error: queryError } = await supabase
      .from('kararlar')
      .select('id, mahkeme, daire, esas_no, karar_no, tarih, hukuk_dali, ozet')
      .eq('id', id)
      .maybeSingle<KararlarSearchApiKarar>();

    if (queryError) {
      throw new Error('Karar getirilemedi. Lütfen daha sonra tekrar deneyin.');
    }

    return data ? apiKarariKararOzetineDonustur(data) : null;
  },

  async getKararlar(params: KararAramaParametreleri): Promise<KararOzet[]> {
    const searchParams = new URLSearchParams({ q: params.q });
    if (params.page !== undefined) searchParams.set('page', String(params.page));
    if (params.limit !== undefined) searchParams.set('limit', String(params.limit));
    if (params.sort !== undefined) searchParams.set('sort', params.sort);

    const { data, error: invokeError } = await supabase.functions.invoke<KararlarSearchApiResponse>(
      `kararlar-search?${searchParams.toString()}`,
      { method: 'GET' }
    );

    if (invokeError || !data?.success || !data.data) {
      throw new Error('Karar araması şu anda gerçekleştirilemedi. Lütfen daha sonra tekrar deneyin.');
    }

    return data.data.results.map(apiKarariKararOzetineDonustur);
  },
};
