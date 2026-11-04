import type { ComponentProps } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../hooks/useTheme';
import { ThemeColors } from '../utils/themeColors';

type IconName = ComponentProps<typeof FontAwesome>['name'];

interface SectionPlaceholderProps {
  title: string;
  icon: IconName;
  description: string;
  bullets: string[];
}

// Экран-заглушка для разделов «Слёта», которые ещё готовятся
export function SectionPlaceholder({ title, icon, description, bullets }: SectionPlaceholderProps) {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = createStyles(colors);

  // Назад в «Слёт»; при прямом открытии — фолбэк на хаб
  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/slet');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Хедер */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.surface,
            borderBottomColor: colors.border,
            paddingTop: insets.top + 10,
          },
        ]}
      >
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <FontAwesome name="arrow-left" size={18} color={colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{title}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.iconCircle, { backgroundColor: colors.cardIconBg }]}>
          <FontAwesome name={icon} size={40} color={colors.cardIconColor} />
        </View>

        <View style={[styles.badge, { backgroundColor: colors.primary + '15' }]}>
          <Text style={[styles.badgeText, { color: colors.primary }]}>Раздел готовится</Text>
        </View>

        <Text style={[styles.description, { color: colors.text }]}>{description}</Text>

        <View style={[styles.bullets, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {bullets.map((bullet) => (
            <View key={bullet} style={styles.bulletRow}>
              <FontAwesome name="leaf" size={14} color={colors.primary} style={styles.bulletIcon} />
              <Text style={[styles.bulletText, { color: colors.textSecondary }]}>{bullet}</Text>
            </View>
          ))}
        </View>

        <Text style={[styles.note, { color: colors.textMuted }]}>
          Мы уже готовим этот раздел. Скоро здесь можно будет остаться наедине с собой — и всё-таки вместе.
        </Text>
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 32,
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
    marginTop: 20,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  description: {
    fontSize: 17,
    lineHeight: 24,
    textAlign: 'center',
    marginTop: 16,
  },
  bullets: {
    alignSelf: 'stretch',
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginTop: 24,
    gap: 12,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  bulletIcon: {
    marginTop: 2,
    marginRight: 10,
  },
  bulletText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  note: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginTop: 24,
  },
});
