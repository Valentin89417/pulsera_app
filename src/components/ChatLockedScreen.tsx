import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { ThemeColors } from '../utils/themeColors';

// Экран блокировки чата для пользователей без подписки «Пробуждение»
export function ChatLockedScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={[styles.iconContainer, { backgroundColor: colors.primaryAlpha13 }]}>
          <FontAwesome name="lock" size={48} color={colors.primary} />
        </View>

        <Text style={styles.title}>Чат с автором</Text>
        <Text style={styles.description}>
          Чат доступен по подписке «Пробуждение»
        </Text>
        <Text style={styles.hint}>
          Задавайте вопросы, получайте персональные рекомендации и общайтесь напрямую
        </Text>

        <TouchableOpacity
          style={[styles.subscribeButton, { backgroundColor: colors.gold }]}
          onPress={() => router.push('/subscription')}
        >
          <Text style={[styles.subscribeText, { color: colors.text }]}>Подписаться</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={[styles.backText, { color: colors.textMuted }]}>Назад</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 40,
    maxWidth: 360,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  hint: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
  },
  subscribeButton: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
  },
  subscribeText: {
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    paddingVertical: 12,
  },
  backText: {
    fontSize: 14,
  },
});
