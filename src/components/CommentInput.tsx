import { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  Keyboard,
} from 'react-native';

// Поле ввода комментария
interface CommentInputProps {
  onSubmit: (text: string) => Promise<void>;
  initialText?: string;
  disabled?: boolean;
}

export function CommentInput({ onSubmit, initialText, disabled }: CommentInputProps) {
  const [text, setText] = useState(initialText || '');
  const [loading, setLoading] = useState(false);

  // Отправка комментария
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

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        value={text}
        onChangeText={setText}
        placeholder="Написать комментарий..."
        placeholderTextColor="#666"
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
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.buttonText}>→</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#fff',
    maxHeight: 100,
    marginRight: 8,
  },
  button: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#6c63ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#6c63ff44',
  },
  buttonText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '600',
  },
});
