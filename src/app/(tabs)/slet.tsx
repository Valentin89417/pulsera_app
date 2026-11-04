import type { ComponentProps } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../hooks/useTheme';
import { ThemeColors } from '../../utils/themeColors';

type IconName = ComponentProps<typeof FontAwesome>['name'];

interface SletSection {
  key: string;
  title: string;
  description: string;
  icon: IconName;
  route: Href;
  soon?: boolean;
}

// Разделы «Слёта»: новые разделы пока помечены «скоро»
const SECTIONS: SletSection[] = [
  {
    key: 'quiet-question',
    title: 'Тихий вопрос',
    description: 'Задать вопрос, который давно живёт внутри',
    icon: 'question-circle',
    route: '/slet/quiet-question',
    soon: true,
  },
  {
    key: 'power-exchange',
    title: 'Обмен силой',
    description: 'Поделиться теплом и поддержать других',
    icon: 'sun-o',
    route: '/slet/power-exchange',
    soon: true,
  },
  {
    key: 'chat',
    title: 'Пожужжим',
    description: 'Живой разговор участников',
    icon: 'comments',
    route: '/slet/chat',
  },
];

// Экран-распределитель «Слёт»
export default function SletScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = createStyles(colors);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
    >
      <Text style={[styles.title, { color: colors.text }]}>Слёт</Text>
      <Text style={[styles.subtitle, { color: colors.textMuted }]}>
        Пространство, где можно побыть среди своих
      </Text>

      <View style={styles.cards}>
        {SECTIONS.map((section) => (
          <TouchableOpacity
            key={section.key}
            activeOpacity={0.8}
            onPress={() => router.push(section.route)}
            style={[
              styles.card,
              { backgroundColor: colors.surface, borderColor: colors.cardBorder },
            ]}
          >
            <View style={[styles.iconCircle, { backgroundColor: colors.cardIconBg }]}>
              <FontAwesome name={section.icon} size={22} color={colors.cardIconColor} />
            </View>

            <View style={styles.cardBody}>
              <View style={styles.cardTitleRow}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>{section.title}</Text>
                {section.soon && (
                  <View style={[styles.badge, { backgroundColor: colors.primary + '15' }]}>
                    <Text style={[styles.badgeText, { color: colors.primary }]}>скоро</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.cardDescription, { color: colors.textMuted }]}>
                {section.description}
              </Text>
            </View>

            <FontAwesome name="chevron-right" size={14} color={colors.textMuted} />
          </TouchableOpacity>
        ))}
      </View>

      <View style={[styles.note, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <FontAwesome name="leaf" size={18} color={colors.primary} />
        <Text style={[styles.noteText, { color: colors.textSecondary }]}>
          Слёт — общее пространство. Здесь можно побыть в тишине, обменяться силой или просто поговорить.
        </Text>
      </View>
    </ScrollView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 6,
    marginBottom: 24,
  },
  cards: {
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  cardBody: {
    flex: 1,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  cardDescription: {
    fontSize: 13,
    marginTop: 4,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  note: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginTop: 24,
  },
  noteText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
  },
});
