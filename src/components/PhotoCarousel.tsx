import { useCallback, useState } from 'react';
import {
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { ThemeColors } from '../utils/themeColors';

interface PhotoCarouselProps {
  uris: string[];
}

// Горизонтальные отступы карточки контента (20 + 20)
const HORIZONTAL_PADDING = 40;
// Кадр 4:3 — компромисс для горизонтальных и вертикальных фото (высота одна для всех слайдов)
const FRAME_ASPECT_RATIO = 4 / 3;

/**
 * Фотокарусель статьи.
 * Один слайд — на всю ширину карточки, высота кадра одинаковая для всех фото.
 * Фото не режутся: resizeMode="contain" вписывает их целиком, вертикальные центрируются.
 */
export function PhotoCarousel({ uris }: PhotoCarouselProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const { width: screenWidth } = useWindowDimensions();
  const [activeIndex, setActiveIndex] = useState(0);
  const [failedIndexes, setFailedIndexes] = useState<Set<number>>(new Set());

  const slideWidth = screenWidth - HORIZONTAL_PADDING;
  const slideHeight = Math.round(slideWidth / FRAME_ASPECT_RATIO);

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (slideWidth <= 0 || uris.length === 0) return;
      const index = Math.round(event.nativeEvent.contentOffset.x / slideWidth);
      setActiveIndex(Math.max(0, Math.min(index, uris.length - 1)));
    },
    [slideWidth, uris.length]
  );

  const handleImageError = (index: number) => {
    setFailedIndexes((prev) => {
      const next = new Set(prev);
      next.add(index);
      return next;
    });
  };

  if (uris.length === 0) return null;

  return (
    <View style={styles.wrapper}>
      <ScrollView
        horizontal
        pagingEnabled
        snapToInterval={slideWidth}
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        onMomentumScrollEnd={handleScroll}
        scrollEventThrottle={16}
        style={styles.scroll}
      >
        {uris.map((uri, index) => (
          <View
            key={`${uri}-${index}`}
            style={[styles.slide, { width: slideWidth, height: slideHeight }]}
          >
            {failedIndexes.has(index) ? (
              <View style={styles.placeholder}>
                <FontAwesome name="image" size={32} color={colors.textMuted} />
              </View>
            ) : (
              <Image
                source={{ uri }}
                style={styles.image}
                resizeMode="contain"
                accessibilityLabel={`Фотография ${index + 1} из ${uris.length}`}
                onError={() => handleImageError(index)}
              />
            )}
          </View>
        ))}
      </ScrollView>

      {/* Точки: количество слайдов и текущая позиция */}
      {uris.length > 1 && (
        <View style={styles.dots}>
          {uris.map((_, index) => (
            <View
              key={index}
              style={[styles.dot, index === activeIndex && styles.dotActive]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    wrapper: {
      width: '100%',
      marginBottom: 20,
    },
    scroll: {
      width: '100%',
    },
    slide: {
      backgroundColor: colors.surfaceLight,
      borderRadius: 16,
      overflow: 'hidden',
    },
    image: {
      width: '100%',
      height: '100%',
    },
    placeholder: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dots: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 10,
      gap: 6,
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.border,
    },
    dotActive: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: colors.primary,
    },
  });
