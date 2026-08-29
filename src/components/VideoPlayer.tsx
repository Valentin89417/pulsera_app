import { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Video, AVPlaybackStatus, ResizeMode } from 'expo-av';

// Компонент видео-плеера
interface VideoPlayerProps {
  uri: string;
  title?: string;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export function VideoPlayer({ uri, title }: VideoPlayerProps) {
  const videoRef = useRef<Video>(null);
  const [status, setStatus] = useState<AVPlaybackStatus | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showControls, setShowControls] = useState(true);

  // Обновление статуса воспроизведения
  const onPlaybackStatusUpdate = useCallback((newStatus: AVPlaybackStatus) => {
    setStatus(newStatus);
    if (newStatus.isLoaded) {
      setPosition(newStatus.positionMillis);
      setDuration(newStatus.durationMillis || 0);
      setIsPlaying(newStatus.isPlaying);
    }
  }, []);

  // Воспроизведение / пауза
  const togglePlayPause = async () => {
    if (!videoRef.current || !status?.isLoaded) return;
    try {
      if (isPlaying) {
        await videoRef.current.pauseAsync();
      } else {
        await videoRef.current.playAsync();
      }
    } catch (err) {
      console.error('Ошибка воспроизведения видео:', err);
    }
  };

  // Перемотка назад (15 сек)
  const seekBackward = async () => {
    if (!videoRef.current || !status?.isLoaded) return;
    const newPosition = Math.max(0, position - 15000);
    await videoRef.current.setPositionAsync(newPosition);
  };

  // Перемотка вперёд (15 сек)
  const seekForward = async () => {
    if (!videoRef.current || !status?.isLoaded) return;
    const newPosition = Math.min(duration, position + 15000);
    await videoRef.current.setPositionAsync(newPosition);
  };

  // Форматирование времени
  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Прогресс-бар
  const progress = duration > 0 ? (position / duration) * 100 : 0;

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#6c63ff" />
        <Text style={styles.loadingText}>Загрузка видео...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => {
            setError(null);
            setIsLoading(true);
          }}
        >
          <Text style={styles.retryText}>Повторить</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Видео */}
      <TouchableOpacity
        activeOpacity={1}
        onPress={() => setShowControls((prev) => !prev)}
        style={styles.videoWrapper}
      >
        <Video
          ref={videoRef}
          source={{ uri }}
          style={styles.video}
          resizeMode={ResizeMode.CONTAIN}
          onPlaybackStatusUpdate={onPlaybackStatusUpdate}
          onLoadStart={() => setIsLoading(true)}
          onLoad={() => setIsLoading(false)}
          onError={(err) => {
            console.error('Ошибка видео:', err);
            setError('Не удалось загрузить видео');
            setIsLoading(false);
          }}
          shouldPlay={false}
          useNativeControls={false}
        />

        {/* Оверлей с кнопкой Play (когда пауза) */}
        {!isPlaying && showControls && (
          <View style={styles.overlay}>
            <TouchableOpacity style={styles.bigPlayButton} onPress={togglePlayPause}>
              <Text style={styles.bigPlayIcon}>▶️</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Индикатор загрузки поверх видео */}
        {isLoading && (
          <View style={styles.overlay}>
            <ActivityIndicator size="large" color="#fff" />
          </View>
        )}
      </TouchableOpacity>

      {/* Управления внизу */}
      {showControls && (
        <View style={styles.controlsContainer}>
          {/* Название */}
          {title && (
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
          )}

          {/* Прогресс-бар */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
            <View style={styles.timeRow}>
              <Text style={styles.timeText}>{formatTime(position)}</Text>
              <Text style={styles.timeText}>{formatTime(duration)}</Text>
            </View>
          </View>

          {/* Кнопки управления */}
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
              <Text style={styles.playIcon}>{isPlaying ? '⏸' : '▶️'}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.controlButton} onPress={seekForward}>
              <Text style={styles.controlIcon}>⏩</Text>
              <Text style={styles.controlLabel}>15</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#000',
    borderRadius: 16,
    overflow: 'hidden',
  },
  videoWrapper: {
    width: SCREEN_WIDTH - 40,
    height: (SCREEN_WIDTH - 40) * (9 / 16),
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  bigPlayButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(108, 99, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bigPlayIcon: {
    fontSize: 32,
  },
  controlsContainer: {
    padding: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  progressContainer: {
    width: '100%',
    marginBottom: 12,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#333',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6c63ff',
    borderRadius: 2,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeText: {
    fontSize: 12,
    color: '#999',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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
    color: '#999',
    marginTop: 2,
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#6c63ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playIcon: {
    fontSize: 28,
  },
  loadingText: {
    fontSize: 14,
    color: '#999',
    marginTop: 12,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#999',
    marginBottom: 12,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#6c63ff',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  retryText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
