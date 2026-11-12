import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { QuietQuestionFeedItem } from '../types/quiet';
import { formatDaysLeft } from '../utils/quietQuestion';

interface QuietQuestionCardProps {
  item: QuietQuestionFeedItem;
  onPress: () => void;
}

// Карточка вопроса в общей ленте «Тихого вопроса»
export function QuietQuestionCard({ item, onPress }: QuietQuestionCardProps) {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}
    >
      <Image source={{ uri: item.card_image_url }} style={styles.image} resizeMode="cover" />

      <View style={styles.content}>
        <Text style={[styles.question, { color: colors.text }]} numberOfLines={3}>
          {item.question}
        </Text>

        <View style={styles.meta}>
          <View style={styles.metaItem}>
            <FontAwesome name="comments-o" size={12} color={colors.textMuted} />
            <Text style={[styles.metaText, { color: colors.textMuted }]}>
              {item.answers_count}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <FontAwesome name="hourglass-half" size={12} color={colors.textMuted} />
            <Text style={[styles.metaText, { color: colors.textMuted }]}>
              {formatDaysLeft(item.expires_at)}
            </Text>
          </View>
        </View>
      </View>

      <FontAwesome name="chevron-right" size={14} color={colors.textMuted} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
  },
  image: {
    width: 72,
    height: 96,
    borderRadius: 10,
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  question: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '500',
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metaText: {
    fontSize: 12,
  },
});
