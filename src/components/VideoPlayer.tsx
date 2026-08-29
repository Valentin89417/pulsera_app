import { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
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

  const createVideo = () => {
    const video = document.createElement('video');
    video.src = uri;
    video.style.width = '100%';
    video.style.height = '100%';
    video.style.objectFit = 'contain';
    video.style.backgroundColor = '#000';
    video.controls = true;
    video.preload = 'metadata';
    return video;
  };

  return (
    <View style={styles.container}>
      {title && <Text style={styles.title} numberOfLines={1}>{title}</Text>}
      <div
        ref={(el) => {
          if (el && !el.firstChild) {
            el.appendChild(createVideo());
          }
        }}
        style={{ width: '100%', height: '100%', backgroundColor: '#000' }}
      />
    </View>
  );
}

// ========================
// Native-плеер (expo-video с нативными контролами)
// ========================
function NativeVideoPlayer({ uri, title }: VideoPlayerProps) {
  const { VideoView, useVideoPlayer } = require('expo-video') as typeof import('expo-video');

  const player = useVideoPlayer(uri, (p) => {
    p.loop = true;
    p.bufferOptions = {
      preferredForwardBufferDuration: 60,
      minBufferForPlayback: 1,
    };
  });

  return (
    <View style={styles.container}>
      <VideoView
        player={player}
        style={styles.video}
        contentFit="contain"
        nativeControls={true}
        fullscreenOptions={{ enable: true }}
        allowsPictureInPicture
      />
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
  video: {
    width: SCREEN_WIDTH - 40,
    height: (SCREEN_WIDTH - 40) * (9 / 16),
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    padding: 12,
  },
});
