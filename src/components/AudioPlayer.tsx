import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useTheme } from '../hooks/useTheme';
import { ThemeColors } from '../utils/themeColors';

interface AudioPlayerProps {
  uri: string;
  title?: string;
}

export function AudioPlayer({ uri, title }: AudioPlayerProps) {
  const { colors } = useTheme();
  const player = useAudioPlayer(uri);
  const status = useAudioPlayerStatus(player);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (uri) {
      setError(null);
      player.replace(uri);
    }
  }, [uri]);

  const togglePlayPause = () => {
    if (!status?.isLoaded) return;
    try {
      if (status.playing) {
        player.pause();
      } else {
        player.play();
      }
    } catch (err) {
      console.error('Ошибка воспроизведения:', err);
    }
  };

  const seekBackward = async () => {
    if (!status?.isLoaded) return;
    const newPosition = Math.max(0, player.currentTime - 15);
    await player.seekTo(newPosition);
  };

  const seekForward = async () => {
    if (!status?.isLoaded) return;
    const newPosition = Math.min(player.duration, player.currentTime + 15);
    await player.seekTo(newPosition);
  };

  const formatTime = (seconds: number) => {
    const totalSeconds = Math.floor(seconds);
    const minutes = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const positionMs = (status?.currentTime ?? 0) * 1000;
  const durationMs = (status?.duration ?? 0) * 1000;
  const progress = durationMs > 0 ? (positionMs / durationMs) * 100 : 0;

  const styles = createStyles(colors);

  if (!status?.isLoaded && !error) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Загрузка аудио...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => player.replace(uri)}>
          <Text style={styles.retryText}>Повторить</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {title && (
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
      )}

      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
        <View style={styles.timeRow}>
          <Text style={styles.timeText}>{formatTime(positionMs / 1000)}</Text>
          <Text style={styles.timeText}>{formatTime(durationMs / 1000)}</Text>
        </View>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity style={styles.controlButton} onPress={seekBackward}>
          <Text style={styles.controlIcon}>⏪</Text>
          <Text style={styles.controlLabel}>15</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.playButton}
          onPress={togglePlayPause}
          activeOpacity={0.7}
        >
          <Text style={styles.playIcon}>{status?.playing ? '⏸' : '▶️'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.controlButton} onPress={seekForward}>
          <Text style={styles.controlIcon}>⏩</Text>
          <Text style={styles.controlLabel}>15</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  progressContainer: {
    width: '100%',
    marginBottom: 16,
  },
  progressBar: {
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
  },
  controlButton: {
    alignItems: 'center',
  },
  controlIcon: {
    fontSize: 24,
  },
  controlLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 2,
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playIcon: {
    fontSize: 28,
  },
  loadingText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 12,
  },
  errorIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  retryText: {
    color: colors.onPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
});
