import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { useAuth, useSubscription, useAdmin } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { ThemeColors } from '../utils/themeColors';

const TIERS = {
  path: {
    name: 'Путь',
    description: 'Доступ ко всему платному контенту',
    monthlyPrice: 'XXX ₽',
    yearlyPrice: 'XXX ₽',
    features: [
      'Бесплатный контент',
      'Платные статьи',
      'Платные аудио',
      'Платные видео',
    ],
  },
  awakening: {
    name: 'Пробуждение',
    description: 'Платный контент + разборы + чат с автором',
    monthlyPrice: 'XXX ₽',
    yearlyPrice: 'XXX ₽',
    features: [
      'Всё из тарифа «Путь»',
      'Персональные разборы',
      'Чат с автором',
      'Эксклюзивный контент',
    ],
  },
};

export default function SubscriptionScreen() {
  const router = useRouter();
  const { profile } = useAuth();
  const { tier, activateSubscription, deactivateSubscription } = useSubscription();
  const { isAdmin } = useAdmin();
  const [isAnnual, setIsAnnual] = useState(false);
  const [loading, setLoading] = useState(false);
  const { colors } = useTheme();

  const handleActivate = async (newTier: 'path' | 'awakening') => {
    setLoading(true);
    const { error } = await activateSubscription(newTier);
    setLoading(false);

    if (error) {
      Alert.alert('Ошибка', error);
    } else {
      Alert.alert('Успех', `Подписка «${TIERS[newTier].name}» активирована!`);
    }
  };

  const handleDeactivate = async () => {
    setLoading(true);
    const { error } = await deactivateSubscription();
    setLoading(false);

    if (error) {
      Alert.alert('Ошибка', error);
    } else {
      Alert.alert('Успех', 'Подписка отключена');
    }
  };

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
    },
    statusTitle: {
      fontSize: 14,
      color: colors.whiteAlpha60,
      marginBottom: 8,
    },
    statusTier: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.primary,
    },
    periodToggle: {
      flexDirection: 'row',
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 4,
      marginBottom: 20,
    },
    periodButton: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: 'center',
    },
    periodButtonActive: {
      backgroundColor: colors.primary,
    },
    periodButtonText: {
      fontSize: 14,
      color: colors.whiteAlpha60,
    },
    periodButtonTextActive: {
      color: colors.onPrimary,
      fontWeight: 'bold',
    },
    tierCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 24,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.primaryAlpha20,
    },
    tierName: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 8,
    },
    tierDescription: {
      fontSize: 14,
      color: colors.whiteAlpha60,
      marginBottom: 16,
    },
    tierPrice: {
      fontSize: 32,
      fontWeight: 'bold',
      color: colors.primary,
      marginBottom: 4,
    },
    tierPeriod: {
      fontSize: 12,
      color: colors.whiteAlpha60,
      marginBottom: 16,
    },
    featuresList: {
      marginBottom: 20,
    },
    featureItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    featureText: {
      fontSize: 14,
      color: colors.text,
      marginLeft: 8,
    },
    subscribeButton: {
      backgroundColor: colors.primaryAlpha20,
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: 'center',
    },
    subscribeButtonActive: {
      backgroundColor: colors.primary,
    },
    subscribeButtonText: {
      color: colors.text,
      fontSize: 16,
      fontWeight: 'bold',
    },
    subscribeButtonTextActive: {
      color: colors.onPrimary,
    },
    adminPanel: {
      backgroundColor: 'rgba(255, 193, 7, 0.1)',
      borderRadius: 16,
      padding: 20,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: 'rgba(255, 193, 7, 0.3)',
    },
    adminTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.gold,
      marginBottom: 8,
    },
    adminDescription: {
      fontSize: 12,
      color: colors.whiteAlpha60,
      marginBottom: 16,
    },
    adminButtons: {
      gap: 8,
    },
    adminButton: {
      backgroundColor: colors.primaryAlpha27,
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: 'center',
    },
    adminButtonActive: {
      backgroundColor: colors.primary,
    },
    adminButtonDanger: {
      backgroundColor: 'rgba(244, 67, 54, 0.3)',
    },
    adminButtonText: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '600',
    },
    adminButtonTextActive: {
      color: colors.onPrimary,
    },
    infoCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.primaryAlpha10,
      borderRadius: 12,
      padding: 16,
    },
    infoText: {
      flex: 1,
      fontSize: 12,
      color: colors.whiteAlpha60,
      marginLeft: 12,
    },
  });

  const styles = createStyles(colors);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.replace('/(tabs)')}
          style={styles.backButton}
        >
          <FontAwesome name="arrow-left" size={20} color={colors.text} />
          <Text style={styles.backText}>Назад</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Подписка</Text>
        <View style={{ width: 80 }} />
      </View>

      <ScrollView style={styles.scrollContent} contentContainerStyle={styles.contentContainer}>
        <View style={styles.statusCard}>
          <Text style={styles.statusTitle}>Текущий тариф</Text>
          <Text style={styles.statusTier}>
            {tier === 'free' ? 'Бесплатный' : TIERS[tier]?.name || 'Бесплатный'}
          </Text>
        </View>

        <View style={styles.periodToggle}>
          <TouchableOpacity
            style={[styles.periodButton, !isAnnual && styles.periodButtonActive]}
            onPress={() => setIsAnnual(false)}
          >
            <Text style={[styles.periodButtonText, !isAnnual && styles.periodButtonTextActive]}>
              Месяц
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.periodButton, isAnnual && styles.periodButtonActive]}
            onPress={() => setIsAnnual(true)}
          >
            <Text style={[styles.periodButtonText, isAnnual && styles.periodButtonTextActive]}>
              Год (-20%)
            </Text>
          </TouchableOpacity>
        </View>

        {Object.entries(TIERS).map(([key, tierData]) => (
          <View key={key} style={styles.tierCard}>
            <Text style={styles.tierName}>{tierData.name}</Text>
            <Text style={styles.tierDescription}>{tierData.description}</Text>
            
            <Text style={styles.tierPrice}>
              {isAnnual ? tierData.yearlyPrice : tierData.monthlyPrice}
            </Text>
            <Text style={styles.tierPeriod}>
              {isAnnual ? 'в год' : 'в месяц'}
            </Text>

            <View style={styles.featuresList}>
              {tierData.features.map((feature, index) => (
                <View key={index} style={styles.featureItem}>
                  <FontAwesome name="check-circle" size={16} color={colors.primary} />
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.subscribeButton, tier === key && styles.subscribeButtonActive]}
              disabled={tier === key || loading}
            >
              {loading ? (
                <ActivityIndicator color={colors.onPrimary} />
              ) : (
                <Text style={[styles.subscribeButtonText, tier === key && styles.subscribeButtonTextActive]}>
                  {tier === key ? 'Текущий тариф' : 'Подписаться'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        ))}

        {isAdmin && (
          <View style={styles.adminPanel}>
            <Text style={styles.adminTitle}>🔧 Тестирование подписки</Text>
            <Text style={styles.adminDescription}>
              Только для админов. Включайте/выключайте подписку для тестирования.
            </Text>

            <View style={styles.adminButtons}>
              <TouchableOpacity
                style={[styles.adminButton, tier === 'path' && styles.adminButtonActive]}
                onPress={() => handleActivate('path')}
                disabled={loading}
              >
                <Text style={[styles.adminButtonText, tier === 'path' && styles.adminButtonTextActive]}>Включить «Путь»</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.adminButton, tier === 'awakening' && styles.adminButtonActive]}
                onPress={() => handleActivate('awakening')}
                disabled={loading}
              >
                <Text style={[styles.adminButtonText, tier === 'awakening' && styles.adminButtonTextActive]}>Включить «Пробуждение»</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.adminButton, styles.adminButtonDanger]}
                onPress={handleDeactivate}
                disabled={loading || tier === 'free'}
              >
                <Text style={[styles.adminButtonText, tier === 'free' && styles.adminButtonTextActive]}>Отключить подписку</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={styles.infoCard}>
          <FontAwesome name="info-circle" size={20} color={colors.primary} />
          <Text style={styles.infoText}>
            Цены являются заглушками. Реальная оплата будет подключена позже.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
