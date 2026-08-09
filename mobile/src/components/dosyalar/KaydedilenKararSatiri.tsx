import { Text, View } from 'react-native';

import { Card } from '@/components/ui/Card';
import type { KaydedilenKararListeItem } from '@/hooks/useKaydedilenKararlar';

interface KaydedilenKararSatiriProps {
  item: KaydedilenKararListeItem;
  onPress?: () => void;
}

export function KaydedilenKararSatiri({ item, onPress }: KaydedilenKararSatiriProps) {
  const { kararOzeti } = item;

  if (!kararOzeti) {
    return (
      <Card padding="md" className="mb-3">
        <Text className="text-sm text-muted-foreground">Karar bilgisi bulunamadı.</Text>
      </Card>
    );
  }

  return (
    <Card
      onPress={onPress}
      padding="md"
      className="mb-3"
      accessibilityLabel={`${kararOzeti.mahkeme} ${kararOzeti.daire}, Esas ${kararOzeti.esasNo}, Karar ${kararOzeti.kararNo}`}
      accessibilityHint="Karar detayını açmak için dokunun">
      <Text className="text-xs font-body-semibold text-primary">{kararOzeti.mahkeme}</Text>
      <Text className="mt-0.5 font-heading text-sm text-card-foreground">{kararOzeti.daire}</Text>
      <View className="mt-2 flex-row items-center justify-between">
        <Text className="font-mono text-2xs text-muted-foreground">
          Esas <Text className="font-body-semibold text-secondary-foreground">{kararOzeti.esasNo}</Text>
        </Text>
        <Text className="font-mono text-2xs text-muted-foreground">
          Karar <Text className="font-body-semibold text-secondary-foreground">{kararOzeti.kararNo}</Text>
        </Text>
        <Text className="font-mono text-2xs text-muted-foreground">{kararOzeti.tarih}</Text>
      </View>
    </Card>
  );
}
