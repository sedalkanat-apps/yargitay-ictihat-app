import '@/global.css';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack, useRouter, usePathname } from 'expo-router';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useAuth } from '@/hooks/useAuth';

const queryClient = new QueryClient();

export default function RootLayout() {
  const { session, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;

    const isGirisRoute = pathname === '/giris';

    if (!session && !isGirisRoute) {
      router.replace('/giris');
      return;
    }

    if (session && isGirisRoute) {
      router.replace('/');
    }
  }, [session, loading, pathname, router]);

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <Stack screenOptions={{ headerShown: false }} />
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
