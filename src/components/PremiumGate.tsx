import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

interface PremiumGateProps {
  children: React.ReactNode;
  requiredTier: 'free' | 'path' | 'awakening';
  contentTitle?: string;
}

// Названия тарифов на русском
const tierNames: Record<string, string> = {
  free: 'Бесплатный',
  path: 'Путь',
  awakening: 'Пробуждение',
};

// Описание тарифов
const tierDescriptions: Record<string, string> = {
  path: 'Доступ ко всему платному контенту',
  awakening: 'Платный контент + разборы + чат с автором',
};

// Компонент-обёртка для премиум-контента
// Если у пользователя нет доступа — показывает размытый контент с замком
export function PremiumGate({ children, requiredTier, contentTitle }: PremiumGateProps) {
  const router = useRouter();

  // Если тариф бесплатный — показываем контент без ограничений
  if (requiredTier === 'free') {
    return <>{children}</>;
  }

  return (
    <View style={styles.container}>
      {/* Контент (всегда рендерится, но размыт) */}
      <View style={styles.content}>
        {children}
      </View>

      {/* Модальное окно замка — поверх всех элементов */}
      <Modal
        visible={true}
        transparent={true}
        animationType="fade"
        statusBarTranslucent
      >
        <View style={styles.modalOverlay}>
          <View style={styles.lockContainer}>
            <Ionicons name="lock-closed" size={48} color="#6c63ff" />
            <Text style={styles.title}>
              {contentTitle || 'Премиум-контент'}
            </Text>
            <Text style={styles.description}>
              {tierDescriptions[requiredTier] || 'Доступно по подписке'}
            </Text>
            <Text style={styles.tierName}>
              Тариф: «{tierNames[requiredTier]}»
            </Text>
            <TouchableOpacity
              style={styles.subscribeButton}
              onPress={() => router.push('/subscription')}
            >
              <Text style={styles.subscribeButtonText}>Подписаться</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    minHeight: 200,
  },
  content: {
    opacity: 0.3,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(26, 26, 46, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockContainer: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: 'rgba(22, 33, 62, 0.98)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(108, 99, 255, 0.3)',
    maxWidth: 320,
    width: '90%',
    // Тень для глубины
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 4,
    textAlign: 'center',
  },
  tierName: {
    fontSize: 12,
    color: '#6c63ff',
    marginBottom: 20,
    textAlign: 'center',
  },
  subscribeButton: {
    backgroundColor: '#6c63ff',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
  },
  subscribeButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
