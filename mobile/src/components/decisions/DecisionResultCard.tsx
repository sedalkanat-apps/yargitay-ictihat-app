import { Bookmark, ChevronRight, Sparkles } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { colors } from '@/theme';

interface DecisionResultCardProps {
  mahkeme: string;
  daire: string;
  hukukDali: string;
  esasNo: string;
  kararNo: string;
  tarih: string;
  ozet: string;
  onPress?: () => void;
  onSavePress?: () => void;
}

export function DecisionResultCard({
  mahkeme,
  daire,
  hukukDali,
  esasNo,
  kararNo,
  tarih,
  ozet,
  onPress,
  onSavePress,
}: DecisionResultCardProps) {
  return (
    <Card
      onPress={onPress}
      padding="md"
      accessibilityLabel={`${mahkeme} ${daire}, Esas ${esasNo}, Karar ${kararNo}, ${tarih}`}
      className="mb-3">
      <View className="flex-row items-center justify-between">
        <Text className="font-mono text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
          {hukukDali}
        </Text>
        <ChevronRight size={18} color={colors.muted.foreground} />
      </View>

      <View className="mt-2">
        <Text className="text-xs font-body-semibold text-primary">{mahkeme}</Text>
        <Text className="mt-0.5 font-heading text-base text-card-foreground">{daire}</Text>
      </View>

      <View className="mt-3 flex-row items-center justify-between">
        <Text className="font-mono text-2xs text-muted-foreground">
          Esas <Text className="font-body-semibold text-secondary-foreground">{esasNo}</Text>
        </Text>
        <Text className="font-mono text-2xs text-muted-foreground">
          Karar <Text className="font-body-semibold text-secondary-foreground">{kararNo}</Text>
        </Text>
        <Text className="font-mono text-2xs text-muted-foreground">{tarih}</Text>
      </View>

      <Text numberOfLines={4} className="mt-3 border-t border-border pt-3 text-sm leading-5 text-muted-foreground">
        {ozet}
      </Text>

      <View className="mt-3 flex-row items-center justify-between border-t border-border pt-3">
        <Badge label="✨ AI Özeti" variant="primary" icon={<Sparkles size={12} color={colors.primary.DEFAULT} />} />
        <Pressable
          onPress={onSavePress}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Dosyalarıma Kaydet">
          <Bookmark size={18} color={colors.muted.foreground} />
        </Pressable>
      </View>
    </Card>
  );
}
