import { Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../hooks/useTheme';
import { ThemeColors } from '../utils/themeColors';

interface ArticleMentionProps {
  articleId: string;
  title: string;
}

// Инлайновая кликабельная ссылка на статью
export function ArticleMention({ articleId, title }: ArticleMentionProps) {
  const router = useRouter();
  const { colors } = useTheme();

  return (
    <Text
      onPress={() => router.push(`/content/${articleId}`)}
      style={{ color: colors.primary, fontWeight: '600', textDecorationLine: 'underline' }}
    >
      «{title}»
    </Text>
  );
}

// Формат: [{title|uuid}] (новый) или [{uuid}] (старый)
export function parseMessageWithArticles(
  text: string
): { type: 'text' | 'article'; content: string; articleId?: string; articleTitle?: string }[] {
  const parts: { type: 'text' | 'article'; content: string; articleId?: string; articleTitle?: string }[] = [];
  const regex = /\[\{([^\]|]+)\|([a-f0-9-]+)\}\]|\[\{([a-f0-9-]+)\}\]/g;
  let lastIndex = 0;

  let match;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', content: text.slice(lastIndex, match.index) });
    }

    if (match[1] && match[2]) {
      // [{title|uuid}]
      parts.push({
        type: 'article',
        content: match[0],
        articleTitle: match[1],
        articleId: match[2],
      });
    } else if (match[3]) {
      // [{uuid}] — старый формат, title подгрузится при рендере
      parts.push({
        type: 'article',
        content: match[0],
        articleId: match[3],
      });
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push({ type: 'text', content: text.slice(lastIndex) });
  }

  return parts;
}
