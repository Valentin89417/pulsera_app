import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { QuietAnswerView } from '../types/quiet';
import { formatAnswerTime } from '../utils/quietQuestion';

interface QuietAnswerItemProps {
  index: number;
  answer: QuietAnswerView;
  canEdit: boolean;
  onEdit: () => void;
}

// Один анонимный ответ: без автора, только порядковый номер
export function QuietAnswerItem({ index, answer, canEdit, onEdit }: QuietAnswerItemProps) {
  const { colors } = useTheme();

  return (
    <View
      style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
    >
      <View style={styles.header}>
        <Text style={[styles.label, { color: colors.textMuted }]}>
          {answer.is_own ? 'Ваш ответ' : `Ответ ${index}`}
        </Text>
        <Text style={[styles.time, { color: colors.textMuted }]}>
          {formatAnswerTime(answer.created_at)}
        </Text>
        {canEdit && (
          <TouchableOpacity onPress={onEdit} style={styles.editButton} hitSlop={8}>
            <FontAwesome name="pencil" size={12} color={colors.primary} />
          </TouchableOpacity>
        )}
      </View>

      <Text style={[styles.body, { color: colors.text }]}>{answer.body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
  },
  time: {
    fontSize: 11,
    flex: 1,
  },
  editButton: {
    padding: 4,
  },
  body: {
    fontSize: 14,
    lineHeight: 21,
  },
});
