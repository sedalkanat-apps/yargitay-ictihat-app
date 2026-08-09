import { useQuery } from '@tanstack/react-query';

import { kararRepository } from '@/repositories/kararRepository';

export function useKarar(id: string) {
  return useQuery({
    queryKey: ['karar', id],
    queryFn: () => kararRepository.getKararById(id),
    enabled: Boolean(id),
  });
}
