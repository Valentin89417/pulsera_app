import { useState, useEffect } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Text,
  Keyboard,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { getCategories } from '../services/api';
import { ThemeColors } from '../utils/themeColors';

const MAX_SUGGESTIONS = 5;

interface CategoryInputProps {
  value: string;
  onChangeText: (text: string) => void;
  colors: ThemeColors;
  placeholder?: string;
}

export function CategoryInput({
  value,
  onChangeText,
  colors,
  placeholder = 'meditation, practice, spiritual...',
}: CategoryInputProps) {
  const [allCategories, setAllCategories] = useState<{ name: string; count: number }[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    const categories = await getCategories();
    setAllCategories(categories);
  };

  const getFilteredCategories = () => {
    if (value.trim() === '') {
      return allCategories.slice(0, MAX_SUGGESTIONS);
    }
    const lower = value.toLowerCase();
    const filtered = allCategories.filter(c => c.name.toLowerCase().includes(lower));
    return filtered.slice(0, MAX_SUGGESTIONS);
  };

  const handleFocus = () => {
    setShowDropdown(true);
  };

  const handleSelect = (category: string) => {
    onChangeText(category);
    setShowDropdown(false);
    Keyboard.dismiss();
  };

  const suggestions = getFilteredCategories();
  const styles = createStyles(colors);

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        onFocus={handleFocus}
        placeholder={placeholder}
        placeholderTextColor={colors.placeholder}
        autoCorrect={false}
      />
      {showDropdown && suggestions.length > 0 && (
        <View style={styles.dropdown}>
          {suggestions.map((item) => (
            <TouchableOpacity
              key={item.name}
              activeOpacity={0.6}
              style={styles.suggestionItem}
              onPress={() => handleSelect(item.name)}
            >
              <FontAwesome name="tag" size={12} color={colors.textMuted} />
              <Text style={styles.suggestionText}>{item.name}</Text>
              <Text style={styles.suggestionCount}>{item.count}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {},
    input: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      fontSize: 16,
      color: colors.text,
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    dropdown: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      marginTop: 4,
    },
    suggestionItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    suggestionText: {
      color: colors.text,
      fontSize: 14,
      flex: 1,
    },
    suggestionCount: {
      color: colors.textMuted,
      fontSize: 12,
    },
  });
