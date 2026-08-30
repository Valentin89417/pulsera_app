import { StyleSheet } from 'react-native';
import { ThemeColors } from './themeColors';

/**
 * Стили для рендеринга Markdown.
 * Используются в MarkdownEditor (предпросмотр) и content/[id].tsx.
 */
export function getMarkdownStyles(colors: ThemeColors) {
  return StyleSheet.create({
    body: {
      color: colors.text,
      fontSize: 16,
      lineHeight: 26,
    },
    heading1: {
      fontSize: 28,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 12,
      marginTop: 20,
    },
    heading2: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 10,
      marginTop: 18,
    },
    heading3: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
      marginTop: 16,
    },
    paragraph: {
      fontSize: 16,
      color: colors.textSecondary,
      lineHeight: 26,
      marginBottom: 12,
    },
    bold: {
      fontWeight: 'bold',
    },
    italic: {
      fontStyle: 'italic',
    },
    underline: {
      textDecorationLine: 'underline',
    },
    strikethrough: {
      textDecorationLine: 'line-through',
    },
    link: {
      color: colors.primary,
      textDecorationLine: 'underline',
    },
    blockquote: {
      borderLeftWidth: 4,
      borderLeftColor: colors.primary,
      paddingLeft: 12,
      marginLeft: 0,
      marginVertical: 8,
      backgroundColor: colors.primaryAlpha13,
      paddingVertical: 8,
      borderRadius: 4,
    },
    list_item: {
      fontSize: 16,
      color: colors.textSecondary,
      lineHeight: 26,
      marginBottom: 4,
    },
    bullet_list: {
      marginBottom: 12,
    },
    ordered_list: {
      marginBottom: 12,
    },
    hr: {
      backgroundColor: colors.border,
      height: 1,
      marginVertical: 16,
    },
    code_inline: {
      backgroundColor: colors.surface,
      color: colors.primary,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
      fontFamily: 'monospace',
      fontSize: 14,
    },
    code_block: {
      backgroundColor: colors.surface,
      padding: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      fontFamily: 'monospace',
      fontSize: 14,
      lineHeight: 20,
      color: colors.text,
      marginBottom: 12,
    },
    fence: {
      backgroundColor: colors.surface,
      padding: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 12,
    },
    image: {
      marginVertical: 8,
      borderRadius: 8,
    },
    table: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      marginBottom: 12,
    },
    thead: {
      backgroundColor: colors.surface,
    },
    th: {
      padding: 8,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      fontWeight: '600',
    },
    td: {
      padding: 8,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
  });
}
