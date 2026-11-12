import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Modal,
  TextInput,
  ScrollView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router/react-navigation';
import { FontAwesome } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAdmin } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { ThemeColors } from '../../utils/themeColors';
import {
  getAllMakDecks,
  getAllMakCards,
  createMakDeck,
  updateMakDeck,
  deleteMakDeck,
  addMakCards,
  deleteMakCard,
} from '../../services/api';
import { MakDeck, MakCard } from '../../types/quiet';
import { pickFile, pickImageFiles, uploadFile, deleteFile } from '../../utils/upload';

type ConfirmTarget =
  | { kind: 'deck'; id: string; label: string }
  | { kind: 'card'; id: string; label: string };

// Админка → «Колоды МАК»: колоды, карты, загрузка изображений
export default function MakDecksAdminScreen() {
  const router = useRouter();
  const { isAdmin } = useAdmin();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = createStyles(colors);

  const [decks, setDecks] = useState<MakDeck[]>([]);
  const [cards, setCards] = useState<MakCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Модалка создания колоды
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Загрузка карт
  const [uploadingDeckId, setUploadingDeckId] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadLabel, setUploadLabel] = useState('');
  const [listError, setListError] = useState<string | null>(null);

  // Подтверждение удаления
  const [confirmTarget, setConfirmTarget] = useState<ConfirmTarget | null>(null);
  const [busy, setBusy] = useState(false);

  const loadData = useCallback(async () => {
    const [deckList, cardList] = await Promise.all([getAllMakDecks(), getAllMakCards()]);
    setDecks(deckList);
    setCards(cardList);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (isAdmin) loadData();
    }, [isAdmin, loadData])
  );

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/admin');
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setCoverUrl(null);
    setFormError(null);
  };

  const handleUploadCover = async () => {
    try {
      const file = await pickFile('image');
      if (!file) return;
      setSaving(true);
      const result = await uploadFile(file, 'image');
      setCoverUrl(result.url);
    } catch (err) {
      console.error('Ошибка загрузки обложки:', err);
      setFormError('Не удалось загрузить обложку');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateDeck = async () => {
    if (!title.trim()) {
      setFormError('Введите название колоды');
      return;
    }

    setSaving(true);
    const created = await createMakDeck({
      title: title.trim(),
      description: description.trim() || null,
      cover_url: coverUrl,
    });
    setSaving(false);

    if (!created) {
      setFormError('Не удалось создать колоду');
      return;
    }

    setShowModal(false);
    resetForm();
    await loadData();
  };

  const handleToggleActive = async (deck: MakDeck) => {
    const ok = await updateMakDeck(deck.id, { is_active: !deck.is_active });
    if (ok) {
      setDecks((prev) =>
        prev.map((d) => (d.id === deck.id ? { ...d, is_active: !d.is_active } : d))
      );
    }
  };

  // Мультивыбор изображений и загрузка в WordPress
  const handleAddCards = async (deck: MakDeck) => {
    try {
      const files = await pickImageFiles();
      if (files.length === 0) return;

      setListError(null);
      setUploadingDeckId(deck.id);
      setUploadProgress(0);

      const uploaded: { image_url: string; title: string | null }[] = [];

      for (let i = 0; i < files.length; i++) {
        setUploadLabel(`Загрузка ${i + 1} из ${files.length}`);
        const result = await uploadFile(files[i], 'image', (percent) => {
          const overall = Math.round(((i + percent / 100) / files.length) * 100);
          setUploadProgress(overall);
        });
        uploaded.push({ image_url: result.url, title: null });
      }

      const added = await addMakCards(deck.id, uploaded);
      if (added === 0) {
        setListError('Не удалось добавить карты');
      }

      await loadData();
      setExpandedId(deck.id);
    } catch (err) {
      console.error('Ошибка добавления карт:', err);
      setListError('Не удалось загрузить карты');
    } finally {
      setUploadingDeckId(null);
      setUploadProgress(0);
      setUploadLabel('');
    }
  };

  const handleConfirm = async () => {
    if (!confirmTarget || busy) return;

    setBusy(true);

    if (confirmTarget.kind === 'card') {
      const card = cards.find((c) => c.id === confirmTarget.id);
      const ok = await deleteMakCard(confirmTarget.id);
      if (ok && card) {
        // Удаляем изображение из WordPress (не критично при ошибке)
        deleteFile(card.image_url);
      }
      if (ok) {
        setCards((prev) => prev.filter((c) => c.id !== confirmTarget.id));
      }
    } else {
      const deckCards = cards.filter((c) => c.deck_id === confirmTarget.id);
      const ok = await deleteMakDeck(confirmTarget.id);
      if (ok) {
        deckCards.forEach((card) => deleteFile(card.image_url));
        setDecks((prev) => prev.filter((d) => d.id !== confirmTarget.id));
        setCards((prev) => prev.filter((c) => c.deck_id !== confirmTarget.id));
      }
    }

    setBusy(false);
    setConfirmTarget(null);
  };

  const header = (
    <View
      style={[
        styles.header,
        {
          backgroundColor: colors.surface,
          borderBottomColor: colors.border,
          paddingTop: insets.top + 10,
        },
      ]}
    >
      <TouchableOpacity onPress={handleBack} style={styles.backButton}>
        <FontAwesome name="arrow-left" size={18} color={colors.primary} />
      </TouchableOpacity>
      <Text style={[styles.headerTitle, { color: colors.text }]}>Колоды МАК</Text>
      <TouchableOpacity
        onPress={() => {
          resetForm();
          setShowModal(true);
        }}
        style={[styles.addButton, { backgroundColor: colors.primary }]}
        hitSlop={8}
      >
        <FontAwesome name="plus" size={16} color={colors.onPrimary} />
      </TouchableOpacity>
    </View>
  );

  if (!isAdmin) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {header}
        <View style={styles.centered}>
          <FontAwesome name="lock" size={48} color={colors.primary} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>Доступ запрещён</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {header}

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={decks}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <>
              <Text style={[styles.hint, { color: colors.textMuted }]}>
                Пользователь выбирает колоду по теме — карта выпадает случайно при публикации.
                Карты загружаются в WordPress.
              </Text>
              {!!listError && (
                <Text style={[styles.error, { color: colors.error }]}>{listError}</Text>
              )}
            </>
          }
          ListEmptyComponent={
            <View style={styles.centered}>
              <FontAwesome name="clone" size={44} color={colors.primaryAlpha20} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>Колод пока нет</Text>
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                Создайте первую колоду и загрузите карты
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const deckCards = cards.filter((c) => c.deck_id === item.id);
            const expanded = expandedId === item.id;
            const isUploading = uploadingDeckId === item.id;

            return (
              <View
                style={[
                  styles.card,
                  { backgroundColor: colors.surface, borderColor: colors.cardBorder },
                ]}
              >
                <View style={styles.deckHeader}>
                  {item.cover_url ? (
                    <Image source={{ uri: item.cover_url }} style={styles.cover} />
                  ) : (
                    <View style={[styles.cover, styles.coverEmpty, { backgroundColor: colors.cardIconBg }]}>
                      <FontAwesome name="clone" size={20} color={colors.cardIconColor} />
                    </View>
                  )}

                  <View style={styles.deckBody}>
                    <Text style={[styles.deckTitle, { color: colors.text }]}>{item.title}</Text>
                    {!!item.description && (
                      <Text style={[styles.deckDescription, { color: colors.textMuted }]} numberOfLines={2}>
                        {item.description}
                      </Text>
                    )}
                    <View style={styles.deckMetaRow}>
                      <Text style={[styles.deckMeta, { color: colors.textMuted }]}>
                        {deckCards.length} карт
                      </Text>
                      <View
                        style={[
                          styles.statusBadge,
                          { backgroundColor: item.is_active ? colors.success + '20' : colors.border },
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusText,
                            { color: item.is_active ? colors.success : colors.textMuted },
                          ]}
                        >
                          {item.is_active ? 'активна' : 'выключена'}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                {isUploading && (
                  <View style={styles.uploadBox}>
                    <Text style={[styles.uploadText, { color: colors.textSecondary }]}>
                      {uploadLabel} · {uploadProgress}%
                    </Text>
                    <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
                      <View
                        style={[
                          styles.progressFill,
                          { backgroundColor: colors.primary, width: `${uploadProgress}%` },
                        ]}
                      />
                    </View>
                  </View>
                )}

                <View style={styles.actions}>
                  <TouchableOpacity
                    style={[styles.actionButton, { borderColor: colors.border }]}
                    onPress={() => handleAddCards(item)}
                    disabled={isUploading}
                  >
                    <FontAwesome name="plus" size={12} color={colors.primary} />
                    <Text style={[styles.actionText, { color: colors.primary }]}>Карты</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionButton, { borderColor: colors.border }]}
                    onPress={() => setExpandedId(expanded ? null : item.id)}
                  >
                    <FontAwesome name={expanded ? 'chevron-up' : 'chevron-down'} size={12} color={colors.primary} />
                    <Text style={[styles.actionText, { color: colors.primary }]}>
                      {expanded ? 'Свернуть' : 'Показать'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionButton, { borderColor: colors.border }]}
                    onPress={() => handleToggleActive(item)}
                  >
                    <FontAwesome name={item.is_active ? 'eye-slash' : 'eye'} size={12} color={colors.primary} />
                    <Text style={[styles.actionText, { color: colors.primary }]}>
                      {item.is_active ? 'Выключить' : 'Включить'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionButton, { borderColor: colors.border }]}
                    onPress={() =>
                      setConfirmTarget({ kind: 'deck', id: item.id, label: item.title })
                    }
                  >
                    <FontAwesome name="trash-o" size={12} color={colors.error} />
                  </TouchableOpacity>
                </View>

                {expanded && (
                  <View style={styles.cardsGrid}>
                    {deckCards.length === 0 ? (
                      <Text style={[styles.emptyCards, { color: colors.textMuted }]}>
                        В колоде ещё нет карт
                      </Text>
                    ) : (
                      deckCards.map((card) => (
                        <View key={card.id} style={styles.cardThumbWrap}>
                          <Image source={{ uri: card.image_url }} style={styles.cardThumb} resizeMode="cover" />
                          <TouchableOpacity
                            style={[styles.cardRemove, { backgroundColor: colors.error }]}
                            onPress={() =>
                              setConfirmTarget({
                                kind: 'card',
                                id: card.id,
                                label: 'карту',
                              })
                            }
                            hitSlop={6}
                          >
                            <FontAwesome name="times" size={10} color={colors.onPrimary} />
                          </TouchableOpacity>
                        </View>
                      ))
                    )}
                  </View>
                )}
              </View>
            );
          }}
        />
      )}

      {/* Модалка создания колоды */}
      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <ScrollView keyboardShouldPersistTaps="handled">
              <Text style={[styles.modalTitle, { color: colors.text }]}>Новая колода</Text>

              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Название</Text>
              <TextInput
                style={[styles.fieldInput, { backgroundColor: colors.inputBg, color: colors.text }]}
                value={title}
                onChangeText={setTitle}
                placeholder="Например: Сила рода"
                placeholderTextColor={colors.placeholder}
              />

              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Описание</Text>
              <TextInput
                style={[
                  styles.fieldInput,
                  styles.fieldTextarea,
                  { backgroundColor: colors.inputBg, color: colors.text },
                ]}
                value={description}
                onChangeText={setDescription}
                placeholder="Коротко о теме колоды"
                placeholderTextColor={colors.placeholder}
                multiline
              />

              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Обложка</Text>
              <TouchableOpacity
                style={[styles.coverPicker, { borderColor: colors.border }]}
                onPress={handleUploadCover}
                disabled={saving}
              >
                {coverUrl ? (
                  <Image source={{ uri: coverUrl }} style={styles.coverPreview} />
                ) : (
                  <View style={styles.coverPlaceholder}>
                    <FontAwesome name="image" size={22} color={colors.primary} />
                    <Text style={[styles.coverPlaceholderText, { color: colors.textMuted }]}>
                      Загрузить обложку
                    </Text>
                  </View>
                )}
              </TouchableOpacity>

              {!!formError && (
                <Text style={[styles.error, { color: colors.error }]}>{formError}</Text>
              )}

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalCancel, { borderColor: colors.border }]}
                  onPress={() => setShowModal(false)}
                  disabled={saving}
                >
                  <Text style={[styles.modalCancelText, { color: colors.textSecondary }]}>
                    Отмена
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalSave, { backgroundColor: colors.primary }]}
                  onPress={handleCreateDeck}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color={colors.onPrimary} />
                  ) : (
                    <Text style={[styles.modalSaveText, { color: colors.onPrimary }]}>
                      Создать
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Подтверждение удаления */}
      <Modal
        visible={!!confirmTarget}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmTarget(null)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <View style={[styles.confirmModal, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Удалить?</Text>
            <Text style={[styles.confirmText, { color: colors.textMuted }]}>
              {confirmTarget?.kind === 'deck'
                ? `Колода «${confirmTarget.label}» и все её карты будут удалены. Вопросы сохранят картинку карты в архиве.`
                : 'Карта будет удалена из колоды и из медиатеки WordPress.'}
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalCancel, { borderColor: colors.border }]}
                onPress={() => setConfirmTarget(null)}
                disabled={busy}
              >
                <Text style={[styles.modalCancelText, { color: colors.textSecondary }]}>Отмена</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSave, { backgroundColor: colors.error }]}
                onPress={handleConfirm}
                disabled={busy}
              >
                {busy ? (
                  <ActivityIndicator size="small" color={colors.onPrimary} />
                ) : (
                  <Text style={[styles.modalSaveText, { color: colors.onPrimary }]}>Удалить</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    paddingBottom: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
  },
  addButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 32,
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  list: {
    padding: 16,
    paddingBottom: 32,
  },
  hint: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 14,
  },
  error: {
    fontSize: 13,
    marginBottom: 10,
  },
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  deckHeader: {
    flexDirection: 'row',
  },
  cover: {
    width: 56,
    height: 74,
    borderRadius: 8,
    marginRight: 12,
  },
  coverEmpty: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  deckBody: {
    flex: 1,
  },
  deckTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  deckDescription: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: 3,
  },
  deckMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 6,
  },
  deckMeta: {
    fontSize: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  uploadBox: {
    marginTop: 12,
  },
  uploadText: {
    fontSize: 12,
    marginBottom: 6,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: 4,
    borderRadius: 2,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
  },
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  emptyCards: {
    fontSize: 12,
  },
  cardThumbWrap: {
    position: 'relative',
  },
  cardThumb: {
    width: 64,
    height: 84,
    borderRadius: 8,
  },
  cardRemove: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 20,
    maxHeight: '90%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 6,
  },
  fieldInput: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    marginBottom: 14,
  },
  fieldTextarea: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
  coverPicker: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 12,
    height: 90,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginBottom: 14,
  },
  coverPreview: {
    width: '100%',
    height: '100%',
  },
  coverPlaceholder: {
    alignItems: 'center',
    gap: 6,
  },
  coverPlaceholderText: {
    fontSize: 12,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  modalCancel: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 15,
    fontWeight: '600',
  },
  modalSave: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  modalSaveText: {
    fontSize: 15,
    fontWeight: '600',
  },
  confirmModal: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 20,
  },
  confirmText: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 8,
  },
});
