import { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { ThemeColors } from '../utils/themeColors';

interface CommentInputProps {
  onSubmit: (text: string) => Promise<void>;
  initialText?: string;
  disabled?: boolean;
}

export function CommentInput({ onSubmit, initialText, disabled }: CommentInputProps) {
  const { colors } = useTheme();
  const [text, setText] = useState(initialText || '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    const trimmed = text.trim();
    if (!trimmed || loading || disabled) return;

    try {
      setLoading(true);
      await onSubmit(trimmed);
      setText('');
      Keyboard.dismiss();
    } catch (error) {
      console.error('Ошибка отправки комментария:', error);
    } finally {
      setLoading(false);
    }
  };

  const styles = createStyles(colors);

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        value={text}
        onChangeText={setText}
        placeholder="Написать комментарий..."
        placeholderTextColor={colors.placeholder}
        multiline
        maxLength={500}
        editable={!loading && !disabled}
      />
      <TouchableOpacity
        style={[styles.button, (!text.trim() || loading || disabled) && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={!text.trim() || loading || disabled}
      >
        {loading ? (
          <ActivityIndicator size="small" color={colors.onPrimary} />
        ) : (
          <FontAwesome name="arrow-right" size={16} color={colors.onPrimary} />
        )}
      </TouchableOpacity>
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: colors.inputBg,
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
    maxHeight: 100,
    marginRight: 8,
  },
  button: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: colors.primaryAlpha27,
  },
});
