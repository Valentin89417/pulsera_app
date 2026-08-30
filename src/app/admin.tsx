import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAdmin } from '../hooks/useAuth';
import storage from '../utils/storage';

// Админ панель
export default function AdminScreen() {
  const router = useRouter();
  const { isAdmin } = useAdmin();

  // Если не админ — показать заглушку
  if (!isAdmin) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backButton}>← Назад</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.accessDenied}>
          <Text style={styles.accessDeniedIcon}>🔒</Text>
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
          <Text style={styles.backButton}>← Назад</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Админ панель</Text>
      </View>

      {/* Меню */}
      <View style={styles.menuSection}>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => router.push('/admin/articles')}
        >
          <Text style={styles.menuIcon}>📝</Text>
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
          <Text style={styles.menuIcon}>💬</Text>
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
          <Text style={styles.menuIcon}>🔄</Text>
          <View style={styles.menuContent}>
            <Text style={styles.menuText}>Сброс онбординга</Text>
            <Text style={styles.menuHint}>Показать экран онбординга снова</Text>
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
    color: '#6c63ff',
    fontSize: 16,
    marginBottom: 8,
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
