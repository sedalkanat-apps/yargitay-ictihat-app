import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { getNotlar, notEkle } from '@/services/notService';

export function useNotlar(dosyaId: string) {
  return useQuery({
    queryKey: ['notlar', dosyaId],
    queryFn: () => getNotlar(dosyaId),
    enabled: Boolean(dosyaId),
  });
}

export function useNotEkle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ dosyaId, metin }: { dosyaId: string; metin: string }) => notEkle(dosyaId, metin),
    onSuccess: (yeniNot) => {
      queryClient.invalidateQueries({ queryKey: ['notlar', yeniNot.dosyaId] });
    },
  });
}
