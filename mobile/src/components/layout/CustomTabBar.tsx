import { useRouter, type Href } from 'expo-router';
import { Bookmark, Search, UserRound, type LucideIcon } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { IconCircle } from '@/components/ui/IconCircle';
import { colors } from '@/theme';

export type CustomTabBarAktifSekme = 'ara' | 'dosyalarim' | 'hesabim';

interface CustomTabBarProps {
  aktifSekme: CustomTabBarAktifSekme;
  altBosluk: number;
}

interface Sekme {
  key: CustomTabBarAktifSekme;
  label: string;
  icon: LucideIcon;
  route: Href | null;
  minWidthClassName: string;
}

const SEKMELER: Sekme[] = [
  { key: 'ara', label: 'Ara', icon: Search, route: '/', minWidthClassName: 'min-w-[76px]' },
  {
    key: 'dosyalarim',
    label: 'Dosyalarım',
    icon: Bookmark,
    route: '/muvekkillerim',
    minWidthClassName: 'min-w-[88px]',
  },
  { key: 'hesabim', label: 'Hesabım', icon: UserRound, route: null, minWidthClassName: 'min-w-[76px]' },
];

export function CustomTabBar({ aktifSekme, altBosluk }: CustomTabBarProps) {
  const router = useRouter();

  return (
    <View
      style={{ paddingBottom: altBosluk }}
      className="absolute inset-x-0 bottom-0 border-t border-border bg-background/95">
      <View className="mx-auto w-full max-w-[393px] flex-row items-start justify-around px-4 pt-2" style={{ height: 78 }}>
        {SEKMELER.map((sekme) => {
          const aktif = sekme.key === aktifSekme;
          const Icon = sekme.icon;
          return (
            <Pressable
              key={sekme.key}
              onPress={() => {
                if (!aktif && sekme.route) router.push(sekme.route);
              }}
              accessibilityRole="tab"
              accessibilityState={{ selected: aktif }}
              accessibilityLabel={sekme.label}
              hitSlop={4}
              className={`${sekme.minWidthClassName} items-center gap-1`}>
              <IconCircle
                icon={<Icon size={20} color={aktif ? colors.primary.foreground : colors.muted.foreground} />}
                size="md"
                className={aktif ? 'bg-primary shadow-lg shadow-primary/20' : 'bg-transparent'}
              />
              <Text
                className={
                  aktif
                    ? 'text-[11px] font-body-bold text-primary'
                    : 'font-body-semibold text-[11px] text-muted-foreground'
                }>
                {sekme.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
