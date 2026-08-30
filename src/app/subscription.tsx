import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { useAuth, useSubscription, useAdmin } from '../hooks/useAuth';

// Тарифы подписки
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

  // Обработка активации подписки (для тестирования)
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

  // Обработка деактивации подписки (для тестирования)
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

  return (
    <View style={styles.container}>
      {/* Своя шапка с кнопкой назад */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.replace('/(tabs)')}
          style={styles.backButton}
        >
          <FontAwesome name="arrow-left" size={20} color="#ffffff" />
          <Text style={styles.backText}>Назад</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Подписка</Text>
        <View style={{ width: 80 }} />
      </View>

      <ScrollView style={styles.scrollContent} contentContainerStyle={styles.contentContainer}>
        {/* Текущий статус */}
        <View style={styles.statusCard}>
          <Text style={styles.statusTitle}>Текущий тариф</Text>
          <Text style={styles.statusTier}>
            {tier === 'free' ? 'Бесплатный' : TIERS[tier]?.name || 'Бесплатный'}
          </Text>
        </View>

        {/* Переключатель периода */}
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

        {/* Карточки тарифов */}
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
                  <FontAwesome name="check-circle" size={16} color="#6c63ff" />
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>

            {/* Кнопка подписки (пока заглушка) */}
            <TouchableOpacity
              style={[styles.subscribeButton, tier === key && styles.subscribeButtonActive]}
              disabled={tier === key || loading}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.subscribeButtonText}>
                  {tier === key ? 'Текущий тариф' : 'Подписаться'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        ))}

        {/* Админ-панель для тестирования */}
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
                <Text style={styles.adminButtonText}>Включить «Путь»</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.adminButton, tier === 'awakening' && styles.adminButtonActive]}
                onPress={() => handleActivate('awakening')}
                disabled={loading}
              >
                <Text style={styles.adminButtonText}>Включить «Пробуждение»</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.adminButton, styles.adminButtonDanger]}
                onPress={handleDeactivate}
                disabled={loading || tier === 'free'}
              >
                <Text style={styles.adminButtonText}>Отключить подписку</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Информация */}
        <View style={styles.infoCard}>
          <FontAwesome name="info-circle" size={20} color="#6c63ff" />
          <Text style={styles.infoText}>
            Цены являются заглушками. Реальная оплата будет подключена позже.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
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
    color: '#6c63ff',
    fontSize: 16,
    marginLeft: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  scrollContent: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  statusCard: {
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  statusTitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 8,
  },
  statusTier: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6c63ff',
  },
  periodToggle: {
    flexDirection: 'row',
    backgroundColor: '#16213e',
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
    backgroundColor: '#6c63ff',
  },
  periodButtonText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  periodButtonTextActive: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  tierCard: {
    backgroundColor: '#16213e',
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(108, 99, 255, 0.2)',
  },
  tierName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  tierDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 16,
  },
  tierPrice: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#6c63ff',
    marginBottom: 4,
  },
  tierPeriod: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
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
    color: '#ffffff',
    marginLeft: 8,
  },
  subscribeButton: {
    backgroundColor: 'rgba(108, 99, 255, 0.2)',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  subscribeButtonActive: {
    backgroundColor: '#6c63ff',
  },
  subscribeButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
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
    color: '#ffc107',
    marginBottom: 8,
  },
  adminDescription: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 16,
  },
  adminButtons: {
    gap: 8,
  },
  adminButton: {
    backgroundColor: 'rgba(108, 99, 255, 0.3)',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  adminButtonActive: {
    backgroundColor: '#6c63ff',
  },
  adminButtonDanger: {
    backgroundColor: 'rgba(244, 67, 54, 0.3)',
  },
  adminButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(108, 99, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    marginLeft: 12,
  },
});
