import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { kararRepository } from '@/repositories/kararRepository';
import { getKaydedilenKararlar, kararKaydet } from '@/services/kaydedilenKararService';
import type { KaydedilenKarar } from '@/types/dosya';
import type { KararOzet } from '@/types/karar';

export interface KaydedilenKararListeItem {
  kaydedilenKarar: KaydedilenKarar;
  kararOzeti: KararOzet | null;
}

export async function kaydedilenKararlariListeOgesineDonustur(
  kayitlar: KaydedilenKarar[]
): Promise<KaydedilenKararListeItem[]> {
  return Promise.all(
    kayitlar.map(async (kaydedilenKarar) => ({
      kaydedilenKarar,
      kararOzeti: await kararRepository.getKararById(kaydedilenKarar.kararId),
    }))
  );
}

export function useKaydedilenKararlar(dosyaId: string) {
  return useQuery({
    queryKey: ['kaydedilenKararlar', dosyaId],
    queryFn: async (): Promise<KaydedilenKararListeItem[]> => {
      const kayitlar = await getKaydedilenKararlar(dosyaId);
      return kaydedilenKararlariListeOgesineDonustur(kayitlar);
    },
    enabled: Boolean(dosyaId),
  });
}

export function useKararKaydet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ dosyaId, kararId }: { dosyaId: string; kararId: string }) => kararKaydet(dosyaId, kararId),
    onSuccess: (yeniKayit) => {
      queryClient.invalidateQueries({ queryKey: ['kaydedilenKararlar', yeniKayit.dosyaId] });
      queryClient.invalidateQueries({ queryKey: ['dosyalar'] });
    },
  });
}
