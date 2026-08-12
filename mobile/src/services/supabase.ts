import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error('Missing environment variable: EXPO_PUBLIC_SUPABASE_URL');
}

if (!supabaseAnonKey) {
  throw new Error('Missing environment variable: EXPO_PUBLIC_SUPABASE_ANON_KEY');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // @react-native-async-storage/async-storage'ın web derlemesi window.localStorage'a
    // SSR koruması olmadan doğrudan erişir ve Expo Router'ın Node.js SSR geçişinde
    // "window is not defined" ile çöker. Web'de storage'ı hiç belirtmeyip
    // @supabase/auth-js'in kendi supportsLocalStorage()/memoryLocalStorageAdapter
    // fallback'ine bırakıyoruz — bu zaten isBrowser() kontrolüyle SSR-güvenlidir ve
    // gerçek tarayıcıda localStorage'a düşer.
    storage: Platform.OS === 'web' ? undefined : AsyncStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});
