import * as DocumentPicker from 'expo-document-picker';
import { readAsStringAsync, EncodingType } from 'expo-file-system/legacy';
import { WP_API_BASE, CONFIG } from '../config';

// Типы загружаемых файлов
export type UploadFileType = 'audio' | 'video' | 'image';

// Результат загрузки
export interface UploadResult {
  url: string;
  filename: string;
  size: number;
  mediaId?: number;
}

// Разрешённые MIME-типы
const ALLOWED_MIME_TYPES: Record<UploadFileType, string[]> = {
  audio: ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/aac'],
  video: ['video/mp4', 'video/quicktime', 'video/webm'],
  image: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
};

// Получить расширение по MIME-типу
const getExtension = (mimeType: string): string => {
  const map: Record<string, string> = {
    'audio/mpeg': 'mp3',
    'audio/mp3': 'mp3',
    'audio/wav': 'wav',
    'audio/ogg': 'ogg',
    'audio/aac': 'aac',
    'video/mp4': 'mp4',
    'video/quicktime': 'mov',
    'video/webm': 'webm',
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
  };
  return map[mimeType] || 'bin';
};

// Получить MIME-тип по расширению
const getMimeType = (ext: string): string => {
  const map: Record<string, string> = {
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    ogg: 'audio/ogg',
    aac: 'audio/aac',
    mp4: 'video/mp4',
    mov: 'video/quicktime',
    webm: 'video/webm',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    gif: 'image/gif',
  };
  return map[ext] || 'application/octet-stream';
};

// Генерация Basic Auth заголовка для WordPress
const getAuthHeader = (): string => {
  const credentials = `${CONFIG.WP_USER}:${CONFIG.WP_APP_PASSWORD}`;
  // Используем btoa для base64 кодирования (доступно в Expo)
  const encoded = btoa(credentials);
  return `Basic ${encoded}`;
};

// Выбрать файл из устройства
export const pickFile = async (type: UploadFileType): Promise<DocumentPicker.DocumentPickerAsset | null> => {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: ALLOWED_MIME_TYPES[type],
      copyToCacheDirectory: true,
      multiple: false,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return null;
    }

    return result.assets[0];
  } catch (error) {
    console.error('Ошибка выбора файла:', error);
    throw error;
  }
};

// Загрузить файл в WordPress Media Library
export const uploadFile = async (
  file: DocumentPicker.DocumentPickerAsset,
  type: UploadFileType,
  onProgress?: (progress: number) => void
): Promise<UploadResult> => {
  try {
    if (!CONFIG.WP_URL || !CONFIG.WP_USER || !CONFIG.WP_APP_PASSWORD) {
      throw new Error('WordPress не настроен. Проверьте EXPO_PUBLIC_WP_URL, EXPO_PUBLIC_WP_USER и EXPO_PUBLIC_WP_APP_PASSWORD в .env');
    }

    onProgress?.(10);

    // Читаем файл как base64
    const fileContent = await readAsStringAsync(file.uri, {
      encoding: EncodingType.Base64,
    });

    onProgress?.(30);

    // Генерируем имя файла
    const ext = getExtension(file.mimeType || 'application/octet-stream');
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const filename = `${type}_${timestamp}_${randomStr}.${ext}`;

    onProgress?.(50);

    // Конвертируем base64 в бинарные данные
    const binaryString = atob(fileContent);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    onProgress?.(70);

    // Загружаем в WordPress Media Library
    const mimeType = getMimeType(ext);
    const response = await fetch(`${WP_API_BASE}/media`, {
      method: 'POST',
      headers: {
        'Authorization': getAuthHeader(),
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Type': mimeType,
      },
      body: bytes,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData?.message || `HTTP ${response.status}`;
      console.error('Ошибка загрузки в WordPress:', errorMessage);
      throw new Error('Не удалось загрузить файл: ' + errorMessage);
    }

    const data = await response.json();

    onProgress?.(100);

    return {
      url: data.source_url,
      filename,
      size: file.size || 0,
      mediaId: data.id,
    };
  } catch (error) {
    console.error('Ошибка загрузки файла:', error);
    throw error;
  }
};

// Удалить файл из WordPress Media Library
export const deleteFile = async (mediaIdOrUrl: string | number): Promise<boolean> => {
  try {
    if (!CONFIG.WP_URL || !CONFIG.WP_USER || !CONFIG.WP_APP_PASSWORD) {
      console.error('WordPress не настроен для удаления');
      return false;
    }

    // Если передан URL — пытаемся найти media по URL
    let mediaId: number;
    if (typeof mediaIdOrUrl === 'number') {
      mediaId = mediaIdOrUrl;
    } else {
      const mediaUrl = mediaIdOrUrl;
      const filename = mediaUrl.split('/').pop() || '';

      // Ищем media по имени файла
      const searchResponse = await fetch(
        `${WP_API_BASE}/media?search=${encodeURIComponent(filename)}&per_page=10`,
        { headers: { 'Authorization': getAuthHeader() } }
      );

      if (!searchResponse.ok) {
        console.error('Ошибка поиска media для удаления:', searchResponse.status);
        return false;
      }

      const mediaList = await searchResponse.json();

      // Нормализуем URL для сравнения (убираем trailing slash, приводим к https)
      const normalizeUrl = (u: string) => u.replace(/\/+$/, '').replace(/^http:/, 'https:');
      const targetUrl = normalizeUrl(mediaUrl);

      // Ищем точное совпадение source_url
      let media = mediaList.find((m: any) => normalizeUrl(m.source_url) === targetUrl);

      // Если не нашли по source_url — ищем по slug (имя файла без расширения)
      if (!media) {
        const slug = filename.replace(/\.[^.]+$/, '');
        media = mediaList.find((m: any) => {
          const mSlug = m.slug || m.title?.rendered || '';
          return mSlug === slug || mSlug.includes(slug);
        });
      }

      if (!media) {
        console.warn('Media не найден для удаления:', mediaUrl, '| filename:', filename);
        return false;
      }

      mediaId = media.id;
    }

    // Удаляем media
    const deleteResponse = await fetch(`${WP_API_BASE}/media/${mediaId}?force=true`, {
      method: 'DELETE',
      headers: { 'Authorization': getAuthHeader() },
    });

    if (!deleteResponse.ok) {
      console.error('Ошибка удаления media:', deleteResponse.status, mediaId);
    }

    return deleteResponse.ok;
  } catch (error) {
    console.error('Неожиданная ошибка при удалении файла:', error);
    return false;
  }
};

// Извлечь media ID из URL WordPress
export const extractMediaId = (url: string): number | null => {
  // WordPress URL формат: /wp-content/uploads/YYYY/MM/filename.ext
  // Media ID не содержится в URL, нужно искать через API
  return null;
};

// Проверить, является ли URL файлом из WordPress Media Library
const isWpMediaUrl = (url: string): boolean => {
  return url.includes('/wp-content/uploads/');
};

// Извлечь URLs файлов из Markdown-текста (изображения)
const extractFileUrlsFromMarkdown = (markdown: string): string[] => {
  if (!markdown) return [];
  const urls: string[] = [];
  // ![...](url) — стандартный markdown
  const mdRegex = /!\[[^\]]*\]\(([^)]+)\)/g;
  let match;
  while ((match = mdRegex.exec(markdown)) !== null) {
    if (isWpMediaUrl(match[1])) urls.push(match[1]);
  }
  // <img src="url"> — HTML-теги
  const imgRegex = /<img[^>]+src="([^"]+)"/g;
  while ((match = imgRegex.exec(markdown)) !== null) {
    if (isWpMediaUrl(match[1])) urls.push(match[1]);
  }
  return [...new Set(urls)];
};

// Удалить все файлы, связанные с контентом
export const deleteContentFiles = async (contentData: Record<string, unknown>): Promise<void> => {
  const urlsToDelete: string[] = [];

  // Превью-изображение (обложка статьи)
  const imageUrl = contentData?.image_url as string;
  if (imageUrl && isWpMediaUrl(imageUrl)) urlsToDelete.push(imageUrl);

  // Тело статьи (изображения в markdown)
  const body = contentData?.body as string;
  if (body) urlsToDelete.push(...extractFileUrlsFromMarkdown(body));

  // Премиум-тело (изображения в markdown)
  const premiumBody = contentData?.premium_body as string;
  if (premiumBody) urlsToDelete.push(...extractFileUrlsFromMarkdown(premiumBody));

  // Аудио и видео
  const audioUrl = contentData?.audio_url as string;
  if (audioUrl && isWpMediaUrl(audioUrl)) urlsToDelete.push(audioUrl);

  const videoUrl = contentData?.video_url as string;
  if (videoUrl && isWpMediaUrl(videoUrl)) urlsToDelete.push(videoUrl);

  const premiumAudioUrl = contentData?.premium_audio_url as string;
  if (premiumAudioUrl && isWpMediaUrl(premiumAudioUrl)) urlsToDelete.push(premiumAudioUrl);

  const premiumVideoUrl = contentData?.premium_video_url as string;
  if (premiumVideoUrl && isWpMediaUrl(premiumVideoUrl)) urlsToDelete.push(premiumVideoUrl);

  // Удаляем уникальные URLs
  const uniqueUrls = [...new Set(urlsToDelete)];
  if (uniqueUrls.length === 0) {
    console.log('Нет файлов WordPress для удаления');
    return;
  }

  console.log(`Удаление ${uniqueUrls.length} файлов из WordPress:`, uniqueUrls);
  const results = await Promise.allSettled(uniqueUrls.map(url => deleteFile(url)));
  results.forEach((r, i) => {
    if (r.status === 'rejected') console.error('Ошибка удаления:', uniqueUrls[i], r.reason);
    else if (!r.value) console.warn('Не удалось удалить:', uniqueUrls[i]);
    else console.log('Удалён:', uniqueUrls[i]);
  });
};
