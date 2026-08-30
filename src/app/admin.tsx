import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { useAdmin, useSubscription } from '../hooks/useAuth';
import storage from '../utils/storage';

// Админ панель
export default function AdminScreen() {
  const router = useRouter();
  const { isAdmin } = useAdmin();
  const { tier, activateSubscription, deactivateSubscription } = useSubscription();

  // Если не админ — показать заглушку
  if (!isAdmin) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <View style={styles.backButton}>
              <FontAwesome name="arrow-left" size={16} color="#6c63ff" />
              <Text style={styles.backButtonText}>Назад</Text>
            </View>
          </TouchableOpacity>
        </View>
        <View style={styles.accessDenied}>
          <FontAwesome name="lock" size={48} color="#6c63ff" />
          <Text style={styles.accessDeniedText}>Доступ запрещён</Text>
          <Text style={styles.accessDeniedHint}>Только для администраторов</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Заголовок */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <View style={styles.backButton}>
            <FontAwesome name="arrow-left" size={16} color="#6c63ff" />
            <Text style={styles.backButtonText}>Назад</Text>
          </View>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Админ панель</Text>
      </View>

      {/* Меню */}
      <View style={styles.menuSection}>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => router.push('/admin/articles')}
        >
          <FontAwesome name="file-text-o" size={22} color="#6c63ff" style={styles.menuIcon} />
          <View style={styles.menuContent}>
            <Text style={styles.menuText}>Управление статьями</Text>
            <Text style={styles.menuHint}>Создание, редактирование, удаление</Text>
          </View>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => router.push('/admin/comments')}
        >
          <FontAwesome name="comment-o" size={22} color="#6c63ff" style={styles.menuIcon} />
          <View style={styles.menuContent}>
            <Text style={styles.menuText}>Комментарии</Text>
            <Text style={styles.menuHint}>Просмотр и ответы на комментарии</Text>
          </View>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={async () => {
            const { Alert } = require('react-native');
            Alert.alert(
              'Сброс онбординга',
              'При перезапуске снова покажет экран онбординга',
              [
                { text: 'Отмена', style: 'cancel' },
                {
                  text: 'Сбросить',
                  onPress: async () => {
                    await storage.removeItem('@pulsera_onboarding_done');
                    Alert.alert('Готово', 'Перезапустите приложение');
                  },
                },
              ]
            );
          }}
        >
          <FontAwesome name="refresh" size={22} color="#6c63ff" style={styles.menuIcon} />
          <View style={styles.menuContent}>
            <Text style={styles.menuText}>Сброс онбординга</Text>
            <Text style={styles.menuHint}>Показать экран онбординга снова</Text>
          </View>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Тестирование подписки — только для админов */}
      <View style={styles.menuSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Тестирование подписки</Text>
        </View>

        {/* Текущий статус */}
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Текущий тариф:</Text>
          <Text style={[styles.statusValue, tier !== 'free' && styles.statusValueActive]}>
            {tier === 'free' ? 'Бесплатный' : tier === 'path' ? 'Путь' : 'Пробуждение'}
          </Text>
        </View>

        {/* Кнопки управления */}
        <View style={styles.toggleButtons}>
          <TouchableOpacity
            style={[styles.toggleButton, tier === 'path' && styles.toggleButtonActive]}
            onPress={async () => {
              const { error } = await activateSubscription('path');
              if (error) {
                Alert.alert('Ошибка', error);
              } else {
                Alert.alert('Успех', 'Подписка «Путь» активирована');
              }
            }}
          >
            <View style={styles.toggleButtonContent}>
              <FontAwesome name="star" size={14} color="#fff" />
              <Text style={styles.toggleButtonText}>Путь</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.toggleButton, tier === 'awakening' && styles.toggleButtonActive]}
            onPress={async () => {
              const { error } = await activateSubscription('awakening');
              if (error) {
                Alert.alert('Ошибка', error);
              } else {
                Alert.alert('Успех', 'Подписка «Пробуждение» активирована');
              }
            }}
          >
            <View style={styles.toggleButtonContent}>
              <FontAwesome name="star" size={14} color="#fff" />
              <Text style={styles.toggleButtonText}>Пробуждение</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.toggleButton, tier === 'free' && styles.toggleButtonActive]}
            onPress={async () => {
              const { error } = await deactivateSubscription();
              if (error) {
                Alert.alert('Ошибка', error);
              } else {
                Alert.alert('Успех', 'Подписка отключена');
              }
            }}
          >
            <View style={styles.toggleButtonContent}>
              <FontAwesome name="ban" size={14} color="#fff" />
              <Text style={styles.toggleButtonText}>Выкл</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Перейти к экрану подписки */}
      <View style={styles.menuSection}>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => router.push('/subscription')}
        >
          <FontAwesome name="credit-card" size={22} color="#6c63ff" style={styles.menuIcon} />
          <View style={styles.menuContent}>
            <Text style={styles.menuText}>Экран подписки</Text>
            <Text style={styles.menuHint}>Просмотреть экран выбора тарифа</Text>
          </View>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  content: {
    paddingBottom: 40,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  backButtonText: {
    color: '#6c63ff',
    fontSize: 16,
    marginLeft: 6,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  menuSection: {
    backgroundColor: '#16213e',
    borderRadius: 16,
    marginHorizontal: 20,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a2e',
  },
  menuIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  menuContent: {
    flex: 1,
  },
  menuText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
  menuHint: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  menuArrow: {
    fontSize: 24,
    color: '#666',
  },
  sectionHeader: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a2e',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffc107',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a2e',
  },
  statusLabel: {
    fontSize: 14,
    color: '#999',
  },
  statusValue: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  statusValueActive: {
    color: '#6c63ff',
  },
  toggleButtons: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
  },
  toggleButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: '#6c63ff',
  },
  toggleButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  toggleButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  menuItemActive: {
    backgroundColor: 'rgba(108, 99, 255, 0.2)',
  },
  activeIndicator: {
    color: '#6c63ff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  accessDenied: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  accessDeniedIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  accessDeniedText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  accessDeniedHint: {
    fontSize: 14,
    color: '#666',
  },
});
