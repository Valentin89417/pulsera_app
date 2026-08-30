import { Platform } from 'react-native';
import {
  documentDirectory,
  makeDirectoryAsync,
  getInfoAsync,
  writeAsStringAsync,
  readAsStringAsync,
  EncodingType,
  deleteAsync,
  createDownloadResumable,
} from 'expo-file-system/legacy';
import storage from './storage';

// Директория для скачанного контента
const DOWNLOADS_DIR = `${documentDirectory}downloads/`;
const DOWNLOADS_KEY = '@pulsera_downloads';

// Метаданные скачанного контента
export interface DownloadMeta {
  id: string;
  title: string;
  type: 'article' | 'audio' | 'video' | 'course';
  filename: string;
  downloadedAt: string;
  // Локальные файлы изображений (для удаления)
  previewImage?: string;
  bodyImages?: string[];
}

// Получение расширения файла по типу контента
const getFileExtension = (type: string): string => {
  switch (type) {
    case 'audio': return '.mp3';
    case 'video': return '.mp4';
    default: return '.txt';
  }
};

// Убедиться что папка downloads существует
const ensureDownloadsDir = async (): Promise<void> => {
  const dirInfo = await getInfoAsync(DOWNLOADS_DIR);
  if (!dirInfo.exists) {
    await makeDirectoryAsync(DOWNLOADS_DIR, { intermediates: true });
  }
};

// Получение пути к локальному файлу
export const getLocalPath = (contentId: string, type: string): string => {
  const ext = getFileExtension(type);
  return `${DOWNLOADS_DIR}${contentId}${ext}`;
};

// Путь к превью-изображению
const getPreviewImagePath = (contentId: string, ext: string): string => {
  return `${DOWNLOADS_DIR}${contentId}_preview${ext}`;
};

// Путь к изображению из тела статьи
const getBodyImagePath = (contentId: string, index: number, ext: string): string => {
  return `${DOWNLOADS_DIR}${contentId}_img_${index}${ext}`;
};

// Определение расширения по URL
const getExtFromUrl = (url: string): string => {
  const match = url.match(/\.(jpe?g|png|gif|webp|svg)(\?|$)/i);
  if (match) {
    const ext = match[1].toLowerCase();
    return ext === 'jpg' ? '.jpg' : `.${ext}`;
  }
  return '.jpg';
};

// Скачивание одного изображения по URL
const downloadSingleImage = async (
  url: string,
  targetPath: string
): Promise<string> => {
  const downloadResult = createDownloadResumable(url, targetPath, {});
  const result = await downloadResult.downloadAsync();
  if (!result) {
    throw new Error(`Ошибка скачивания изображения: ${url}`);
  }
  return result.uri;
};

// Проверка — скачан ли контент
export const isDownloaded = async (contentId: string): Promise<boolean> => {
  try {
    const meta = await getDownloadsMeta();
    return meta.some((d) => d.id === contentId);
  } catch {
    return false;
  }
};

// Получение списка метаданных скачанного
export const getDownloadsMeta = async (): Promise<DownloadMeta[]> => {
  try {
    const raw = await storage.getItem(DOWNLOADS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as DownloadMeta[];
  } catch {
    return [];
  }
};

// Сохранение метаданных
const saveDownloadsMeta = async (meta: DownloadMeta[]): Promise<void> => {
  await storage.setItem(DOWNLOADS_KEY, JSON.stringify(meta));
};

// Скачивание текста статьи
const downloadArticle = async (
  contentId: string,
  body: string
): Promise<string> => {
  await ensureDownloadsDir();
  const filePath = getLocalPath(contentId, 'article');
  await writeAsStringAsync(filePath, body, {
    encoding: EncodingType.UTF8,
  });
  return filePath;
};

// Скачивание аудио/видео по URL
const downloadMedia = async (
  contentId: string,
  url: string,
  type: 'audio' | 'video',
  onProgress?: (progress: number) => void
): Promise<string> => {
  await ensureDownloadsDir();
  const filePath = getLocalPath(contentId, type);

  const downloadResult = createDownloadResumable(
    url,
    filePath,
    {},
    (downloadProgress) => {
      if (onProgress && downloadProgress.totalBytesExpectedToWrite > 0) {
        const progress =
          downloadProgress.totalBytesWritten /
          downloadProgress.totalBytesExpectedToWrite;
        onProgress(progress);
      }
    }
  );

  const result = await downloadResult.downloadAsync();
  if (!result) {
    throw new Error('Ошибка скачивания');
  }
  return result.uri;
};

// Скачивание превью-изображения
const downloadPreviewImage = async (
  contentId: string,
  imageUrl: string
): Promise<string> => {
  await ensureDownloadsDir();
  const ext = getExtFromUrl(imageUrl);
  const filePath = getPreviewImagePath(contentId, ext);
  await downloadSingleImage(imageUrl, filePath);
  return filePath;
};

// Скачивание изображений из тела статьи + перезапись URL в body
const downloadBodyImages = async (
  contentId: string,
  body: string
): Promise<{ body: string; imageFiles: string[] }> => {
  // Регулярка для markdown изображений: ![alt](url)
  const imgRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
  const imageFiles: string[] = [];
  let modifiedBody = body;
  let index = 0;

  let match;
  while ((match = imgRegex.exec(body)) !== null) {
    const [fullMatch, alt, url] = match;
    // Пропускаем уже локальные пути
    if (url.startsWith('file://') || url.startsWith('/')) {
      index++;
      continue;
    }

    try {
      await ensureDownloadsDir();
      const ext = getExtFromUrl(url);
      const filePath = getBodyImagePath(contentId, index, ext);
      await downloadSingleImage(url, filePath);
      imageFiles.push(filePath);
      // Перезаписываем URL на локальный путь
      modifiedBody = modifiedBody.replace(fullMatch, `![${alt}](${filePath})`);
    } catch (error) {
      console.error(`Ошибка скачивания изображения ${url}:`, error);
    }
    index++;
  }

  return { body: modifiedBody, imageFiles };
};

// Скачивание контента
export const downloadContent = async (
  contentId: string,
  title: string,
  type: string,
  data: { body?: string; audio_url?: string; video_url?: string; image_url?: string },
  onProgress?: (progress: number) => void
): Promise<boolean> => {
  try {
    let filename = '';
    let previewImage: string | undefined;
    let bodyImages: string[] | undefined;
    let finalBody = data.body;

    if (type === 'article' && data.body) {
      // Скачиваем изображения из тела и перезаписываем URL
      const result = await downloadBodyImages(contentId, data.body);
      finalBody = result.body;
      if (result.imageFiles.length > 0) {
        bodyImages = result.imageFiles;
      }
      // Сохраняем тело с локальными путями
      const filePath = await downloadArticle(contentId, finalBody);
      filename = filePath.split('/').pop() || `${contentId}.txt`;
    } else if (type === 'audio' && data.audio_url) {
      const filePath = await downloadMedia(contentId, data.audio_url, 'audio', onProgress);
      filename = filePath.split('/').pop() || `${contentId}.mp3`;
    } else if (type === 'video' && data.video_url) {
      const filePath = await downloadMedia(contentId, data.video_url, 'video', onProgress);
      filename = filePath.split('/').pop() || `${contentId}.mp4`;
    } else {
      return false;
    }

    // Скачиваем превью-изображение (для всех типов)
    if (data.image_url) {
      try {
        const previewPath = await downloadPreviewImage(contentId, data.image_url);
        previewImage = previewPath;
      } catch (error) {
        console.error('Ошибка скачивания превью:', error);
      }
    }

    // Обновляем метаданные
    const meta = await getDownloadsMeta();
    const existing = meta.findIndex((d) => d.id === contentId);
    const newEntry: DownloadMeta = {
      id: contentId,
      title,
      type: type as DownloadMeta['type'],
      filename,
      downloadedAt: new Date().toISOString(),
      ...(previewImage && { previewImage }),
      ...(bodyImages && { bodyImages }),
    };

    if (existing >= 0) {
      meta[existing] = newEntry;
    } else {
      meta.push(newEntry);
    }

    await saveDownloadsMeta(meta);
    return true;
  } catch (error) {
    console.error('Ошибка скачивания контента:', error);
    return false;
  }
};

// Удаление скачанного контента
export const removeDownload = async (contentId: string): Promise<boolean> => {
  try {
    const meta = await getDownloadsMeta();
    const entry = meta.find((d) => d.id === contentId);

    if (entry) {
      // Удаляем основной файл
      const filePath = getLocalPath(contentId, entry.type);
      const fileInfo = await getInfoAsync(filePath);
      if (fileInfo.exists) {
        await deleteAsync(filePath);
      }

      // Удаляем превью
      if (entry.previewImage) {
        try {
          const previewInfo = await getInfoAsync(entry.previewImage);
          if (previewInfo.exists) {
            await deleteAsync(entry.previewImage);
          }
        } catch {}
      }

      // Удаляем изображения из тела
      if (entry.bodyImages && entry.bodyImages.length > 0) {
        for (const imgPath of entry.bodyImages) {
          try {
            const imgInfo = await getInfoAsync(imgPath);
            if (imgInfo.exists) {
              await deleteAsync(imgPath);
            }
          } catch {}
        }
      }
    }

    const updated = meta.filter((d) => d.id !== contentId);
    await saveDownloadsMeta(updated);
    return true;
  } catch (error) {
    console.error('Ошибка удаления контента:', error);
    return false;
  }
};

// Чтение скачанного текста статьи
export const readDownloadedArticle = async (contentId: string): Promise<string | null> => {
  try {
    const filePath = getLocalPath(contentId, 'article');
    const fileInfo = await getInfoAsync(filePath);
    if (!fileInfo.exists) return null;
    return await readAsStringAsync(filePath, {
      encoding: EncodingType.UTF8,
    });
  } catch {
    return null;
  }
};

// Получение локального URI для скачанного аудио/видео
export const getDownloadedMediaUri = async (contentId: string, type: string): Promise<string | null> => {
  try {
    const filePath = getLocalPath(contentId, type);
    const fileInfo = await getInfoAsync(filePath);
    if (!fileInfo.exists) return null;
    return fileInfo.uri;
  } catch {
    return null;
  }
};

// Получение локального URI превью-изображения
export const getDownloadedPreviewUri = async (contentId: string): Promise<string | null> => {
  try {
    const meta = await getDownloadsMeta();
    const entry = meta.find((d) => d.id === contentId);
    if (!entry?.previewImage) return null;
    const fileInfo = await getInfoAsync(entry.previewImage);
    if (!fileInfo.exists) return null;
    return fileInfo.uri;
  } catch {
    return null;
  }
};
