import { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  NativeSyntheticEvent,
  TextInputSelectionChangeEventData,
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

interface ToolbarActionConfig {
  before: string;
  after: string;
  placeholder: string;
  /** Если true — вставка как новая строка (для блочных элементов) */
  block?: boolean;
}

const ACTION_CONFIGS: Record<ToolbarAction, ToolbarActionConfig> = {
  bold:          { before: '**',    after: '**',   placeholder: 'текст' },
  italic:        { before: '_',     after: '_',    placeholder: 'текст' },
  underline:     { before: '<u>',   after: '</u>', placeholder: 'текст' },
  strikethrough: { before: '~~',    after: '~~',   placeholder: 'текст' },
  heading:       { before: '## ',   after: '',     placeholder: 'Заголовок' },
  bullet:        { before: '\n- ', after: '',     placeholder: 'Пункт списка', block: false },
  numbered:      { before: '\n1. ', after: '',    placeholder: 'Пункт списка', block: false },
  quote:         { before: '\n> ', after: '',     placeholder: 'Цитата', block: false },
  code:          { before: '`',     after: '`',    placeholder: 'код' },
  codeblock:     { before: '\n```\n', after: '\n```', placeholder: 'код', block: false },
  link:          { before: '[',     after: '](https://)', placeholder: 'текст ссылки' },
  image:         { before: '',      after: '',     placeholder: '', block: false },
  table:         { before: '\n| Заголовок 1 | Заголовок 2 | Заголовок 3 |\n| --- | --- | --- |\n| Ячейка 1 | Ячейка 2 | Ячейка 3 |\n', after: '', placeholder: '', block: false },
  hr:            { before: '\n---\n', after: '',   placeholder: '', block: false },
};

export function MarkdownEditor({ value, onChangeText, placeholder }: MarkdownEditorProps) {
  const { colors } = useTheme();
  const [preview, setPreview] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const [selection, setSelection] = useState<{ start: number; end: number }>({ start: 0, end: 0 });
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
    (e: NativeSyntheticEvent<TextInputSelectionChangeEventData>) => {
      setSelection(e.nativeEvent.selection);
    },
    [],
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

      const cursorPos = selection.start;
      const before = value.slice(0, cursorPos);
      const after = value.slice(cursorPos);
      const markdown = `![${file.name || 'изображение'}](${result.url})`;
      const newText = before + markdown + after;

      onChangeText(newText);
      setUploadingImage(false);

      setTimeout(() => {
        inputRef.current?.focus();
        const newPos = cursorPos + markdown.length;
        setSelection({ start: newPos, end: newPos });
      }, 50);
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

    const config = ACTION_CONFIGS[action];
    const cursorPos = selection.start;

    const before = value.slice(0, cursorPos);
    const after = value.slice(cursorPos);

    let insert = config.before + config.placeholder + config.after;
    if (config.block && before.length > 0 && !before.endsWith('\n')) {
      insert = '\n' + insert;
    }

    const newText = before + insert + after;
    onChangeText(newText);

    const newCursorPos = cursorPos + config.before.length;
    setTimeout(() => {
      inputRef.current?.focus();
      setSelection({ start: newCursorPos, end: newCursorPos + config.placeholder.length });
    }, 50);
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
