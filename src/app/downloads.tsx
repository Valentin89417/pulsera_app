import { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { useDownloadStore } from '../store/downloadStore';
import { DownloadMeta } from '../utils/offlineCache';
import { useTheme } from '../hooks/useTheme';
import { ThemeColors } from '../utils/themeColors';

function DownloadItem({
  item,
  onPress,
  onDelete,
  colors,
}: {
  item: DownloadMeta;
  onPress: () => void;
  onDelete: () => void;
  colors: ThemeColors;
}) {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'article': return 'file-text-o';
      case 'video': return 'film';
      case 'audio': return 'headphones';
      case 'course': return 'book';
      default: return 'file-o';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'article': return 'Статья';
      case 'video': return 'Видео';
      case 'audio': return 'Аудио';
      case 'course': return 'Курс';
      default: return 'Контент';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
    });
  };

  const createItemStyles = (colors: ThemeColors) =>
    StyleSheet.create({
      card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: colors.cardBorder,
      },
      cardIcon: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: colors.cardIconBg,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
      },
      cardContent: {
        flex: 1,
      },
      cardTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: colors.text,
        marginBottom: 4,
      },
      cardMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
      },
      cardType: {
        fontSize: 12,
        color: colors.primary,
        fontWeight: '500',
      },
      cardDate: {
        fontSize: 12,
        color: colors.textMuted,
      },
      deleteButton: {
        padding: 8,
      },
    });

  const styles = createItemStyles(colors);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.cardIcon}>
        <FontAwesome
          name={getTypeIcon(item.type) as any}
          size={22}
          color={colors.cardIconColor}
        />
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <View style={styles.cardMeta}>
          <Text style={styles.cardType}>{getTypeLabel(item.type)}</Text>
          <Text style={styles.cardDate}>{formatDate(item.downloadedAt)}</Text>
        </View>
      </View>
      <TouchableOpacity style={styles.deleteButton} onPress={onDelete}>
        <FontAwesome name="trash-o" size={18} color={colors.error} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

export default function DownloadsScreen() {
  const router = useRouter();
  const { downloads, loadDownloads, toggleDownload } = useDownloadStore();
  const { colors } = useTheme();

  useEffect(() => {
    loadDownloads();
  }, []);

  const handleItemPress = (id: string) => {
    router.push(`/content/${id}`);
  };

  const handleDelete = (item: DownloadMeta) => {
    Alert.alert(
      'Удалить из кэша?',
      `Удалить «${item.title}» из скачанного?`,
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: async () => {
            // Находим ContentItem-подобный объект для toggleDownload
            const fakeItem = {
              id: item.id,
              title: item.title,
              type: item.type,
              content_data: {},
            } as any;
            await toggleDownload(fakeItem);
          },
        },
      ]
    );
  };

  const createStyles = (colors: ThemeColors) =>
    StyleSheet.create({
      container: {
        flex: 1,
        backgroundColor: colors.background,
      },
      header: {
        paddingTop: 60,
        paddingHorizontal: 20,
        paddingBottom: 16,
      },
      backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
      },
      backText: {
        color: colors.primary,
        fontSize: 16,
        marginLeft: 6,
      },
      headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: colors.text,
      },
      list: {
        paddingHorizontal: 20,
        paddingBottom: 40,
      },
      emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
      },
      emptyIcon: {
        fontSize: 64,
        marginBottom: 16,
      },
      emptyTitle: {
        fontSize: 22,
        fontWeight: '600',
        color: colors.text,
        marginBottom: 8,
      },
      emptyText: {
        fontSize: 15,
        color: colors.textSecondary,
        textAlign: 'center',
        lineHeight: 22,
      },
    });

  const styles = createStyles(colors);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <FontAwesome name="arrow-left" size={16} color={colors.primary} />
          <Text style={styles.backText}>Назад</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Скачанное</Text>
      </View>

      {downloads.length === 0 ? (
        <View style={styles.emptyContainer}>
          <FontAwesome name="cloud-download" size={64} color={colors.primary} />
          <Text style={styles.emptyTitle}>Нет скачанного</Text>
          <Text style={styles.emptyText}>
            Нажимайте{' '}
            <FontAwesome name="cloud-download" size={14} color={colors.primary} />
            {' '}на контенте чтобы сохранить его для офлайн-чтения
          </Text>
        </View>
      ) : (
        <FlatList
          data={downloads}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <DownloadItem
              item={item}
              onPress={() => handleItemPress(item.id)}
              onDelete={() => handleDelete(item)}
              colors={colors}
            />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}
