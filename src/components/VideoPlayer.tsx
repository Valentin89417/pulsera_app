import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Platform,
} from 'react-native';

// Web-специфичный импорт видео
let VideoNative: React.ComponentType<Record<string, unknown>> | null = null;
let ResizeModeNative: Record<string, string> | null = null;
let AVPlaybackStatusType: unknown = null;

if (Platform.OS !== 'web') {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const expoAv = require('expo-av');
  VideoNative = expoAv.Video;
  ResizeModeNative = expoAv.ResizeMode;
  AVPlaybackStatusType = expoAv.AVPlaybackStatus;
}

// Компонент видео-плеера
interface VideoPlayerProps {
  uri: string;
  title?: string;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ========================
// Web-плеер (HTML5 <video>)
// ========================
function WebVideoPlayer({ uri, title }: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Создаём HTML5 video элемент
  useEffect(() => {
    if (!containerRef.current) return;

    const video = document.createElement('video');
    video.src = uri;
    video.style.width = '100%';
    video.style.height = '100%';
    video.style.objectFit = 'contain';
    video.style.backgroundColor = '#000';
    video.preload = 'metadata';

    video.addEventListener('loadedmetadata', () => {
      console.log('[WebVideo] loaded metadata, duration:', video.duration);
      setDuration(video.duration * 1000);
      setIsLoading(false);
    });

    video.addEventListener('timeupdate', () => {
      setPosition(video.currentTime * 1000);
    });

    video.addEventListener('play', () => setIsPlaying(true));
    video.addEventListener('pause', () => setIsPlaying(false));

    video.addEventListener('error', (e) => {
      console.error('[WebVideo] error:', e);
      setError('Не удалось загрузить видео');
      setIsLoading(false);
    });

    video.addEventListener('waiting', () => setIsLoading(true));
    video.addEventListener('canplay', () => setIsLoading(false));

    containerRef.current.innerHTML = '';
    containerRef.current.appendChild(video);
    videoRef.current = video;

    return () => {
      video.pause();
      video.src = '';
      videoRef.current = null;
    };
  }, [uri]);

  const togglePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch(console.error);
    } else {
      video.pause();
    }
  };

  const seekBackward = () => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.max(0, video.currentTime - 15);
  };

  const seekForward = () => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.min(video.duration || 0, video.currentTime + 15);
  };

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (position / duration) * 100 : 0;

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
      {/* HTML5 video */}
      <View style={styles.videoWrapper}>
        {isLoading && (
          <View style={[styles.overlay, { zIndex: 2 }]}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.loadingText}>Загрузка видео...</Text>
          </View>
        )}
        {/* div-контейнер для HTML5 video */}
        <div
          ref={containerRef}
          style={{
            width: '100%',
            height: '100%',
            backgroundColor: '#000',
          }}
        />
        {/* Кнопка Play поверх видео */}
        {!isPlaying && !isLoading && (
          <TouchableOpacity
            style={[styles.overlay, { zIndex: 3 }]}
            onPress={togglePlayPause}
            activeOpacity={0.8}
          >
            <View style={styles.bigPlayButton}>
              <Text style={styles.bigPlayIcon}>▶️</Text>
            </View>
          </TouchableOpacity>
        )}
      </View>

      {/* Управления */}
      {title && (
        <View style={styles.controlsContainer}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>

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

// ========================
// Native-плеер (expo-av)
// ========================
function NativeVideoPlayer({ uri, title }: VideoPlayerProps) {
  const videoRef = useRef<unknown>(null);
  const [status, setStatus] = useState<unknown>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showControls, setShowControls] = useState(true);

  const onPlaybackStatusUpdate = useCallback((newStatus: Record<string, unknown>) => {
    setStatus(newStatus);
    if (newStatus.isLoaded) {
      setPosition(newStatus.positionMillis as number);
      setDuration((newStatus.durationMillis as number) || 0);
      setIsPlaying(newStatus.isPlaying as boolean);
    }
  }, []);

  const togglePlayPause = async () => {
    const ref = videoRef.current as Record<string, unknown> | null;
    if (!ref) return;
    const statusLoaded = status as Record<string, unknown> | null;
    if (!statusLoaded?.isLoaded) return;
    try {
      if (isPlaying) {
        await (ref.pauseAsync as () => Promise<void>)();
      } else {
        await (ref.playAsync as () => Promise<void>)();
      }
    } catch (err) {
      console.error('Ошибка воспроизведения видео:', err);
    }
  };

  const seekBackward = async () => {
    const ref = videoRef.current as Record<string, unknown> | null;
    if (!ref) return;
    const newPosition = Math.max(0, position - 15000);
    await (ref.setPositionAsync as (ms: number) => Promise<void>)(newPosition);
  };

  const seekForward = async () => {
    const ref = videoRef.current as Record<string, unknown> | null;
    if (!ref) return;
    const newPosition = Math.min(duration, position + 15000);
    await (ref.setPositionAsync as (ms: number) => Promise<void>)(newPosition);
  };

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (position / duration) * 100 : 0;

  // expo-av Video загружается динамически
  const ExpoVideo = VideoNative;

  if (isLoading && !ExpoVideo) {
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
      <TouchableOpacity
        activeOpacity={1}
        onPress={() => setShowControls((prev) => !prev)}
        style={styles.videoWrapper}
      >
        {ExpoVideo && (
          <ExpoVideo
            ref={videoRef}
            source={{ uri }}
            style={styles.video}
            resizeMode={ResizeModeNative?.CONTAIN || 'contain'}
            onPlaybackStatusUpdate={onPlaybackStatusUpdate}
            onLoadStart={() => setIsLoading(true)}
            onLoad={(s: Record<string, unknown>) => {
              setDuration((s.durationMillis as number) || 0);
              setIsLoading(false);
            }}
            onError={(err: unknown) => {
              console.error('[NativeVideo] error:', err);
              setError('Не удалось загрузить видео');
              setIsLoading(false);
            }}
            shouldPlay={false}
            useNativeControls={false}
          />
        )}

        {!isPlaying && showControls && (
          <View style={styles.overlay}>
            <TouchableOpacity style={styles.bigPlayButton} onPress={togglePlayPause}>
              <Text style={styles.bigPlayIcon}>▶️</Text>
            </TouchableOpacity>
          </View>
        )}

        {isLoading && (
          <View style={styles.overlay}>
            <ActivityIndicator size="large" color="#fff" />
          </View>
        )}
      </TouchableOpacity>

      {showControls && (
        <View style={styles.controlsContainer}>
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
              <Text style={styles.timeText}>{formatTime(position)}</Text>
              <Text style={styles.timeText}>{formatTime(duration)}</Text>
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

// ========================
// Экспорт: web vs native
// ========================
export function VideoPlayer(props: VideoPlayerProps) {
  if (Platform.OS === 'web') {
    return <WebVideoPlayer {...props} />;
  }
  return <NativeVideoPlayer {...props} />;
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
    position: 'relative',
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
