import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { useAdmin } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { ThemeColors } from '../../utils/themeColors';
import { getSetting, setSetting } from '../../services/api';

export default function CalendarSettingsScreen() {
  const router = useRouter();
  const { isAdmin } = useAdmin();
  const { colors } = useTheme();

  const [calendarUrl, setCalendarUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const createStyles = (colors: ThemeColors) => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
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
      color: colors.primary,
      fontSize: 16,
      marginLeft: 6,
    },
    headerTitle: {
      fontSize: 28,
      fontWeight: 'bold',
      color: colors.text,
    },
    section: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      marginHorizontal: 20,
      marginTop: 16,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      padding: 18,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
    },
    sectionDescription: {
      fontSize: 13,
      color: colors.textSecondary,
      marginBottom: 16,
      lineHeight: 18,
    },
    inputLabel: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.text,
      marginBottom: 8,
    },
    input: {
      backgroundColor: colors.inputBg,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 14,
      color: colors.text,
    },
    inputHint: {
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 6,
      lineHeight: 16,
    },
    saveButton: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: 'center',
      marginTop: 16,
    },
    saveButtonText: {
      color: colors.onPrimary,
      fontSize: 16,
      fontWeight: '600',
    },
    previewSection: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      marginHorizontal: 20,
      marginTop: 16,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      padding: 18,
    },
    previewTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
    },
    previewHint: {
      fontSize: 12,
      color: colors.textMuted,
      lineHeight: 16,
    },
    exampleUrl: {
      backgroundColor: colors.inputBg,
      borderRadius: 8,
      padding: 10,
      marginTop: 8,
    },
    exampleUrlText: {
      fontSize: 11,
      color: colors.textSecondary,
      fontFamily: 'monospace',
    },
    accessDenied: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    accessDeniedText: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 8,
    },
    accessDeniedHint: {
      fontSize: 14,
      color: colors.textMuted,
    },
  });

  const styles = createStyles(colors);

  useEffect(() => {
    if (isAdmin) {
      loadSettings();
    }
  }, [isAdmin]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const url = await getSetting('calendar_url');
      setCalendarUrl(url || '');
    } catch (error) {
      console.error('Ошибка загрузки настроек:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await setSetting('calendar_url', calendarUrl.trim());
      Alert.alert('Успех', 'Настройки календаря сохранены');
    } catch (error) {
      console.error('Ошибка сохранения:', error);
      Alert.alert('Ошибка', 'Не удалось сохранить настройки');
    } finally {
      setSaving(false);
    }
  };

  if (!isAdmin) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <View style={styles.backButton}>
              <FontAwesome name="arrow-left" size={16} color={colors.primary} />
              <Text style={styles.backButtonText}>Назад</Text>
            </View>
          </TouchableOpacity>
        </View>
        <View style={styles.accessDenied}>
          <FontAwesome name="lock" size={48} color={colors.primary} />
          <Text style={styles.accessDeniedText}>Доступ запрещён</Text>
          <Text style={styles.accessDeniedHint}>Только для администраторов</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <View style={styles.backButton}>
            <FontAwesome name="arrow-left" size={16} color={colors.primary} />
            <Text style={styles.backButtonText}>Назад</Text>
          </View>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Календарь</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Настройка календаря</Text>
        <Text style={styles.sectionDescription}>
          Вставьте ссылку на публичный календарь Google в формате iCal.
          События будут отображаться на главной странице в блоке "Расписание на неделю".
        </Text>

        <Text style={styles.inputLabel}>URL календаря (iCal)</Text>
        <TextInput
          style={styles.input}
          value={calendarUrl}
          onChangeText={setCalendarUrl}
          placeholder="https://calendar.google.com/calendar/ical/..."
          placeholderTextColor={colors.placeholder}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
        />
        <Text style={styles.inputHint}>
          Получить ссылку: Google Calendar → Настройки → Интеграция → Ссылка в формате iCal
        </Text>

        <TouchableOpacity
          style={[styles.saveButton, saving && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.7}
        >
          {saving ? (
            <ActivityIndicator size="small" color={colors.onPrimary} />
          ) : (
            <Text style={styles.saveButtonText}>Сохранить</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.previewSection}>
        <Text style={styles.previewTitle}>Как получить ссылку</Text>
        <Text style={styles.previewHint}>
          1. Откройте Google Calendar{'\n'}
          2. Нажмите на ⚙️ → Настройки{'\n'}
          3. Выберите нужный календарь слева{'\n'}
          4. Прокрутите до "Интеграция календаря"{'\n'}
          5. Скопируйте "Ссылка в формате iCal"
        </Text>
        <View style={styles.exampleUrl}>
          <Text style={styles.exampleUrlText} numberOfLines={2}>
            https://calendar.google.com/calendar/ical/abc123@group.calendar.google.com/basic.ics
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}
