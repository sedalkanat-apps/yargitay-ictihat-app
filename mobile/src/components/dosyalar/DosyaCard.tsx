import { ChevronRight } from 'lucide-react-native';
import { Text, View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { colors } from '@/theme';
import type { DosyaListeItem } from '@/types/dosya';

interface DosyaCardProps {
  item: DosyaListeItem;
  onPress?: () => void;
}

export function DosyaCard({ item, onPress }: DosyaCardProps) {
  const { dosya, kaydedilenKararSayisi } = item;

  return (
    <Card
      onPress={onPress}
      padding="md"
      className="mb-3"
      accessibilityLabel={`${dosya.ad}, ${kaydedilenKararSayisi} kaydedilen karar`}
      accessibilityHint="Dosya detayını açmak için dokunun">
      <View className="flex-row items-center justify-between">
        <View className="min-w-0 flex-1">
          <Text numberOfLines={1} className="font-heading text-base text-card-foreground">
            {dosya.ad}
          </Text>
          <Text className="mt-1.5 text-xs text-muted-foreground">{kaydedilenKararSayisi} kaydedilen karar</Text>
        </View>
        <ChevronRight size={18} color={colors.muted.foreground} />
      </View>
    </Card>
  );
}
