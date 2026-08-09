import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { createDosya, getDosyaById, getDosyalarByMuvekkilId } from '@/services/dosyaService';
import { getKaydedilenKararlar } from '@/services/kaydedilenKararService';
import type { Dosya, DosyaListeItem } from '@/types/dosya';

export async function dosyalariListeOgesineDonustur(dosyalar: Dosya[]): Promise<DosyaListeItem[]> {
  return Promise.all(
    dosyalar.map(async (dosya) => ({
      dosya,
      kaydedilenKararSayisi: (await getKaydedilenKararlar(dosya.id)).length,
    }))
  );
}

export function useDosyalar(muvekkilId: string) {
  return useQuery({
    queryKey: ['dosyalar', muvekkilId],
    queryFn: async (): Promise<DosyaListeItem[]> => {
      const dosyalar = await getDosyalarByMuvekkilId(muvekkilId);
      return dosyalariListeOgesineDonustur(dosyalar);
    },
    enabled: Boolean(muvekkilId),
  });
}

export function useDosya(id: string) {
  return useQuery({
    queryKey: ['dosya', id],
    queryFn: () => getDosyaById(id),
    enabled: Boolean(id),
  });
}

export function useDosyaOlustur() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ muvekkilId, ad }: { muvekkilId: string; ad: string }) => createDosya(muvekkilId, ad),
    onSuccess: (yeniDosya) => {
      queryClient.invalidateQueries({ queryKey: ['dosyalar', yeniDosya.muvekkilId] });
      queryClient.invalidateQueries({ queryKey: ['muvekkiller'] });
    },
  });
}
