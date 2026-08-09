import { ChevronRight } from 'lucide-react-native';
import { Text, View } from 'react-native';

import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { colors } from '@/theme';
import type { MuvekkilListeItem } from '@/types/muvekkil';

interface MuvekkilCardProps {
  item: MuvekkilListeItem;
  onPress?: () => void;
}

export function MuvekkilCard({ item, onPress }: MuvekkilCardProps) {
  const { muvekkil, dosyaSayisi } = item;

  return (
    <Card
      onPress={onPress}
      padding="md"
      className="mb-3"
      accessibilityLabel={`${muvekkil.ad}, ${dosyaSayisi} dosya`}
      accessibilityHint="Müvekkil detayını açmak için dokunun">
      <View className="flex-row items-center justify-between">
        <View className="min-w-0 flex-1">
          <Text numberOfLines={1} className="font-heading text-base text-card-foreground">
            {muvekkil.ad}
          </Text>
          <View className="mt-1.5 flex-row items-center gap-2">
            <Badge label={muvekkil.tur === 'tuzel' ? 'Tüzel Kişi' : 'Gerçek Kişi'} variant="muted" />
            <Text className="text-xs text-muted-foreground">{dosyaSayisi} dosya</Text>
          </View>
        </View>
        <ChevronRight size={18} color={colors.muted.foreground} />
      </View>
    </Card>
  );
}
