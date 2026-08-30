import { useState, useEffect } from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useAuthStore } from '../store/authStore';
import { addBookmark, removeBookmark, isBookmarked } from '../services/api';

// Кнопка добавления/удаления закладки
interface BookmarkButtonProps {
  contentId: string;
  size?: 'small' | 'medium';
}

export function BookmarkButton({ contentId, size = 'medium' }: BookmarkButtonProps) {
  const { user } = useAuthStore();
  const [bookmarked, setBookmarked] = useState(false);
  const [loading, setLoading] = useState(false);

  // Проверяем статус закладки при загрузке
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

  // Переключение закладки
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

  if (loading) {
    return (
      <TouchableOpacity style={[styles.button, size === 'small' && styles.buttonSmall]} disabled>
        <ActivityIndicator size="small" color="#6c63ff" />
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={[styles.button, size === 'small' && styles.buttonSmall]} onPress={toggleBookmark}>
      <Text style={[styles.icon, size === 'small' && styles.iconSmall]}>
        {bookmarked ? '❤️' : '🤍'}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    padding: 10,
    borderRadius: 20,
    backgroundColor: '#ffffff11',
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
