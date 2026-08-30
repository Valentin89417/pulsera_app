import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { ThemeColors } from '../utils/themeColors';

interface PremiumGateProps {
  children: React.ReactNode;
  requiredTier: 'free' | 'path' | 'awakening';
  contentTitle?: string;
}

const tierNames: Record<string, string> = {
  free: 'Бесплатный',
  path: 'Путь',
  awakening: 'Пробуждение',
};

const tierDescriptions: Record<string, string> = {
  path: 'Доступ ко всему платному контенту',
  awakening: 'Платный контент + разборы + чат с автором',
};

export function PremiumGate({ children, requiredTier, contentTitle }: PremiumGateProps) {
  const router = useRouter();
  const { colors } = useTheme();

  if (requiredTier === 'free') {
    return <>{children}</>;
  }

  const styles = createStyles(colors);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {children}
      </View>

      <Modal
        visible={true}
        transparent={true}
        animationType="fade"
        statusBarTranslucent
      >
        <View style={styles.modalOverlay}>
          <View style={styles.lockContainer}>
            <FontAwesome name="lock" size={48} color={colors.primary} />
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

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    position: 'relative',
    minHeight: 200,
  },
  content: {
    opacity: 0.3,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockContainer: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: colors.surfaceAlpha98,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.primaryAlpha27,
    maxWidth: 320,
    width: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: colors.whiteAlpha70,
    marginBottom: 4,
    textAlign: 'center',
  },
  tierName: {
    fontSize: 12,
    color: colors.primary,
    marginBottom: 20,
    textAlign: 'center',
  },
  subscribeButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
  },
  subscribeButtonText: {
    color: colors.onPrimary,
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
