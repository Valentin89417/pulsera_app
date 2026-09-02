import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, ActivityIndicator, Image, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../hooks/useTheme';
import { useAuthStore } from '../store/authStore';
import { updateProfile } from '../services/api';
import { supabase } from '../services/supabase';
import { uploadFile } from '../utils/upload';
import { ThemeColors } from '../utils/themeColors';

// Маска для телефона: +7 (XXX) XXX-XX-XX
const formatPhone = (text: string): string => {
  // Убираем всё кроме цифр
  const digits = text.replace(/\D/g, '');

  // Если цифр нет — возвращаем пустую строку
  if (digits.length === 0) return '';

  // Форматируем по маске +7 (XXX) XXX-XX-XX
  let result = '+7';

  if (digits.length > 1) {
    result += ' (' + digits.slice(1, 4);
  }
  if (digits.length >= 4) {
    result += ') ' + digits.slice(4, 7);
  }
  if (digits.length >= 7) {
    result += '-' + digits.slice(7, 9);
  }
  if (digits.length >= 9) {
    result += '-' + digits.slice(9, 11);
  }

  return result;
};

// Маска для даты рождения: DD.MM.YYYY
const formatBirthday = (text: string): string => {
  const digits = text.replace(/\D/g, '');

  if (digits.length === 0) return '';

  let result = digits.slice(0, 2);

  if (digits.length > 2) {
    result += '.' + digits.slice(2, 4);
  }
  if (digits.length > 4) {
    result += '.' + digits.slice(4, 8);
  }

  return result;
};

// Конвертация YYYY-MM-DD из БД в DD.MM.YYYY для отображения
const dbDateToDisplay = (dbDate: string | null): string => {
  if (!dbDate) return '';
  const parts = dbDate.split('-');
  if (parts.length !== 3) return '';
  return `${parts[2]}.${parts[1]}.${parts[0]}`;
};

// Объединённый экран настроек (профиль + приложение)
export default function SettingsScreen() {
  const router = useRouter();
  const { profile, user, updateProfile: updateStoreProfile } = useAuthStore();
  const { mode, colors, toggleTheme } = useTheme();
  const styles = createStyles(colors);

  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [phone, setPhone] = useState(formatPhone(profile?.phone || ''));
  const [birthday, setBirthday] = useState(formatBirthday(dbDateToDisplay(profile?.birthday ?? null)));
  const [avatarUri, setAvatarUri] = useState<string | null>(profile?.avatar_url || null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Настройки уведомлений
  const [notifChat, setNotifChat] = useState(profile?.notif_chat ?? true);
  const [notifCommunity, setNotifCommunity] = useState(profile?.notif_community ?? true);
  const [notifArticles, setNotifArticles] = useState(profile?.notif_articles ?? true);
  const [notifComments, setNotifComments] = useState(profile?.notif_comments ?? true);

  // Переключение настройки уведомлений
  const handleToggleNotif = async (field: string, value: boolean) => {
    if (!user) return;
    setNotifChat(field === 'notif_chat' ? value : notifChat);
    setNotifCommunity(field === 'notif_community' ? value : notifCommunity);
    setNotifArticles(field === 'notif_articles' ? value : notifArticles);
    setNotifComments(field === 'notif_comments' ? value : notifComments);

    const { error } = await supabase
      .from('profiles')
      .update({ [field]: value })
      .eq('id', user.id);

    if (error) {
      console.error('Ошибка обновления настроек уведомлений:', error.message);
      // Откатываем
      setNotifChat(profile?.notif_chat ?? true);
      setNotifCommunity(profile?.notif_community ?? true);
      setNotifArticles(profile?.notif_articles ?? true);
      setNotifComments(profile?.notif_comments ?? true);
    }
  };

  // Сохранение профиля
  const handleSave = async () => {
    if (!user) return;

    if (!displayName.trim()) {
      Alert.alert('Ошибка', 'Введите имя');
      return;
    }

    try {
      setIsSaving(true);

      // Сохраняем только цифры телефона
      const phoneDigits = phone.replace(/\D/g, '');

      // Конвертируем дату из DD.MM.YYYY в YYYY-MM-DD для БД
      const birthdayDigits = birthday.replace(/\D/g, '');
      let birthdayDb: string | null = null;
      if (birthdayDigits.length === 8) {
        const dd = birthdayDigits.slice(0, 2);
        const mm = birthdayDigits.slice(2, 4);
        const yyyy = birthdayDigits.slice(4, 8);
        birthdayDb = `${yyyy}-${mm}-${dd}`;
      }

      const updated = await updateProfile(user.id, {
        display_name: displayName.trim(),
        phone: phoneDigits.length > 1 ? phoneDigits : null,
        birthday: birthdayDb,
        avatar_url: avatarUri,
      });

      if (!updated) {
        Alert.alert('Ошибка', 'Не удалось обновить профиль');
        return;
      }

      updateStoreProfile(updated);

      Alert.alert('Готово', 'Профиль обновлён', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error('Ошибка сохранения профиля:', error);
      Alert.alert('Ошибка', 'Неожиданная ошибка при сохранении');
    } finally {
      setIsSaving(false);
    }
  };

  // Выбор аватара
  const handlePickAvatar = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Ошибка', 'Нужно разрешение на доступ к галерее');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const asset = result.assets[0];
      await uploadAvatar(asset.uri);
    } catch (error) {
      console.error('Ошибка выбора изображения:', error);
      Alert.alert('Ошибка', 'Не удалось выбрать изображение');
    }
  };

  // Загрузка аватара в WordPress
  const uploadAvatar = async (uri: string) => {
    try {
      setIsUploading(true);

      const fileAsset = {
        uri,
        mimeType: 'image/jpeg',
        name: `avatar_${Date.now()}.jpg`,
        size: 0,
      };

      const result = await uploadFile(fileAsset as any, 'image');
      setAvatarUri(result.url);
    } catch (error) {
      console.error('Ошибка загрузки аватара:', error);
      Alert.alert('Ошибка', 'Не удалось загрузить аватар');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Хедер */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <FontAwesome name="arrow-left" size={18} color={colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Настройки</Text>
        <TouchableOpacity onPress={handleSave} disabled={isSaving} style={styles.saveButton}>
          {isSaving ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Text style={[styles.saveButtonText, { color: colors.primary }]}>Сохранить</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Аватар */}
        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={handlePickAvatar} disabled={isUploading}>
            {isUploading ? (
              <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
                <ActivityIndicator size="large" color={colors.onPrimary} />
              </View>
            ) : avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
            ) : (
              <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
                <Text style={[styles.avatarText, { color: colors.onPrimary }]}>
                  {displayName?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || '?'}
                </Text>
              </View>
            )}
            <View style={[styles.avatarEditBadge, { backgroundColor: colors.primary }]}>
              <FontAwesome name="camera" size={14} color={colors.onPrimary} />
            </View>
          </TouchableOpacity>
          <Text style={[styles.avatarHint, { color: colors.textMuted }]}>Нажмите, чтобы изменить</Text>
        </View>

        {/* Личные данные */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Личные данные</Text>
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <View style={[styles.field, { borderBottomColor: colors.border }]}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Имя</Text>
              <TextInput
                style={[styles.fieldInput, { color: colors.text }]}
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="Ваше имя"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="words"
              />
            </View>

            <View style={[styles.field, { borderBottomColor: colors.border }]}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Телефон</Text>
              <TextInput
                style={[styles.fieldInput, { color: colors.text }]}
                value={phone}
                onChangeText={(text) => setPhone(formatPhone(text))}
                placeholder="+7 (___) ___-__-__"
                placeholderTextColor={colors.textMuted}
                keyboardType="phone-pad"
                maxLength={18}
              />
            </View>

            <View style={[styles.field, { borderBottomColor: colors.border }]}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Дата рождения</Text>
              <TextInput
                style={[styles.fieldInput, { color: colors.text }]}
                value={birthday}
                onChangeText={(text) => setBirthday(formatBirthday(text))}
                placeholder="ДД.ММ.ГГГГ"
                placeholderTextColor={colors.textMuted}
                keyboardType="number-pad"
                maxLength={10}
              />
            </View>

            <View style={styles.field}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Email</Text>
              <Text style={[styles.fieldValue, { color: colors.textMuted }]}>{user?.email}</Text>
            </View>
          </View>
        </View>

        {/* Внешний вид */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Внешний вид</Text>
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <View style={[styles.field, { borderBottomColor: colors.border }]}>
              <View style={styles.fieldLeft}>
                <FontAwesome name="paint-brush" size={18} color={colors.primary} style={styles.fieldIcon} />
                <Text style={[styles.fieldLabel, { color: colors.text }]}>Тёмная тема</Text>
              </View>
              <Switch
                value={mode === 'dark'}
                onValueChange={toggleTheme}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={mode === 'dark' ? colors.text : colors.textSecondary}
              />
            </View>
          </View>
        </View>

        {/* Уведомления */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Уведомления</Text>
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <View style={[styles.field, { borderBottomColor: colors.border }]}>
              <View style={styles.fieldLeft}>
                <FontAwesome name="comments-o" size={18} color={colors.primary} style={styles.fieldIcon} />
                <Text style={[styles.fieldLabel, { color: colors.text }]}>Сообщения в чате</Text>
              </View>
              <Switch
                value={notifChat}
                onValueChange={(v) => handleToggleNotif('notif_chat', v)}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={notifChat ? colors.textSecondary : colors.textSecondary}
              />
            </View>

            <View style={[styles.field, { borderBottomColor: colors.border }]}>
              <View style={styles.fieldLeft}>
                <FontAwesome name="users" size={18} color={colors.primary} style={styles.fieldIcon} />
                <Text style={[styles.fieldLabel, { color: colors.text }]}>Сообщества</Text>
              </View>
              <Switch
                value={notifCommunity}
                onValueChange={(v) => handleToggleNotif('notif_community', v)}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={notifCommunity ? colors.textSecondary : colors.textSecondary}
              />
            </View>

            <View style={[styles.field, { borderBottomColor: colors.border }]}>
              <View style={styles.fieldLeft}>
                <FontAwesome name="book" size={18} color={colors.primary} style={styles.fieldIcon} />
                <Text style={[styles.fieldLabel, { color: colors.text }]}>Новые статьи</Text>
              </View>
              <Switch
                value={notifArticles}
                onValueChange={(v) => handleToggleNotif('notif_articles', v)}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={notifArticles ? colors.textSecondary : colors.textSecondary}
              />
            </View>

            <View style={styles.field}>
              <View style={styles.fieldLeft}>
                <FontAwesome name="comment-o" size={18} color={colors.primary} style={styles.fieldIcon} />
                <Text style={[styles.fieldLabel, { color: colors.text }]}>Ответы на комментарии</Text>
              </View>
              <Switch
                value={notifComments}
                onValueChange={(v) => handleToggleNotif('notif_comments', v)}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={notifComments ? colors.textSecondary : colors.textSecondary}
              />
            </View>
          </View>
        </View>

        {/* О приложении */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>О приложении</Text>
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <View style={styles.field}>
              <View style={styles.fieldLeft}>
                <FontAwesome name="info-circle" size={18} color={colors.primary} style={styles.fieldIcon} />
                <Text style={[styles.fieldLabel, { color: colors.text }]}>Версия</Text>
              </View>
              <Text style={[styles.fieldValue, { color: colors.textMuted }]}>1.0.0</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  saveButton: {
    minWidth: 60,
    alignItems: 'flex-end',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
  },
  avatarHint: {
    fontSize: 12,
    marginTop: 8,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  fieldLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  fieldIcon: {
    width: 24,
    marginRight: 12,
  },
  fieldLabel: {
    fontSize: 14,
    width: 80,
  },
  fieldInput: {
    flex: 1,
    fontSize: 16,
    textAlign: 'right',
  },
  fieldValue: {
    fontSize: 16,
    flex: 1,
    textAlign: 'right',
  },
});
