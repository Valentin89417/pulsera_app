import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  ImageLoadEvent,
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

// Горизонтальные отступы контента статьи — карусель выходит за них на всю ширину экрана
const CONTENT_PADDING = 20;
// Пока реальные пропорции фото не загрузились — считаем его горизонтальным 4:3
const DEFAULT_ASPECT_RATIO = 4 / 3;
// Плавная смена высоты при переходе между фото разной ориентации
const HEIGHT_ANIMATION_MS = 280;

/**
 * Фотокарусель статьи на всю ширину экрана.
 * Высота каждого слайда — по пропорции самого фото (ничего не обрезается),
 * при свайпе высота плавно перетекает от фото к фото, без рывков.
 */
export function PhotoCarousel({ uris }: PhotoCarouselProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const { width: screenWidth } = useWindowDimensions();
  const [activeIndex, setActiveIndex] = useState(0);
  // Пропорции (ширина / высота) по URL: от них зависит высота слайда
  const [ratios, setRatios] = useState<Record<string, number>>({});
  const [failedIndexes, setFailedIndexes] = useState<Set<number>>(new Set());

  const animatedHeight = useRef(
    // Стартуем с 4:3, чтобы при открытии статьи не было кадра нулевой высоты
    new Animated.Value(Math.round(screenWidth / DEFAULT_ASPECT_RATIO))
  ).current;
  const hasMeasuredRef = useRef(false);

  // Слайды занимают всю ширину экрана, а не ширину карточки с отступами
  const slideWidth = screenWidth;
  const safeIndex = Math.min(activeIndex, Math.max(uris.length - 1, 0));
  const activeRatio = ratios[uris[safeIndex]] ?? DEFAULT_ASPECT_RATIO;
  const activeHeight = Math.round(slideWidth / activeRatio);

  // Массив URI приходит новым на каждый рендер экрана, поэтому эффекты
  // завязаны на стабильный ключ, а не на ссылку
  const urisKey = uris.join('|');

  // Узнаём реальные пропорции фото заранее, чтобы высоту можно было анимировать
  useEffect(() => {
    let cancelled = false;

    setRatios({});
    setFailedIndexes(new Set());
    setActiveIndex(0);
    hasMeasuredRef.current = false;

    uris.forEach((uri) => {
      Image.getSize(
        uri,
        (width, height) => {
          if (cancelled || width <= 0 || height <= 0) return;
          setRatios((prev) =>
            prev[uri] !== undefined ? prev : { ...prev, [uri]: width / height }
          );
        },
        () => {
          if (cancelled) return;
          setRatios((prev) =>
            prev[uri] !== undefined ? prev : { ...prev, [uri]: DEFAULT_ASPECT_RATIO }
          );
        }
      );
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urisKey]);

  // Высота карусели следует за активным фото — плавно, чтобы текст под ней не прыгал
  useEffect(() => {
    if (!hasMeasuredRef.current) {
      animatedHeight.setValue(activeHeight);
      hasMeasuredRef.current = true;
      return;
    }

    const animation = Animated.timing(animatedHeight, {
      toValue: activeHeight,
      duration: HEIGHT_ANIMATION_MS,
      easing: Easing.out(Easing.cubic),
      // height не поддерживается нативным драйвером
      useNativeDriver: false,
    });

    animation.start();

    return () => animation.stop();
  }, [activeHeight, animatedHeight]);

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

  // Реальный размер уже загруженной картинки: надёжнее getSize (учитывает
  // EXIF-поворот фото с телефона), поэтому уточняем пропорцию по факту
  const handleImageLoad = useCallback((uri: string, event: ImageLoadEvent) => {
    const source = event.nativeEvent?.source;
    if (!source?.width || !source?.height) return;

    const ratio = source.width / source.height;
    setRatios((prev) => (prev[uri] === ratio ? prev : { ...prev, [uri]: ratio }));
  }, []);

  if (uris.length === 0) return null;

  return (
    <View style={styles.wrapper}>
      <Animated.View style={[styles.viewport, { height: animatedHeight }]}>
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
          contentContainerStyle={styles.scrollContent}
        >
          {uris.map((uri, index) => {
            const ratio = ratios[uri] ?? DEFAULT_ASPECT_RATIO;
            const height = Math.round(slideWidth / ratio);

            return (
              <View
                key={`${uri}-${index}`}
                style={[styles.slide, { width: slideWidth, height }]}
              >
                {failedIndexes.has(index) ? (
                  <View style={styles.placeholder}>
                    <FontAwesome name="image" size={32} color={colors.textMuted} />
                  </View>
                ) : (
                  <Image
                    source={{ uri }}
                    style={styles.image}
                    resizeMode="cover"
                    accessibilityLabel={`Фотография ${index + 1} из ${uris.length}`}
                    onLoad={(event) => handleImageLoad(uri, event)}
                    onError={() => handleImageError(index)}
                  />
                )}
              </View>
            );
          })}
        </ScrollView>
      </Animated.View>

      {/* Точки: количество слайдов и текущая позиция */}
      {uris.length > 1 && (
        <View style={styles.dots}>
          {uris.map((_, index) => (
            <View
              key={index}
              style={[styles.dot, index === safeIndex && styles.dotActive]}
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
      // Выходим за горизонтальные отступы статьи — фото на всю ширину экрана
      marginHorizontal: -CONTENT_PADDING,
      marginBottom: 20,
    },
    viewport: {
      width: '100%',
      overflow: 'hidden',
    },
    scroll: {
      width: '100%',
      height: '100%',
    },
    scrollContent: {
      alignItems: 'flex-start',
    },
    slide: {
      backgroundColor: colors.surfaceLight,
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
