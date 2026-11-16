import { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  TextInputSelectionChangeEvent,
  TextInputInstance,
  Alert,
} from 'react-native';
import Markdown from 'react-native-markdown-display';
import { FontAwesome } from '@expo/vector-icons';
import { MarkdownToolbar, ToolbarAction } from './MarkdownToolbar';
import { useTheme } from '../hooks/useTheme';
import { ThemeColors } from '../utils/themeColors';
import { getMarkdownStyles } from '../utils/markdownStyles';
import { pickFile, uploadFile } from '../utils/upload';
import { MarkdownImage } from './MarkdownImage';

interface MarkdownEditorProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

// Позиция каретки/выделения
interface EditorSelection {
  start: number;
  end: number;
}

// Результат применения разметки: новый текст и куда поставить каретку
interface EditResult {
  text: string;
  selection: EditorSelection;
}

// Группа действия: обёртка выделения / префикс строк / вставка блока
type ActionGroup = 'inline' | 'line-prefix' | 'insert';

interface ToolbarActionConfig {
  group: ActionGroup;
  before: string;
  after: string;
  placeholder: string;
}

const ACTION_CONFIGS: Record<ToolbarAction, ToolbarActionConfig> = {
  bold:          { group: 'inline',      before: '**',   after: '**',   placeholder: 'текст' },
  italic:        { group: 'inline',      before: '_',    after: '_',    placeholder: 'текст' },
  underline:     { group: 'inline',      before: '<u>',  after: '</u>', placeholder: 'текст' },
  strikethrough: { group: 'inline',      before: '~~',   after: '~~',   placeholder: 'текст' },
  code:          { group: 'inline',      before: '`',    after: '`',    placeholder: 'код' },
  heading:       { group: 'line-prefix', before: '## ',  after: '',     placeholder: 'Заголовок' },
  bullet:        { group: 'line-prefix', before: '- ',   after: '',     placeholder: 'Пункт списка' },
  numbered:      { group: 'line-prefix', before: '1. ',  after: '',     placeholder: 'Пункт списка' },
  quote:         { group: 'line-prefix', before: '> ',   after: '',     placeholder: 'Цитата' },
  codeblock:     { group: 'insert',      before: '```\n', after: '\n```', placeholder: 'код' },
  link:          { group: 'insert',      before: '[',    after: '](https://)', placeholder: 'текст ссылки' },
  image:         { group: 'insert',      before: '',     after: '',     placeholder: '' },
  table:         { group: 'insert',      before: '',     after: '',     placeholder: '' },
  hr:            { group: 'insert',      before: '',     after: '',     placeholder: '' },
};

// Шаблон таблицы (вставляется как отдельный блок)
const TABLE_TEMPLATE =
  '| Заголовок 1 | Заголовок 2 | Заголовок 3 |\n' +
  '| --- | --- | --- |\n' +
  '| Ячейка 1 | Ячейка 2 | Ячейка 3 |\n';

// Шаблон горизонтальной линии
const HR_TEMPLATE = '---\n';

// Регулярки существующих префиксов строк — чтобы повторное нажатие снимало разметку
const LINE_PREFIX_PATTERNS: Partial<Record<ToolbarAction, RegExp>> = {
  heading: /^#{1,6}\s+/,
  bullet: /^[-*+]\s+/,
  numbered: /^\d+[.)]\s+/,
  quote: /^>\s?/,
};

// Префикс строки для действия (для нумерованного — с порядковым номером)
const getLinePrefix = (action: ToolbarAction, index: number): string => {
  switch (action) {
    case 'heading':
      return '## ';
    case 'bullet':
      return '- ';
    case 'numbered':
      return `${index}. `;
    case 'quote':
      return '> ';
    default:
      return '';
  }
};

// Убрать префикс строки, если он уже есть
const stripLinePrefix = (line: string, action: ToolbarAction): string => {
  const pattern = LINE_PREFIX_PATTERNS[action];
  return pattern ? line.replace(pattern, '') : line;
};

/**
 * Убрать с начала строки любой блочный маркер (список, нумерация, цитата,
 * заголовок). Нужно, чтобы при смене типа блока маркеры заменялись, а не
 * копились: «- abc» + заголовок → «## abc», а не «## - abc».
 */
const stripAnyLinePrefix = (line: string): string => {
  for (const pattern of Object.values(LINE_PREFIX_PATTERNS)) {
    if (pattern.test(line)) return line.replace(pattern, '');
  }
  return line;
};

// Начало строки, в которой стоит позиция
const findLineStart = (text: string, pos: number): number => text.lastIndexOf('\n', pos - 1) + 1;

// Конец строки, в которой стоит позиция
const findLineEnd = (text: string, pos: number): number => {
  const idx = text.indexOf('\n', pos);
  return idx === -1 ? text.length : idx;
};

/**
 * Inline-разметка: обёртка выделения маркерами.
 * Повторное нажатие снимает маркеры — и когда они снаружи выделения, и когда
 * выделены вместе с текстом. Если ничего не выделено — подставляется
 * плейсхолдер, который сразу выделен (печатаешь поверх).
 */
const applyInline = (
  text: string,
  { start, end }: EditorSelection,
  config: ToolbarActionConfig
): EditResult => {
  const { before, after, placeholder } = config;
  const selected = text.slice(start, end);

  // Маркеры уже снаружи: **|выделено|**
  const outerBefore = text.slice(Math.max(0, start - before.length), start);
  const outerAfter = text.slice(end, end + after.length);
  if (selected.length > 0 && outerBefore === before && outerAfter === after) {
    const newText =
      text.slice(0, start - before.length) + selected + text.slice(end + after.length);
    return {
      text: newText,
      selection: { start: start - before.length, end: end - before.length },
    };
  }

  // Маркеры попали в выделение: |**выделено**|
  if (
    selected.length > before.length + after.length &&
    selected.startsWith(before) &&
    selected.endsWith(after)
  ) {
    const inner = selected.slice(before.length, selected.length - after.length);
    return {
      text: text.slice(0, start) + inner + text.slice(end),
      selection: { start, end: start + inner.length },
    };
  }

  const content = selected.length > 0 ? selected : placeholder;
  return {
    text: text.slice(0, start) + before + content + after + text.slice(end),
    selection: { start: start + before.length, end: start + before.length + content.length },
  };
};

/**
 * Блочные префиксы: заголовок, список, нумерация, цитата.
 * Применяются к каждой непустой строке выделения. Повторное нажатие их снимает.
 */
const applyLinePrefix = (
  text: string,
  { start, end }: EditorSelection,
  action: ToolbarAction
): EditResult => {
  const hasSelection = end > start;
  const blockStart = findLineStart(text, start);
  const blockEnd = hasSelection ? findLineEnd(text, Math.max(start, end - 1)) : findLineEnd(text, start);
  const lines = text.slice(blockStart, blockEnd).split('\n');

  const filled = lines.filter((line) => line.trim().length > 0);
  const allPrefixed =
    filled.length > 0 && filled.every((line) => LINE_PREFIX_PATTERNS[action]?.test(line) ?? false);

  let counter = 0;
  const newLines = lines.map((line) => {
    if (line.trim().length === 0) return line;
    const content = allPrefixed ? stripLinePrefix(line, action) : stripAnyLinePrefix(line);
    if (allPrefixed) return content;
    counter += 1;
    return getLinePrefix(action, counter) + content;
  });

  const newBlock = newLines.join('\n');
  const newText = text.slice(0, blockStart) + newBlock + text.slice(blockEnd);

  // С выделением — оставляем выделенным новый блок, без выделения — каретка после префикса
  if (hasSelection) {
    return { text: newText, selection: { start: blockStart, end: blockStart + newBlock.length } };
  }

  const firstLine = newLines[0] ?? '';
  const caret = blockStart + (allPrefixed ? 0 : getLinePrefix(action, 1).length);
  return {
    text: newText,
    selection: { start: caret, end: Math.min(caret, blockStart + firstLine.length) },
  };
};

/**
 * Блочные вставки: ссылка, блок кода, таблица, разделитель.
 * Ссылка и блок кода используют выделение как содержимое, таблица и линия
 * вставляются после выделения и его не затирают.
 */
const applyInsert = (
  text: string,
  { start, end }: EditorSelection,
  action: ToolbarAction,
  config: ToolbarActionConfig
): EditResult => {
  const selected = text.slice(start, end);

  if (action === 'link') {
    const label = selected.length > 0 ? selected : config.placeholder;
    const url = 'https://';
    const markdown = `[${label}](${url})`;
    const urlStart = start + 1 + label.length + 2; // "[" + подпись + "]("
    return {
      text: text.slice(0, start) + markdown + text.slice(end),
      selection: { start: urlStart, end: urlStart + url.length },
    };
  }

  if (action === 'codeblock') {
    const lead = start > 0 && text[start - 1] !== '\n' ? '\n' : '';
    const tail = end < text.length && text[end] !== '\n' ? '\n' : '';
    const content = selected.length > 0 ? selected : config.placeholder;
    const leadFence = '```\n';
    const trailFence = '\n```';
    const block = lead + leadFence + content + trailFence + tail;
    const contentStart = start + lead.length + leadFence.length;
    return {
      text: text.slice(0, start) + block + text.slice(end),
      selection: { start: contentStart, end: contentStart + content.length },
    };
  }

  // Таблица и разделитель — отдельным блоком после выделения
  const template = action === 'table' ? TABLE_TEMPLATE : HR_TEMPLATE;
  const insertAt = end;
  const lead = insertAt > 0 && text[insertAt - 1] !== '\n' ? '\n' : '';
  const block = lead + template;
  const caret = insertAt + block.length;

  return {
    text: text.slice(0, insertAt) + block + text.slice(insertAt),
    selection: selected.length > 0 ? { start, end } : { start: caret, end: caret },
  };
};

// Применить действие тулбара к тексту и текущему выделению
const buildEdit = (
  text: string,
  selection: EditorSelection,
  action: ToolbarAction
): EditResult => {
  const config = ACTION_CONFIGS[action];

  switch (config.group) {
    case 'inline':
      return applyInline(text, selection, config);
    case 'line-prefix':
      return applyLinePrefix(text, selection, action);
    default:
      return applyInsert(text, selection, action, config);
  }
};

export function MarkdownEditor({ value, onChangeText, placeholder }: MarkdownEditorProps) {
  const { colors } = useTheme();
  const [preview, setPreview] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const inputRef = useRef<TextInputInstance>(null);
  const [selection, setSelection] = useState<EditorSelection>({ start: 0, end: 0 });
  // Актуальное выделение для обработчиков кнопок: state может отставать на кадр,
  // а после потери фокуса на Android вообще сбрасываться
  const selectionRef = useRef<EditorSelection>({ start: 0, end: 0 });
  const styles = createStyles(colors);
  const markdownStyles = getMarkdownStyles(colors);

  const markdownRules = {
    image: (node: any) => {
      const { src, alt } = node.attributes;
      return (
        <MarkdownImage key={node.key} uri={src} alt={alt} />
      );
    },
  };

  const handleSelectionChange = useCallback(
    (e: TextInputSelectionChangeEvent) => {
      const next = e.nativeEvent.selection;
      selectionRef.current = next;
      setSelection(next);
    },
    [],
  );

  // Применить результат правки: обновить текст и вернуть каретку/выделение
  const applyEdit = useCallback(
    (result: EditResult) => {
      onChangeText(result.text);
      selectionRef.current = result.selection;
      setSelection(result.selection);

      // Android применяет выделение уже после обновления нативного текста
      setTimeout(() => {
        inputRef.current?.focus();
        selectionRef.current = result.selection;
        setSelection({ ...result.selection });
      }, 50);
    },
    [onChangeText],
  );

  const handleInsertImage = async () => {
    try {
      setUploadingImage(true);

      const file = await pickFile('image');
      if (!file) {
        setUploadingImage(false);
        return;
      }

      const result = await uploadFile(file, 'image');

      const { start, end } = selectionRef.current;
      const markdown = `![${file.name || 'изображение'}](${result.url})`;
      const newText = value.slice(0, start) + markdown + value.slice(end);
      const caret = start + markdown.length;

      setUploadingImage(false);
      applyEdit({ text: newText, selection: { start: caret, end: caret } });
    } catch (error: any) {
      setUploadingImage(false);
      Alert.alert('Ошибка', error.message || 'Не удалось загрузить изображение');
    }
  };

  const handleToolbarAction = (action: ToolbarAction) => {
    if (action === 'image') {
      handleInsertImage();
      return;
    }

    applyEdit(buildEdit(value, selectionRef.current, action));
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.modeButton, !preview && styles.modeButtonActive]}
          onPress={() => setPreview(false)}
        >
          <FontAwesome name="pencil" size={14} color={!preview ? colors.onPrimary : colors.textSecondary} />
          <Text style={[styles.modeText, !preview && styles.modeTextActive]}>Редактор</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeButton, preview && styles.modeButtonActive]}
          onPress={() => setPreview(true)}
        >
          <FontAwesome name="eye" size={14} color={preview ? colors.onPrimary : colors.textSecondary} />
          <Text style={[styles.modeText, preview && styles.modeTextActive]}>Просмотр</Text>
        </TouchableOpacity>
      </View>

      {preview ? (
        <View style={styles.previewContainer}>
          {value ? (
            <Markdown style={markdownStyles} rules={markdownRules}>{value}</Markdown>
          ) : (
            <Text style={styles.emptyPreview}>Нет содержимого для просмотра</Text>
          )}
        </View>
      ) : (
        <>
          <MarkdownToolbar onAction={handleToolbarAction} />
          {uploadingImage && (
            <View style={[styles.uploadOverlay, { backgroundColor: colors.surface }]}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={[styles.uploadText, { color: colors.textSecondary }]}>Загрузка изображения...</Text>
            </View>
          )}
          <TextInput
            ref={inputRef}
            style={styles.input}
            value={value}
            onChangeText={onChangeText}
            onSelectionChange={handleSelectionChange}
            selection={selection}
            placeholder={placeholder || 'Пишите текст в формате Markdown...'}
            placeholderTextColor={colors.placeholder}
            multiline
            textAlignVertical="top"
          />
        </>
      )}
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
    },
    header: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.surface,
    },
    modeButton: {
      flex: 1,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 6,
      paddingVertical: 10,
    },
    modeButtonActive: {
      backgroundColor: colors.primary,
    },
    modeText: {
      fontSize: 13,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    modeTextActive: {
      color: colors.onPrimary,
    },
    input: {
      minHeight: 250,
      padding: 16,
      fontSize: 15,
      color: colors.text,
      lineHeight: 22,
    },
    uploadOverlay: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    uploadText: {
      fontSize: 13,
    },
    previewContainer: {
      padding: 16,
      minHeight: 250,
    },
    emptyPreview: {
      fontSize: 15,
      color: colors.textMuted,
      fontStyle: 'italic',
    },
  });
}
