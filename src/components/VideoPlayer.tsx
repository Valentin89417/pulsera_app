import { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';

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
  const [isFinished, setIsFinished] = useState(false);

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
    });

    video.addEventListener('timeupdate', () => {
      setPosition(video.currentTime * 1000);
    });

    video.addEventListener('play', () => { setIsPlaying(true); setIsFinished(false); });
    video.addEventListener('pause', () => setIsPlaying(false));

    video.addEventListener('ended', () => {
      setIsPlaying(false);
      setIsFinished(true);
    });

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
    if (isFinished) {
      video.currentTime = 0;
      setIsFinished(false);
    }
    video.play().catch(console.error);
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

  return (
    <View style={styles.container}>
      {title && <Text style={styles.title} numberOfLines={1}>{title}</Text>}
      <View style={styles.videoWrapper}>
        <div ref={containerRef} style={{ width: '100%', height: '100%', backgroundColor: '#000' }} />

        {/* Кнопка Повторить после окончания */}
        {isFinished && (
          <TouchableOpacity style={styles.replayOverlay} onPress={togglePlayPause} activeOpacity={0.8}>
            <View style={styles.replayButton}>
              <Text style={styles.replayIcon}>🔄</Text>
              <Text style={styles.replayLabel}>Повторить</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Кастомные контролы */}
        {!isFinished && (
          <View style={styles.controlsOverlay}>
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
    </View>
  );
}

// ========================
// Native-плеер (expo-video)
// ========================
function NativeVideoPlayer({ uri, title }: VideoPlayerProps) {
  const { VideoView, useVideoPlayer } = require('expo-video') as typeof import('expo-video');

  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isFinished, setIsFinished] = useState(false);
  const videoRef = useRef<any>(null);

  const player = useVideoPlayer(uri, (p) => {
    p.loop = false;
    // Увеличиваем буфер для Android чтобы replay работал из памяти
    p.bufferOptions = {
      preferredForwardBufferDuration: 60,
      minBufferForPlayback: 1,
    };
  });

  useEffect(() => {
    const playingSub = player.addListener('playingChange', (event) => {
      setIsPlaying(event.isPlaying);
      if (event.isPlaying) setIsFinished(false);
    });

    const timeSub = player.addListener('timeUpdate', (event) => {
      setPosition(event.currentTime * 1000);
    });

    const statusSub = player.addListener('statusChange', (event) => {
      if (event.status === 'readyToPlay') {
        setDuration(player.duration * 1000);
        setIsLoading(false);
      }
    });

    const playToEndSub = player.addListener('playToEnd', () => {
      setIsPlaying(false);
      setIsFinished(true);
    });

    return () => {
      playingSub.remove();
      timeSub.remove();
      statusSub.remove();
      playToEndSub.remove();
    };
  }, [player]);

  const togglePlayPause = useCallback(() => {
    if (player.playing) {
      player.pause();
    } else {
      player.play();
    }
  }, [player]);

  const handleReplay = useCallback(() => {
    setIsFinished(false);
    player.replay();
  }, [player]);

  const seekBackward = useCallback(() => {
    player.seekBy(-15);
  }, [player]);

  const seekForward = useCallback(() => {
    player.seekBy(15);
  }, [player]);

  const enterFullscreen = useCallback(() => {
    videoRef.current?.enterFullscreen();
  }, []);

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (position / duration) * 100 : 0;

  return (
    <View style={styles.container}>
      <View style={styles.videoWrapper}>
        <VideoView
          ref={videoRef}
          player={player}
          style={styles.video}
          contentFit="contain"
          nativeControls={false}
          onFirstFrameRender={() => setIsLoading(false)}
        />

        {/* Кнопка Повторить после окончания */}
        {isFinished && (
          <TouchableOpacity style={styles.replayOverlay} onPress={handleReplay} activeOpacity={0.8}>
            <View style={styles.replayButton}>
              <Text style={styles.replayIcon}>🔄</Text>
              <Text style={styles.replayLabel}>Повторить</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Кастомные контролы */}
        {!isFinished && (
          <View style={styles.controlsOverlay}>
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
              <TouchableOpacity style={styles.controlButton} onPress={enterFullscreen}>
                <Text style={styles.controlIcon}>⛶</Text>
                <Text style={styles.controlLabel}> fullscreen</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {title && <Text style={styles.title} numberOfLines={1}>{title}</Text>}
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
    position: 'relative',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    padding: 12,
  },
  // Кнопка Повторить
  replayOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 10,
  },
  replayButton: {
    alignItems: 'center',
  },
  replayIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  replayLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  // Кастомные контролы
  controlsOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingBottom: 8,
    paddingTop: 20,
    zIndex: 5,
  },
  progressContainer: {
    marginBottom: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#444',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 6,
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
    fontSize: 11,
    color: '#ccc',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  controlButton: {
    alignItems: 'center',
  },
  controlIcon: {
    fontSize: 22,
  },
  controlLabel: {
    fontSize: 10,
    color: '#aaa',
    marginTop: 2,
  },
  playButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#6c63ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playIcon: {
    fontSize: 24,
  },
});
