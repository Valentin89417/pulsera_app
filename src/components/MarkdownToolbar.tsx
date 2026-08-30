import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { ThemeColors } from '../utils/themeColors';

export type ToolbarAction =
  | 'bold'
  | 'italic'
  | 'underline'
  | 'strikethrough'
  | 'heading'
  | 'bullet'
  | 'numbered'
  | 'quote'
  | 'code'
  | 'codeblock'
  | 'link'
  | 'image'
  | 'table'
  | 'hr';

interface ToolbarItem {
  action: ToolbarAction;
  icon: string;
}

interface MarkdownToolbarProps {
  onAction: (action: ToolbarAction) => void;
}

// Ряд 1: Форматирование + Структура
const ROW_1: ToolbarItem[] = [
  { action: 'bold', icon: 'bold' },
  { action: 'italic', icon: 'italic' },
  { action: 'underline', icon: 'underline' },
  { action: 'strikethrough', icon: 'strikethrough' },
  { action: 'heading', icon: 'header' },
  { action: 'bullet', icon: 'list-ul' },
  { action: 'numbered', icon: 'list-ol' },
];

// Ряд 2: Блоки + Вставка
const ROW_2: ToolbarItem[] = [
  { action: 'quote', icon: 'quote-left' },
  { action: 'code', icon: 'code' },
  { action: 'codeblock', icon: 'file-code-o' },
  { action: 'link', icon: 'link' },
  { action: 'image', icon: 'picture-o' },
  { action: 'table', icon: 'table' },
  { action: 'hr', icon: 'minus' },
];

export function MarkdownToolbar({ onAction }: MarkdownToolbarProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  const renderRow = (items: ToolbarItem[]) =>
    items.map((item) => (
      <TouchableOpacity
        key={item.action}
        style={[styles.button, { backgroundColor: colors.cardIconBg }]}
        onPress={() => onAction(item.action)}
      >
        <FontAwesome name={item.icon as any} size={15} color={colors.cardIconColor} />
      </TouchableOpacity>
    ));

  return (
    <View style={[styles.container, { borderBottomColor: colors.border }]}>
      <View style={styles.row}>{renderRow(ROW_1)}</View>
      <View style={styles.row}>{renderRow(ROW_2)}</View>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      paddingVertical: 6,
      paddingHorizontal: 8,
      gap: 6,
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 6,
    },
    button: {
      width: 34,
      height: 34,
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });
}
