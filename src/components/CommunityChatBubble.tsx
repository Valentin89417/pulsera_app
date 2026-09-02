import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Modal, TouchableOpacity, Image } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { ThemeColors } from '../utils/themeColors';
import { parseMessageWithArticles, ArticleMention } from './ArticleMention';

interface CommunityChatBubbleProps {
  message: string;
  authorName: string | null;
  authorAvatarUrl: string | null;
  createdAt: string;
  isOwn: boolean;
  isConsecutive?: boolean;
  edited?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function CommunityChatBubble({
  message,
  authorName,
  authorAvatarUrl,
  createdAt,
  isOwn,
  isConsecutive,
  edited,
  onEdit,
  onDelete,
}: CommunityChatBubbleProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors, isOwn, isConsecutive);
  const [showMenu, setShowMenu] = useState(false);

  const parts = parseMessageWithArticles(message);

  const time = new Date(createdAt).toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const displayName = authorName || 'Аноним';
  const avatarLetter = displayName.charAt(0).toUpperCase();

  const handleLongPress = () => {
    if (!isOwn) return;
    setShowMenu(true);
  };

  return (
    <>
      <View style={styles.container}>
        {/* Аватар + имя (только для чужих сообщений, если не consecutive) */}
        {!isOwn && !isConsecutive && (
          <View style={styles.authorRow}>
            {authorAvatarUrl ? (
              <Image source={{ uri: authorAvatarUrl }} style={styles.avatarImage} />
            ) : (
              <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
                <Text style={[styles.avatarText, { color: colors.onPrimary }]}>{avatarLetter}</Text>
              </View>
            )}
            <Text style={[styles.authorName, { color: colors.primary }]}>{displayName}</Text>
          </View>
        )}

        {/* Пузырь сообщения */}
        <Pressable onLongPress={handleLongPress} delayLongPress={300}>
          <View style={styles.bubble}>
            <Text style={styles.text}>
              {parts.map((part, index) => {
                if (part.type === 'article' && part.articleId && part.articleTitle) {
                  return (
                    <ArticleMention
                      key={index}
                      articleId={part.articleId}
                      title={part.articleTitle}
                    />
                  );
                }
                return part.content;
              })}
            </Text>
            <View style={styles.footer}>
              {edited && <Text style={styles.edited}>ред.</Text>}
              <Text style={styles.time}>{time}</Text>
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
      marginTop: isConsecutive ? 2 : 10,
      marginBottom: 2,
      marginHorizontal: 12,
      paddingLeft: isOwn ? 60 : 0,
      paddingRight: isOwn ? 0 : 60,
    },
    authorRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4,
      marginLeft: 4,
    },
    avatar: {
      width: 28,
      height: 28,
      borderRadius: 14,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 8,
    },
    avatarImage: {
      width: 28,
      height: 28,
      borderRadius: 14,
      marginRight: 8,
    },
    avatarText: {
      fontSize: 12,
      fontWeight: 'bold',
    },
    authorName: {
      fontSize: 13,
      fontWeight: '600',
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
    edited: {
      fontSize: 10,
      color: colors.textMuted,
      fontStyle: 'italic',
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
