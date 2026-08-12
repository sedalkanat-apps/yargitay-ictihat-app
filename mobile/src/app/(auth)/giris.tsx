import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { supabase } from '@/services/supabase';

export default function GirisScreen() {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleGiris = async () => {
    setErrorMessage(null);
    setIsSubmitting(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    setIsSubmitting(false);

    if (error) {
      setErrorMessage('E-posta veya parola hatalı. Lütfen tekrar deneyin.');
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1 bg-background">
      <StatusBar style="light" />
      <View
        style={{ paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }}
        className="flex-1 justify-center px-6">
        <View className="mb-8">
          <Text className="font-heading text-2xl text-foreground">Giriş Yap</Text>
          <Text className="mt-1 text-sm text-muted-foreground">Hesabınıza giriş yaparak devam edin.</Text>
        </View>

        <Card variant="default" padding="lg" className="gap-4">
          <Input
            label="E-posta"
            value={email}
            onChangeText={setEmail}
            placeholder="ornek@eposta.com"
            keyboardType="email-address"
            autoCapitalize="none"
            accessibilityLabel="E-posta adresi"
          />
          <Input
            label="Parola"
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            secureTextEntry
            autoCapitalize="none"
            accessibilityLabel="Parola"
          />

          {errorMessage ? (
            <Text accessibilityRole="alert" className="text-sm text-destructive">
              {errorMessage}
            </Text>
          ) : null}

          <Button
            label={isSubmitting ? 'Giriş yapılıyor…' : 'Giriş Yap'}
            onPress={handleGiris}
            disabled={isSubmitting || !email || !password}
            accessibilityLabel="Giriş yap"
            className="mt-2 w-full"
          />
        </Card>
      </View>
    </KeyboardAvoidingView>
  );
}
