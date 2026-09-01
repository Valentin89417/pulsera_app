import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { ThemeColors } from '../utils/themeColors';

export default function HelpScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Хедер */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <FontAwesome name="arrow-left" size={18} color={colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Помощь</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Ссылки на статьи в чате */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <View style={styles.sectionHeader}>
            <FontAwesome name="at" size={18} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Ссылки на статьи в чате</Text>
          </View>
          <Text style={[styles.sectionText, { color: colors.textSecondary }]}>
            В чате с автором вы можете вставлять ссылки на статьи, чтобы удобно делиться материалами.
          </Text>

          <View style={[styles.step, { backgroundColor: colors.background }]}>
            <Text style={[styles.stepNumber, { color: colors.primary }]}>1</Text>
            <Text style={[styles.stepText, { color: colors.text }]}>
              Введите <Text style={styles.code}>@</Text> в поле ввода
            </Text>
          </View>

          <View style={[styles.step, { backgroundColor: colors.background }]}>
            <Text style={[styles.stepNumber, { color: colors.primary }]}>2</Text>
            <Text style={[styles.stepText, { color: colors.text }]}>
              Появится список статей. Начните вводить название для поиска
            </Text>
          </View>

          <View style={[styles.step, { backgroundColor: colors.background }]}>
            <Text style={[styles.stepNumber, { color: colors.primary }]}>3</Text>
            <Text style={[styles.stepText, { color: colors.text }]}>
              Нажмите на статью — она вставится в сообщение как кликабельная ссылка
            </Text>
          </View>

          <Text style={[styles.tip, { color: colors.textMuted }]}>
            Получатель увидит название статьи синей ссылкой. При нажатии откроется публикация.
          </Text>
        </View>

        {/* Редактирование и удаление */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <View style={styles.sectionHeader}>
            <FontAwesome name="pencil" size={18} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Редактирование сообщений</Text>
          </View>
          <Text style={[styles.sectionText, { color: colors.textSecondary }]}>
            Нажмите и удерживайте своё сообщение, чтобы открыть меню:
          </Text>
          <View style={[styles.step, { backgroundColor: colors.background }]}>
            <FontAwesome name="pencil" size={14} color={colors.primary} style={styles.stepIcon} />
            <Text style={[styles.stepText, { color: colors.text }]}>
              <Text style={styles.bold}>Редактировать</Text> — изменить текст сообщения
            </Text>
          </View>
          <View style={[styles.step, { backgroundColor: colors.background }]}>
            <FontAwesome name="trash" size={14} color={colors.error} style={styles.stepIcon} />
            <Text style={[styles.stepText, { color: colors.text }]}>
              <Text style={[styles.bold, { color: colors.error }]}>Удалить</Text> — убрать сообщение
            </Text>
          </View>
        </View>
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  sectionText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    gap: 12,
  },
  stepNumber: {
    fontSize: 16,
    fontWeight: '700',
    width: 24,
    textAlign: 'center',
  },
  stepIcon: {
    width: 24,
    textAlign: 'center',
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  code: {
    fontFamily: 'monospace',
    backgroundColor: '#e0e0e0',
    paddingHorizontal: 4,
    borderRadius: 3,
    fontSize: 13,
  },
  bold: {
    fontWeight: '600',
  },
  tip: {
    fontSize: 13,
    fontStyle: 'italic',
    marginTop: 4,
  },
});
