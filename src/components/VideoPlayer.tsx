import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  LayoutAnimation,
  Platform,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { ThemeColors } from '../utils/themeColors';

interface VideoPlayerProps {
  uri: string;
  title?: string;
}

interface FrameSize {
  width: number;
  height: number;
}

// Результат определения размеров видео (привязан к конкретному источнику)
interface SizeDetection {
  uri: string;
  size: FrameSize | null;
  failed: boolean;
}

// Пропорция по умолчанию, пока неизвестны размеры файла
const DEFAULT_ASPECT_RATIO = 16 / 9;
// Таймаут ожидания метаданных: дольше не держим пользователя на «колёсике»
const METADATA_TIMEOUT_MS = 8000;
// Горизонтальные отступы карточки контента (20 + 20)
const HORIZONTAL_PADDING = 40;
// Максимальная высота кадра — 70% экрана (для вертикальных видео)
const MAX_FRAME_HEIGHT_RATIO = 0.7;

// Плавно анимируем переход от скелетона к реальному кадру (на вебе LayoutAnimation не работает)
const animateFrame = () => {
  if (Platform.OS !== 'web') {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  }
};

// Размер кадра: ширина — во всю карточку, высота по пропорции файла (не выше 70% экрана)
const getFrameSize = (
  screenWidth: number,
  screenHeight: number,
  videoSize: FrameSize | null
): FrameSize => {
  const width = screenWidth - HORIZONTAL_PADDING;
  if (!videoSize || !videoSize.width || !videoSize.height) {
    return { width, height: width / DEFAULT_ASPECT_RATIO };
  }
  const ratio = videoSize.width / videoSize.height;
  return {
    width,
    height: Math.min(width / ratio, screenHeight * MAX_FRAME_HEIGHT_RATIO),
  };
};

function WebVideoPlayer({ uri, title }: VideoPlayerProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const [detection, setDetection] = useState<SizeDetection | null>(null);

  // Данные от другого источника (например, после докачки офлайн-файла) не используем
  const current = detection?.uri === uri ? detection : null;
  const videoSize = current?.size ?? null;
  const detectionFailed = current?.failed ?? false;
  const isLoading = !videoSize && !detectionFailed;

  // Страховка: не держим «колёсико» дольше таймаута
  useEffect(() => {
    if (!isLoading) return;
    const timeout = setTimeout(
      () => setDetection({ uri, size: null, failed: true }),
      METADATA_TIMEOUT_MS
    );
    return () => clearTimeout(timeout);
  }, [isLoading, uri]);

  const createVideo = () => {
    const video = document.createElement('video');
    video.src = uri;
    video.style.width = '100%';
    video.style.height = '100%';
    video.style.objectFit = 'contain';
    video.style.backgroundColor = '#000';
    video.controls = true;
    video.preload = 'metadata';
    // Размеры кадра узнаём из метаданных — до запуска воспроизведения
    video.onloadedmetadata = () => {
      if (video.videoWidth > 0 && video.videoHeight > 0) {
        setDetection({
          uri,
          size: { width: video.videoWidth, height: video.videoHeight },
          failed: false,
        });
      } else {
        setDetection({ uri, size: null, failed: true });
      }
    };
    video.onerror = () => setDetection({ uri, size: null, failed: true });
    return video;
  };

  const frame = getFrameSize(screenWidth, screenHeight, videoSize);

  return (
    <View style={styles.wrapper}>
      <View style={[styles.container, frame]}>
        <div
          // key — чтобы при смене источника создался новый <video>
          key={uri}
          ref={(el) => {
            if (el && !el.firstChild) {
              el.appendChild(createVideo());
            }
          }}
          style={{ width: '100%', height: '100%', backgroundColor: '#000' }}
        />
        {isLoading && (
          <View style={styles.loaderOverlay}>
            <ActivityIndicator color="#ffffff" size="large" />
          </View>
        )}
      </View>
      {title && <Text style={styles.title} numberOfLines={1}>{title}</Text>}
    </View>
  );
}

function NativeVideoPlayer({ uri, title }: VideoPlayerProps) {
  const { VideoView, useVideoPlayer } = require('expo-video') as typeof import('expo-video');
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const [detection, setDetection] = useState<SizeDetection | null>(null);

  const player = useVideoPlayer(uri, (p) => {
    p.loop = true;
    p.bufferOptions = {
      preferredForwardBufferDuration: 60,
      minBufferForPlayback: 1,
    };
  });

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;

    const applySize = (size?: FrameSize | null) => {
      if (!size?.width || !size?.height) return;
      clearTimeout(timeout);
      animateFrame();
      setDetection({ uri, size: { width: size.width, height: size.height }, failed: false });
    };

    const fail = () => setDetection({ uri, size: null, failed: true });

    // Метаданные могли загрузиться ещё до подписки
    applySize(player.availableVideoTracks?.[0]?.size);

    // Основной путь: плеер закончил загрузку метаданных (без запуска воспроизведения)
    const sourceSub = player.addListener('sourceLoad', (payload) => {
      applySize(payload.availableVideoTracks?.[0]?.size);
    });

    // Ошибка загрузки — не оставляем пользователя со спиннером;
    // готовность к воспроизведению — дополнительный шанс получить размеры
    const statusSub = player.addListener('statusChange', (payload) => {
      if (payload.status === 'error') {
        fail();
      } else if (payload.status === 'readyToPlay') {
        applySize(player.availableVideoTracks?.[0]?.size);
      }
    });

    // Страховка по времени
    timeout = setTimeout(fail, METADATA_TIMEOUT_MS);

    return () => {
      sourceSub.remove();
      statusSub.remove();
      clearTimeout(timeout);
    };
  }, [player, uri]);

  // Данные от другого источника не используем
  const current = detection?.uri === uri ? detection : null;
  const videoSize = current?.size ?? null;
  const detectionFailed = current?.failed ?? false;
  const isLoading = !videoSize && !detectionFailed;

  const frame = getFrameSize(screenWidth, screenHeight, videoSize);

  return (
    <View style={styles.wrapper}>
      <View style={[styles.container, frame]}>
        <VideoView
          player={player}
          style={styles.video}
          contentFit="contain"
          nativeControls={true}
          fullscreenOptions={{ enable: true }}
          allowsPictureInPicture
        />
        {isLoading && (
          <View style={styles.loaderOverlay}>
            <ActivityIndicator color="#ffffff" size="large" />
          </View>
        )}
      </View>
      {title && <Text style={styles.title} numberOfLines={1}>{title}</Text>}
    </View>
  );
}

export function VideoPlayer(props: VideoPlayerProps) {
  if (Platform.OS === 'web') {
    return <WebVideoPlayer {...props} />;
  }
  return <NativeVideoPlayer {...props} />;
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  container: {
    backgroundColor: '#000',
    borderRadius: 16,
    overflow: 'hidden',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  loaderOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    paddingTop: 8,
  },
});
