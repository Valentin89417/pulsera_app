import { useState, useEffect, useRef } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Text,
  Keyboard,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { getCategories } from '../services/api';
import { ThemeColors } from '../utils/themeColors';

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
  const [allCategories, setAllCategories] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [filteredCategories, setFilteredCategories] = useState<string[]>([]);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (value.trim() === '') {
      setFilteredCategories(allCategories);
    } else {
      const lower = value.toLowerCase();
      setFilteredCategories(
        allCategories.filter(c => c.toLowerCase().includes(lower))
      );
    }
  }, [value, allCategories]);

  const loadCategories = async () => {
    const categories = await getCategories();
    setAllCategories(categories);
  };

  const handleFocus = () => {
    setShowDropdown(true);
  };

  const handleBlur = () => {
    setTimeout(() => setShowDropdown(false), 150);
  };

  const handleSelect = (category: string) => {
    onChangeText(category);
    setShowDropdown(false);
    Keyboard.dismiss();
  };

  const styles = createStyles(colors);

  return (
    <View style={styles.container}>
      <TextInput
        ref={inputRef}
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        placeholderTextColor={colors.placeholder}
      />
      {showDropdown && filteredCategories.length > 0 && (
        <View style={styles.dropdown}>
          <FlatList
            data={filteredCategories}
            keyExtractor={(item) => item}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.suggestionItem}
                onPress={() => handleSelect(item)}
              >
                <FontAwesome name="tag" size={12} color={colors.textMuted} />
                <Text style={styles.suggestionText}>{item}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      position: 'relative',
    },
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
      position: 'absolute',
      top: '100%',
      left: 0,
      right: 0,
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      maxHeight: 200,
      zIndex: 1000,
      marginTop: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 4,
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
    },
  });
