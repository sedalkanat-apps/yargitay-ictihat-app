import { ArrowUpRight } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { Badge } from '@/components/ui/Badge';
import { colors } from '@/theme';

interface SimilarDecisionCardProps {
  title: string;
  daire: string;
  esasNo: string;
  kararNo: string;
  tarih: string;
  benzerlikYuzdesi: number;
  onPress?: () => void;
}

export function SimilarDecisionCard({
  title,
  daire,
  esasNo,
  kararNo,
  tarih,
  onPress,
}: SimilarDecisionCardProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
      className="w-56 rounded-theme border border-border bg-card p-4">
      <View className="mb-4 flex-row items-start justify-between">
        <Badge label="Benzerlik analizi yakında" variant="muted" />
        <ArrowUpRight size={16} color={colors.muted.foreground} />
      </View>
      <Text numberOfLines={2} className="font-heading text-sm text-card-foreground">
        {title}
      </Text>
      <Text className="mt-3 font-mono text-2xs leading-4 text-muted-foreground">
        {daire} · E. {esasNo}
        {'\n'}K. {kararNo} · {tarih}
      </Text>
    </Pressable>
  );
}
