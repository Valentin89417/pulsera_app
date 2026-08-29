import { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Platform,
} from 'react-native';

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
      setDuration(video.duration * 1000);
      setIsLoading(false);
    });

    video.addEventListener('timeupdate', () => {
      setPosition(video.currentTime * 1000);
    });

    video.addEventListener('play', () => setIsPlaying(true));
    video.addEventListener('pause', () => setIsPlaying(false));

    video.addEventListener('error', () => {
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
        <TouchableOpacity style={styles.retryButton} onPress={() => { setError(null); setIsLoading(true); }}>
          <Text style={styles.retryText}>Повторить</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.videoWrapper}>
        {isLoading && (
          <View style={[styles.overlay, { zIndex: 2 }]}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.loadingText}>Загрузка видео...</Text>
          </View>
        )}
        <div ref={containerRef} style={{ width: '100%', height: '100%', backgroundColor: '#000' }} />
        {!isPlaying && !isLoading && (
          <TouchableOpacity style={[styles.overlay, { zIndex: 3 }]} onPress={togglePlayPause} activeOpacity={0.8}>
            <View style={styles.bigPlayButton}>
              <Text style={styles.bigPlayIcon}>▶️</Text>
            </View>
          </TouchableOpacity>
        )}
      </View>
      {title && (
        <View style={styles.controlsContainer}>
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
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
            <TouchableOpacity style={styles.playButton} onPress={togglePlayPause} activeOpacity={0.7}>
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
// Native-плеер (expo-video)
// ========================
function NativeVideoPlayer({ uri, title }: VideoPlayerProps) {
  // expo-video импортируется динамически чтобы не ломать web-сборку
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { VideoView, useVideoPlayer } = require('expo-video') as typeof import('expo-video');

  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showControls, setShowControls] = useState(true);

  const player = useVideoPlayer(uri, (p) => {
    p.loop = false;
  });

  // Статус завершения видео (для replay без перезагрузки)
  const isFinishedRef = useRef(false);

  // Подписка на события плеера
  useEffect(() => {
    const playingSub = player.addListener('playingChange', (event) => {
      setIsPlaying(event.isPlaying);
    });

    const timeSub = player.addListener('timeUpdate', (event) => {
      setPosition(event.currentTime * 1000);
      // Отслеживаем окончание видео
      if (event.currentTime >= (player.duration || 0) - 0.3) {
        isFinishedRef.current = true;
      }
    });

    const statusSub = player.addListener('statusChange', (event) => {
      if (event.status === 'readyToPlay') {
        setDuration(player.duration * 1000);
        setIsLoading(false);
      } else if (event.status === 'error') {
        setError('Не удалось загрузить видео');
        setIsLoading(false);
      }
    });

    const playToEndSub = player.addListener('playToEnd', () => {
      setIsPlaying(false);
      isFinishedRef.current = true;
    });

    return () => {
      playingSub.remove();
      timeSub.remove();
      statusSub.remove();
      playToEndSub.remove();
    };
  }, [player]);

  const togglePlayPause = () => {
    if (player.playing) {
      player.pause();
    } else {
      if (isFinishedRef.current) {
        // Видео завершилось — replay через seekBy на полную длительность
        isFinishedRef.current = false;
        player.seekBy(-player.duration);
      }
      player.play();
    }
  };

  const seekBackward = () => {
    player.currentTime = Math.max(0, player.currentTime - 15);
  };

  const seekForward = () => {
    player.currentTime = Math.min(player.duration || 0, player.currentTime + 15);
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
        <TouchableOpacity style={styles.retryButton} onPress={() => { setError(null); setIsLoading(true); }}>
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
        {isLoading && (
          <View style={[styles.overlay, { zIndex: 2 }]}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.loadingText}>Загрузка видео...</Text>
          </View>
        )}
        <VideoView
          player={player}
          style={styles.video}
          contentFit="contain"
        />
        {/* Кастомная кнопка Play поверх видео */}
        {!isPlaying && !isLoading && showControls && (
          <TouchableOpacity style={[styles.overlay, { zIndex: 3 }]} onPress={togglePlayPause} activeOpacity={0.8}>
            <View style={styles.bigPlayButton}>
              <Text style={styles.bigPlayIcon}>▶️</Text>
            </View>
          </TouchableOpacity>
        )}
      </TouchableOpacity>

      {/* Кастомные контролы внизу */}
      {showControls && (
        <View style={styles.controlsContainer}>
          {title && <Text style={styles.title} numberOfLines={1}>{title}</Text>}

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
            <TouchableOpacity style={styles.playButton} onPress={togglePlayPause} activeOpacity={0.7}>
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
