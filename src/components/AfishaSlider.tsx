import { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
  Image,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router/react-navigation';
import { FontAwesome } from '@expo/vector-icons';
import { getActiveBanners } from '../services/api';
import { AfishaBanner } from '../types/content';
import { useTheme } from '../hooks/useTheme';
import { ThemeColors } from '../utils/themeColors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BANNER_HEIGHT = Math.round(SCREEN_WIDTH * 9 / 16);

export function AfishaSlider() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = createStyles(colors);

  const [banners, setBanners] = useState<AfishaBanner[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const loadBanners = async () => {
    const data = await getActiveBanners();
    setBanners(data);
  };

  useFocusEffect(
    useCallback(() => {
      loadBanners();
    }, [])
  );

  const handleScroll = useCallback((event: any) => {
    const contentOffset = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffset / SCREEN_WIDTH);
    setActiveIndex(index);
  }, []);

  const handleBannerPress = (banner: AfishaBanner) => {
    if (!banner.link_url) return;

    // Внутренняя ссылка на контент
    if (banner.link_url.startsWith('/content/')) {
      router.push(banner.link_url as any);
    } else if (banner.link_url.startsWith('http')) {
      Linking.openURL(banner.link_url);
    } else {
      router.push(banner.link_url as any);
    }
  };

  if (banners.length === 0) return null;

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={banners}
        horizontal
        snapToInterval={SCREEN_WIDTH}
        decelerationRate="fast"
        overScrollMode="never"
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        keyExtractor={(item) => item.id}
        getItemLayout={(_, index) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * index,
          index,
        })}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.bannerWrapper}
            onPress={() => handleBannerPress(item)}
            activeOpacity={item.link_url ? 0.8 : 1}
          >
            <Image
              source={{ uri: item.image_url }}
              style={styles.bannerImage}
              resizeMode="cover"
            />
            {item.title ? (
              <View style={styles.titleOverlay}>
                <Text style={styles.bannerTitle} numberOfLines={2}>
                  {item.title}
                </Text>
              </View>
            ) : null}
          </TouchableOpacity>
        )}
      />

      {/* Точки-индикаторы */}
      {banners.length > 1 && (
        <View style={styles.dotsContainer}>
          {banners.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                index === activeIndex && styles.dotActive,
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  bannerWrapper: {
    width: SCREEN_WIDTH,
    height: BANNER_HEIGHT,
    overflow: 'hidden',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  titleOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: 12,
    paddingTop: 32,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  bannerTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
  },
  dotsContainer: {
    flexDirection: 'row',
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
    backgroundColor: colors.primary,
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});
