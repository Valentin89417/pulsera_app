import { create } from 'zustand';
import {
  getDownloadsMeta,
  downloadContent,
  removeDownload,
  DownloadMeta,
} from '../utils/offlineCache';
import { ContentItem } from '../types';
import { getExistingContentIds } from '../services/api';

// Состояние store скачанного
interface DownloadState {
  downloadedIds: Set<string>;
  downloadingIds: Set<string>;
  downloads: DownloadMeta[];
  isLoaded: boolean;

  loadDownloads: () => Promise<void>;
  toggleDownload: (item: ContentItem) => Promise<boolean>;
  isDownloaded: (id: string) => boolean;
  isDownloading: (id: string) => boolean;
}

export const useDownloadStore = create<DownloadState>((set, get) => ({
  downloadedIds: new Set<string>(),
  downloadingIds: new Set<string>(),
  downloads: [],
  isLoaded: false,

  // Загрузка списка скачанного из AsyncStorage + очистка удалённых статей
  loadDownloads: async () => {
    try {
      const meta = await getDownloadsMeta();
      const ids = meta.map((d) => d.id);

      if (ids.length > 0) {
        // Проверяем какие статьи ещё существуют в Supabase
        const existingIds = await getExistingContentIds(ids);
        const orphaned = meta.filter(d => !existingIds.has(d.id));

        // Удаляем осиротевшие записи и файлы
        if (orphaned.length > 0) {
          console.log(`Очистка ${orphaned.length} удалённых статей из кэша`);
          for (const entry of orphaned) {
            await removeDownload(entry.id);
          }
          // Перечитываем метаданные после очистки
          const cleanedMeta = await getDownloadsMeta();
          const cleanedIds = new Set(cleanedMeta.map((d) => d.id));
          set({ downloads: cleanedMeta, downloadedIds: cleanedIds, isLoaded: true });
          return;
        }
      }

      const idSet = new Set(ids);
      set({ downloads: meta, downloadedIds: idSet, isLoaded: true });
    } catch (error) {
      console.error('Ошибка загрузки скачанного:', error);
      set({ isLoaded: true });
    }
  },

  // Переключение скачивания (скачать / удалить)
  toggleDownload: async (item: ContentItem) => {
    const { downloadedIds, downloadingIds } = get();
    const isAlreadyDownloaded = downloadedIds.has(item.id);

    // Если уже скачано — удаляем
    if (isAlreadyDownloaded) {
      await removeDownload(item.id);
      const newIds = new Set(downloadedIds);
      newIds.delete(item.id);
      const meta = await getDownloadsMeta();
      set({ downloadedIds: newIds, downloads: meta });
      return true;
    }

    // Если уже идёт скачивание — пропускаем
    if (downloadingIds.has(item.id)) return false;

    // Скачиваем
    const newDownloading = new Set(downloadingIds);
    newDownloading.add(item.id);
    set({ downloadingIds: newDownloading });

    try {
      const contentData = item.content_data as {
        body?: string;
        audio_url?: string;
        video_url?: string;
        image_url?: string;
      };

      const success = await downloadContent(
        item.id,
        item.title,
        item.type,
        contentData
      );

      if (success) {
        const newIds = new Set(downloadedIds);
        newIds.add(item.id);
        const meta = await getDownloadsMeta();
        set({ downloadedIds: newIds, downloads: meta });
      }

      return success;
    } finally {
      const current = new Set(get().downloadingIds);
      current.delete(item.id);
      set({ downloadingIds: current });
    }
  },

  isDownloaded: (id: string) => get().downloadedIds.has(id),
  isDownloading: (id: string) => get().downloadingIds.has(id),
}));
