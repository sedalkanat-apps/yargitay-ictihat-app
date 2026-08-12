import { useQuery } from '@tanstack/react-query';

import { kararRepository } from '@/repositories/kararRepository';
import type { KararAramaParametreleri } from '@/repositories/kararRepository';

export function useKararlar(params: KararAramaParametreleri) {
  return useQuery({
    queryKey: ['kararlar', params],
    queryFn: () => kararRepository.getKararlar(params),
    enabled: Boolean(params.q),
  });
}
