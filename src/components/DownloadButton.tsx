import { TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useDownloadStore } from '../store/downloadStore';
import { useTheme } from '../hooks/useTheme';
import { ThemeColors } from '../utils/themeColors';
import { ContentItem } from '../types';

interface DownloadButtonProps {
  item: ContentItem;
  size?: 'small' | 'medium';
}

export function DownloadButton({ item, size = 'medium' }: DownloadButtonProps) {
  const { colors } = useTheme();
  // Подписываемся напрямую на store — перерендер при изменении downloadedIds/downloadingIds
  const downloadedIds = useDownloadStore((s) => s.downloadedIds);
  const downloadingIds = useDownloadStore((s) => s.downloadingIds);
  const toggleDownload = useDownloadStore((s) => s.toggleDownload);

  const downloaded = downloadedIds.has(item.id);
  const downloading = downloadingIds.has(item.id);

  const handlePress = async () => {
    if (downloading) return;

    // Если уже скачано — спрашиваем удалить ли
    if (downloaded) {
      Alert.alert(
        'Удалить из кэша?',
        `Удалить «${item.title}» из скачанного?`,
        [
          { text: 'Отмена', style: 'cancel' },
          {
            text: 'Удалить',
            style: 'destructive',
            onPress: () => toggleDownload(item),
          },
        ]
      );
      return;
    }

    // Скачиваем
    await toggleDownload(item);
  };

  const iconSize = size === 'small' ? 18 : 22;

  // Определяем иконку
  let iconName: string;
  let iconColor: string;

  if (downloading) {
    iconName = 'spinner';
    iconColor = colors.primary;
  } else if (downloaded) {
    iconName = 'check-circle';
    iconColor = colors.primary;
  } else {
    iconName = 'cloud-download';
    iconColor = colors.primary;
  }

  const styles = createStyles(colors);

  if (downloading) {
    return (
      <TouchableOpacity
        style={[styles.button, size === 'small' && styles.buttonSmall]}
        disabled
      >
        <ActivityIndicator size="small" color={colors.primary} />
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.button, size === 'small' && styles.buttonSmall]}
      onPress={handlePress}
    >
      <FontAwesome name={iconName as any} size={iconSize} color={iconColor} />
    </TouchableOpacity>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    button: {
      padding: 10,
      borderRadius: 20,
      backgroundColor: '#ffffff22',
    },
    buttonSmall: {
      padding: 6,
    },
  });
