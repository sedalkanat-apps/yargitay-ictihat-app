import { useQuery } from '@tanstack/react-query';

import { kararRepository } from '@/repositories/kararRepository';

export function useKararlar() {
  return useQuery({
    queryKey: ['kararlar'],
    queryFn: () => kararRepository.getKararlar(),
  });
}
