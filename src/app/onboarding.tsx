import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import storage from '../utils/storage';
import { useTheme } from '../hooks/useTheme';
import { ThemeColors } from '../utils/themeColors';

const { width } = Dimensions.get('window');

// Данные экранов онбординга
const ONBOARDING_DATA = [
  {
    id: '1',
    icon: '✦',
    title: 'Добро пожаловать',
    description: 'Погрузитесь в мир духовных практик, медитаций и арт-терапии вместе с Диной Кануниковой',
  },
  {
    id: '2',
    icon: '🧘',
    title: 'Практики и медитации',
    description: 'Видео-медитации, аудио-практики и курсы для вашего духовного роста и внутренней гармонии',
  },
  {
    id: '3',
    icon: '🌿',
    title: 'Ваш путь к пробуждению',
    description: 'Базовый контент для начала пути и расширенный доступ для глубокого погружения в себя',
  },
];

const ONBOARDING_KEY = '@pulsera_onboarding_done';

// Экран онбординга
export default function OnboardingScreen() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const { colors } = useTheme();

  const isLast = currentIndex === ONBOARDING_DATA.length - 1;
  const item = ONBOARDING_DATA[currentIndex];

  // Следующий экран или завершение
  const handleNext = () => {
    if (!isLast) {
      setCurrentIndex(currentIndex + 1);
    } else {
      finishOnboarding();
    }
  };

  // Пропуск онбординга
  const handleSkip = () => {
    finishOnboarding();
  };

  // Завершение онбординга
  const finishOnboarding = async () => {
    try {
      await storage.setItem(ONBOARDING_KEY, 'true');
    } catch (error) {
      console.error('Ошибка сохранения онбординга:', error);
    }
    router.replace('/(auth)/login');
  };

  const styles = createStyles(colors);

  return (
    <View style={styles.container}>
      {/* Пропуск */}
      {!isLast && (
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipText}>Пропустить</Text>
        </TouchableOpacity>
      )}

      {/* Контент экрана */}
      <View style={styles.slide}>
        <Text style={styles.icon}>{item.icon}</Text>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.description}>{item.description}</Text>
      </View>

      {/* Индикаторы */}
      <View style={styles.indicators}>
        {ONBOARDING_DATA.map((_, index) => (
          <View
            key={index}
            style={[
              styles.indicator,
              index === currentIndex && styles.indicatorActive,
            ]}
          />
        ))}
      </View>

      {/* Кнопка далее / начать */}
      <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
        <Text style={styles.nextButtonText}>
          {isLast ? 'Начать' : 'Далее'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  skipButton: {
    position: 'absolute',
    top: 60,
    right: 24,
    zIndex: 10,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  skipText: {
    color: colors.textSecondary,
    fontSize: 16,
  },
  slide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  icon: {
    fontSize: 64,
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  indicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 40,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
    marginHorizontal: 4,
  },
  indicatorActive: {
    backgroundColor: colors.primary,
    width: 24,
  },
  nextButton: {
    backgroundColor: colors.primary,
    marginHorizontal: 32,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 60,
  },
  nextButtonText: {
    color: colors.onPrimary,
    fontSize: 18,
    fontWeight: '600',
  },
});
