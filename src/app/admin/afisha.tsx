import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
  ActivityIndicator,
  Switch,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router/react-navigation';
import { FontAwesome } from '@expo/vector-icons';
import { useAdmin } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { ThemeColors } from '../../utils/themeColors';
import {
  getAllBanners,
  createAfishaBanner,
  updateAfishaBanner,
  deleteAfishaBanner,
  reorderAfishaBanners,
} from '../../services/api';
import { AfishaBanner } from '../../types/content';
import { pickFile, uploadFile, deleteFile, UploadResult } from '../../utils/upload';

export default function AfishaAdminScreen() {
  const router = useRouter();
  const { isAdmin } = useAdmin();
  const { colors } = useTheme();
  const styles = createStyles(colors);

  const [banners, setBanners] = useState<AfishaBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [editingBanner, setEditingBanner] = useState<AfishaBanner | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editLink, setEditLink] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);

  const loadBanners = async () => {
    setLoading(true);
    const data = await getAllBanners();
    setBanners(data);
    setLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      loadBanners();
    }, [])
  );

  const handleUpload = async () => {
    try {
      const file = await pickFile('image');
      if (!file) return;
      setUploading(true);
      setUploadProgress(0);
      const result: UploadResult = await uploadFile(file, 'image', setUploadProgress);

      const newBanner = await createAfishaBanner({
        image_url: result.url,
        image_filename: result.filename,
        sort_order: banners.length,
      });

      if (newBanner) {
        setBanners([...banners, newBanner]);
        Alert.alert('Готово', 'Баннер добавлен');
      }
    } catch (err) {
      console.error('Ошибка загрузки:', err);
      Alert.alert('Ошибка', 'Не удалось загрузить изображение');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDelete = (banner: AfishaBanner) => {
    Alert.alert(
      'Удалить баннер?',
      'Это действие нельзя отменить',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: async () => {
            // Удаляем файл из WP
            if (banner.image_filename) {
              await deleteFile(banner.image_filename).catch(() => {});
            }
            const ok = await deleteAfishaBanner(banner.id);
            if (ok) {
              setBanners(banners.filter((b) => b.id !== banner.id));
            }
          },
        },
      ]
    );
  };

  const handleToggleActive = async (banner: AfishaBanner) => {
    const ok = await updateAfishaBanner(banner.id, { is_active: !banner.is_active });
    if (ok) {
      setBanners(banners.map((b) =>
        b.id === banner.id ? { ...b, is_active: !b.is_active } : b
      ));
    }
  };

  const handleMoveUp = async (index: number) => {
    if (index === 0) return;
    const newBanners = [...banners];
    [newBanners[index - 1], newBanners[index]] = [newBanners[index], newBanners[index - 1]];
    setBanners(newBanners);
    await reorderAfishaBanners(newBanners.map((b) => b.id));
  };

  const handleMoveDown = async (index: number) => {
    if (index === banners.length - 1) return;
    const newBanners = [...banners];
    [newBanners[index], newBanners[index + 1]] = [newBanners[index + 1], newBanners[index]];
    setBanners(newBanners);
    await reorderAfishaBanners(newBanners.map((b) => b.id));
  };

  const handleEdit = (banner: AfishaBanner) => {
    setEditingBanner(banner);
    setEditTitle(banner.title || '');
    setEditLink(banner.link_url || '');
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editingBanner) return;
    const ok = await updateAfishaBanner(editingBanner.id, {
      title: editTitle.trim() || null,
      link_url: editLink.trim() || null,
    });
    if (ok) {
      setBanners(banners.map((b) =>
        b.id === editingBanner.id
          ? { ...b, title: editTitle.trim() || null, link_url: editLink.trim() || null }
          : b
      ));
      setShowEditModal(false);
      setEditingBanner(null);
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
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <View style={styles.backButton}>
            <FontAwesome name="arrow-left" size={16} color={colors.primary} />
            <Text style={styles.backButtonText}>Назад</Text>
          </View>
        </TouchableOpacity>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Афиша</Text>
          <TouchableOpacity
            style={[styles.addButton, uploading && styles.addButtonDisabled]}
            onPress={handleUpload}
            disabled={uploading}
          >
            {uploading ? (
              <ActivityIndicator size="small" color={colors.onPrimary} />
            ) : (
              <FontAwesome name="plus" size={14} color={colors.onPrimary} />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {uploading && (
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { width: `${uploadProgress}%` }]} />
          <Text style={styles.progressText}>{uploadProgress}%</Text>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.list}>
        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
        ) : banners.length === 0 ? (
          <View style={styles.emptyContainer}>
            <FontAwesome name="image" size={48} color={colors.primary} />
            <Text style={styles.emptyText}>Нет баннеров</Text>
            <Text style={styles.emptyHint}>Нажмите + чтобы добавить</Text>
          </View>
        ) : (
          banners.map((banner, index) => (
            <View key={banner.id} style={[styles.bannerCard, !banner.is_active && styles.bannerCardInactive]}>
              <Image source={{ uri: banner.image_url }} style={styles.bannerPreview} />

              <View style={styles.bannerInfo}>
                <Text style={styles.bannerOrder}>#{index + 1}</Text>
                {banner.title ? (
                  <Text style={styles.bannerTitle} numberOfLines={1}>{banner.title}</Text>
                ) : null}
                {banner.link_url ? (
                  <Text style={styles.bannerLink} numberOfLines={1}>{banner.link_url}</Text>
                ) : null}
              </View>

              <View style={styles.bannerActions}>
                <Switch
                  value={banner.is_active}
                  onValueChange={() => handleToggleActive(banner)}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor={banner.is_active ? colors.textSecondary : colors.textSecondary}
                />

                <View style={styles.orderButtons}>
                  <TouchableOpacity
                    onPress={() => handleMoveUp(index)}
                    disabled={index === 0}
                    style={[styles.orderButton, index === 0 && styles.orderButtonDisabled]}
                  >
                    <FontAwesome name="chevron-up" size={12} color={index === 0 ? colors.border : colors.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleMoveDown(index)}
                    disabled={index === banners.length - 1}
                    style={[styles.orderButton, index === banners.length - 1 && styles.orderButtonDisabled]}
                  >
                    <FontAwesome name="chevron-down" size={12} color={index === banners.length - 1 ? colors.border : colors.primary} />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity onPress={() => handleEdit(banner)} style={styles.actionButton}>
                  <FontAwesome name="pencil" size={14} color={colors.primary} />
                </TouchableOpacity>

                <TouchableOpacity onPress={() => handleDelete(banner)} style={styles.actionButton}>
                  <FontAwesome name="trash-o" size={14} color="#e74c3c" />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Модалка редактирования */}
      {showEditModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Редактировать баннер</Text>

            <Text style={styles.modalLabel}>Заголовок</Text>
            <TextInput
              style={styles.modalInput}
              value={editTitle}
              onChangeText={setEditTitle}
              placeholder="Без заголовка"
              placeholderTextColor={colors.textMuted}
            />

            <Text style={styles.modalLabel}>Ссылка</Text>
            <TextInput
              style={styles.modalInput}
              value={editLink}
              onChangeText={setEditLink}
              placeholder="/content/uuid или https://..."
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => {
                  setShowEditModal(false);
                  setEditingBanner(null);
                }}
              >
                <Text style={styles.modalCancelText}>Отмена</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSaveButton} onPress={handleSaveEdit}>
                <Text style={styles.modalSaveText}>Сохранить</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonDisabled: {
    opacity: 0.6,
  },
  progressContainer: {
    height: 4,
    backgroundColor: colors.border,
    position: 'relative',
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  progressText: {
    position: 'absolute',
    right: 8,
    top: 6,
    fontSize: 12,
    color: colors.textMuted,
  },
  list: {
    padding: 20,
    paddingBottom: 40,
  },
  loader: {
    marginTop: 40,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 60,
  },
  emptyText: {
    fontSize: 18,
    color: colors.text,
    marginTop: 12,
  },
  emptyHint: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 4,
  },
  bannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  bannerCardInactive: {
    opacity: 0.5,
  },
  bannerPreview: {
    width: 80,
    height: 45,
    borderRadius: 8,
    backgroundColor: colors.border,
  },
  bannerInfo: {
    flex: 1,
    marginLeft: 10,
  },
  bannerOrder: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 2,
  },
  bannerTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  bannerLink: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  bannerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  orderButtons: {
    flexDirection: 'column',
    gap: 2,
  },
  orderButton: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
    backgroundColor: colors.primaryAlpha10,
  },
  orderButtonDisabled: {
    backgroundColor: 'transparent',
  },
  actionButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: colors.primaryAlpha10,
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
    marginTop: 16,
  },
  // Модалка
  modalOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  modal: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 24,
    width: '85%',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  modalLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  modalInput: {
    backgroundColor: colors.inputBg,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
    fontSize: 15,
    color: colors.text,
  },
  modalInputText: {
    fontSize: 15,
    color: colors.text,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 8,
  },
  modalCancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: colors.primaryAlpha10,
  },
  modalCancelText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '500',
  },
  modalSaveButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: colors.primary,
  },
  modalSaveText: {
    color: colors.onPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
});
