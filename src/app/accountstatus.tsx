import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { useAuth, useSubscription, useAdmin } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { ThemeColors } from '../utils/themeColors';

const TIER_INFO = {
  free: {
    name: 'Начало',
    description: 'Базовый доступ к контенту',
    features: ['Статьи', 'Аудио и видео', 'Сообщество'],
  },
  path: {
    name: 'Путь',
    description: 'Расширенный доступ ко всему контенту',
    features: ['Базовый контент', 'Статьи', 'Аудио и видео', 'Сообщество'],
  },
  awakening: {
    name: 'Пробуждение',
    description: 'Максимальный доступ + общение с автором',
    features: ['Всё из уровня «Путь»', 'Персональные разборы', 'Чат с автором', 'Эксклюзивный контент'],
  },
};

export default function AccountStatusScreen() {
  const router = useRouter();
  const { profile } = useAuth();
  const { tier } = useSubscription();
  const { isAdmin } = useAdmin();
  const { colors } = useTheme();

  const styles = createStyles(colors);
  const tierData = TIER_INFO[tier] || TIER_INFO.free;

  const formatExpiryDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const expiryDate = formatExpiryDate(profile?.subscription_expires_at ?? null);

  // Если не админ — показываем только статус
  if (!isAdmin) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <FontAwesome name="arrow-left" size={20} color={colors.text} />
            <Text style={styles.backText}>Назад</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Статус аккаунта</Text>
          <View style={{ width: 80 }} />
        </View>

        <ScrollView style={styles.scrollContent} contentContainerStyle={styles.contentContainer}>
          {/* Статус */}
          <View style={styles.statusCard}>
            <Text style={styles.statusLabel}>Текущий статус</Text>
            <Text style={[styles.statusTier, tier !== 'free' && { color: colors.primary }]}>
              {tierData.name}
            </Text>
            {tier !== 'free' && expiryDate && (
              <Text style={styles.statusExpiry}>Действует до: {expiryDate}</Text>
            )}
            {tier !== 'free' && !expiryDate && (
              <Text style={styles.statusExpiry}>Бессрочно</Text>
            )}
          </View>

          {/* Описание уровня */}
          <View style={styles.tierCard}>
            <Text style={styles.tierName}>{tierData.name}</Text>
            <Text style={styles.tierDescription}>{tierData.description}</Text>
            <View style={styles.featuresList}>
              {tierData.features.map((feature, index) => (
                <View key={index} style={styles.featureItem}>
                  <FontAwesome name="check-circle" size={16} color={colors.primary} />
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Контакт */}
          <View style={styles.infoCard}>
            <FontAwesome name="info-circle" size={20} color={colors.primary} />
            <Text style={styles.infoText}>
              Для управления аккаунтом свяжитесь с автором
            </Text>
          </View>

          <TouchableOpacity
            style={styles.contactButton}
            onPress={() => router.push('/chat')}
          >
            <FontAwesome name="comment-o" size={18} color={colors.onPrimary} />
            <Text style={styles.contactButtonText}>Написать в чат</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // Админ видит статус + тестовые кнопки
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <FontAwesome name="arrow-left" size={20} color={colors.text} />
          <Text style={styles.backText}>Назад</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Статус аккаунта</Text>
        <View style={{ width: 80 }} />
      </View>

      <ScrollView style={styles.scrollContent} contentContainerStyle={styles.contentContainer}>
        <View style={styles.statusCard}>
          <Text style={styles.statusLabel}>Текущий статус</Text>
          <Text style={[styles.statusTier, tier !== 'free' && { color: colors.primary }]}>
            {tierData.name}
          </Text>
          {tier !== 'free' && expiryDate && (
            <Text style={styles.statusExpiry}>Действует до: {expiryDate}</Text>
          )}
          {tier !== 'free' && !expiryDate && (
            <Text style={styles.statusExpiry}>Бессрочно</Text>
          )}
        </View>

        <View style={styles.tierCard}>
          <Text style={styles.tierName}>{tierData.name}</Text>
          <Text style={styles.tierDescription}>{tierData.description}</Text>
          <View style={styles.featuresList}>
            {tierData.features.map((feature, index) => (
              <View key={index} style={styles.featureItem}>
                <FontAwesome name="check-circle" size={16} color={colors.primary} />
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.infoCard}>
          <FontAwesome name="info-circle" size={20} color={colors.primary} />
          <Text style={styles.infoText}>
            Для управления аккаунтом свяжитесь с автором
          </Text>
        </View>

        <TouchableOpacity
          style={styles.contactButton}
          onPress={() => router.push('/chat')}
        >
          <FontAwesome name="comment-o" size={18} color={colors.onPrimary} />
          <Text style={styles.contactButtonText}>Написать в чат</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  backText: {
    color: colors.primary,
    fontSize: 16,
    marginLeft: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  scrollContent: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  statusCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  statusLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  statusTier: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textMuted,
    marginBottom: 4,
  },
  statusExpiry: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  tierCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  tierName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  tierDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  featuresList: {
    gap: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    fontSize: 14,
    color: colors.text,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryAlpha10,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: colors.textSecondary,
  },
  contactButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  contactButtonText: {
    color: colors.onPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
});
