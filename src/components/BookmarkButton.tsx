import { useState, useEffect } from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useAuthStore } from '../store/authStore';
import { addBookmark, removeBookmark, isBookmarked } from '../services/api';
import { useTheme } from '../hooks/useTheme';
import { ThemeColors } from '../utils/themeColors';

interface BookmarkButtonProps {
  contentId: string;
  size?: 'small' | 'medium';
}

export function BookmarkButton({ contentId, size = 'medium' }: BookmarkButtonProps) {
  const { user } = useAuthStore();
  const { colors } = useTheme();
  const [bookmarked, setBookmarked] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkBookmark();
  }, [contentId, user?.id]);

  const checkBookmark = async () => {
    if (!user) return;
    try {
      const result = await isBookmarked(user.id, contentId);
      setBookmarked(result);
    } catch (error) {
      console.error('Ошибка проверки закладки:', error);
    }
  };

  const toggleBookmark = async () => {
    if (!user || loading) return;
    
    try {
      setLoading(true);
      
      if (bookmarked) {
        const success = await removeBookmark(user.id, contentId);
        if (success) setBookmarked(false);
      } else {
        const success = await addBookmark(user.id, contentId);
        if (success) setBookmarked(true);
      }
    } catch (error) {
      console.error('Ошибка переключения закладки:', error);
    } finally {
      setLoading(false);
    }
  };

  const styles = createStyles(colors);

  if (loading) {
    return (
      <TouchableOpacity style={[styles.button, size === 'small' && styles.buttonSmall]} disabled>
        <ActivityIndicator size="small" color={colors.primary} />
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={[styles.button, size === 'small' && styles.buttonSmall]} onPress={toggleBookmark}>
      <FontAwesome
        name={bookmarked ? 'heart' : 'heart-o'}
        size={size === 'small' ? 18 : 22}
        color={colors.primary}
      />
    </TouchableOpacity>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  button: {
    padding: 10,
    borderRadius: 20,
    backgroundColor: '#ffffff22',
  },
  buttonSmall: {
    padding: 6,
  },
  icon: {
    fontSize: 22,
  },
  iconSmall: {
    fontSize: 18,
  },
});
