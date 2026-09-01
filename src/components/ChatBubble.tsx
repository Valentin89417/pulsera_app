import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Modal, TouchableOpacity } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { ThemeColors } from '../utils/themeColors';
import { parseMessageWithArticles, ArticleMention } from './ArticleMention';
import { supabase } from '../services/supabase';

interface ChatBubbleProps {
  message: string;
  sender: 'user' | 'author';
  createdAt: string;
  read?: boolean;
  isOwn: boolean;
  isConsecutive?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}

// Компонент для старого формата [{uuid}] — подгрузит название по ID
function LegacyArticleMention({ articleId }: { articleId: string }) {
  const [title, setTitle] = useState<string>('Статья');

  useEffect(() => {
    const loadTitle = async () => {
      const { data } = await supabase
        .from('content')
        .select('title')
        .eq('id', articleId)
        .single();
      if (data?.title) setTitle(data.title);
    };
    loadTitle();
  }, [articleId]);

  return <ArticleMention articleId={articleId} title={title} />;
}

// Пузырь сообщения в чате
export function ChatBubble({ message, sender, createdAt, read, isOwn, isConsecutive, onEdit, onDelete }: ChatBubbleProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors, isOwn, isConsecutive);
  const [showMenu, setShowMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });

  const parts = parseMessageWithArticles(message);

  const time = new Date(createdAt).toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const handleLongPress = () => {
    if (!isOwn) return;
    setShowMenu(true);
  };

  return (
    <>
      <View style={styles.container}>
        <Pressable onLongPress={handleLongPress} delayLongPress={300}>
          <View style={styles.bubble}>
            <Text style={styles.text}>
              {parts.map((part, index) => {
                if (part.type === 'article' && part.articleId) {
                  if (part.articleTitle) {
                    return (
                      <ArticleMention
                        key={index}
                        articleId={part.articleId}
                        title={part.articleTitle}
                      />
                    );
                  }
                  return <LegacyArticleMention key={index} articleId={part.articleId} />;
                }
                return part.content;
              })}
            </Text>
            <View style={styles.footer}>
              <Text style={styles.time}>{time}</Text>
              {isOwn && (
                <Text style={styles.readStatus}>
                  {read ? '✓✓' : '✓'}
                </Text>
              )}
            </View>
          </View>
        </Pressable>
      </View>

      {/* Контекстное меню */}
      <Modal
        visible={showMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMenu(false)}
      >
        <TouchableOpacity
          style={styles.menuOverlay}
          activeOpacity={1}
          onPress={() => setShowMenu(false)}
        >
          <View style={[styles.menu, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setShowMenu(false);
                onEdit?.();
              }}
            >
              <FontAwesome name="pencil" size={16} color={colors.primary} style={styles.menuIcon} />
              <Text style={[styles.menuText, { color: colors.text }]}>Редактировать</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setShowMenu(false);
                onDelete?.();
              }}
            >
              <FontAwesome name="trash" size={16} color={colors.error} style={styles.menuIcon} />
              <Text style={[styles.menuText, { color: colors.error }]}>Удалить</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const createStyles = (colors: ThemeColors, isOwn: boolean, isConsecutive?: boolean) => {
  return StyleSheet.create({
    container: {
      marginTop: isConsecutive ? 2 : 8,
      marginBottom: 4,
      marginHorizontal: 8,
      paddingLeft: isOwn ? 48 : 0,
      paddingRight: isOwn ? 0 : 48,
    },
    bubble: {
      alignSelf: isOwn ? 'flex-end' : 'flex-start',
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderTopRightRadius: isOwn ? (!isConsecutive ? 4 : 16) : 16,
      borderTopLeftRadius: isOwn ? 16 : (!isConsecutive ? 4 : 16),
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderWidth: 1,
      borderColor: isOwn ? colors.primary : colors.cardBorder,
      overflow: 'hidden',
    },
    text: {
      fontSize: 15,
      color: colors.text,
      lineHeight: 20,
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      alignItems: 'center',
      marginTop: 4,
      gap: 4,
    },
    time: {
      fontSize: 11,
      color: colors.textMuted,
    },
    readStatus: {
      fontSize: 11,
      color: colors.primary,
    },
    menuOverlay: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0,0,0,0.5)',
    },
    menu: {
      borderRadius: 12,
      padding: 4,
      minWidth: 180,
      borderWidth: 1,
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
    },
    menuIcon: {
      marginRight: 12,
      width: 20,
    },
    menuText: {
      fontSize: 15,
    },
  });
};
