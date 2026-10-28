import * as DocumentPicker from 'expo-document-picker';
import {
  createUploadTask,
  FileSystemUploadType,
} from 'expo-file-system/legacy';
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

    onProgress?.(0);

    // Проверяем размер файла — слишком большой вызовет OOM/отказ сервера
    const MAX_SIZE = 1024 * 1024 * 1024; // 1 ГБ
    if (file.size && file.size > MAX_SIZE) {
      throw new Error('Файл слишком большой (максимум 1 ГБ). Сожмите видео перед загрузкой.');
    }

    // Генерируем имя файла
    const ext = getExtension(file.mimeType || 'application/octet-stream');
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const filename = `${type}_${timestamp}_${randomStr}.${ext}`;
    const mimeType = getMimeType(ext);

    // Нативный потоковый upload: файл читается с диска в нативном слое (OkHttp),
    // JS-хип не копируется вообще — fix OOM на больших видео (120 МБ+).
    // Прогресс приходит в реальном времени по байтам.
    const uploadTask = createUploadTask(
      `${WP_API_BASE}/media`,
      file.uri,
      {
        httpMethod: 'POST',
        headers: {
          'Authorization': getAuthHeader(),
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Content-Type': mimeType,
        },
        uploadType: FileSystemUploadType.BINARY_CONTENT,
      },
      (progress: { totalBytesSent: number; totalBytesExpectedToSend: number }) => {
        if (progress.totalBytesExpectedToSend > 0) {
          const percent = Math.round(
            (progress.totalBytesSent / progress.totalBytesExpectedToSend) * 100
          );
          onProgress?.(Math.min(percent, 99));
        }
      }
    );

    const result = await uploadTask.uploadAsync();
    if (!result) {
      throw new Error('Загрузка прервалась. Проверьте соединение и повторите.');
    }

    if (result.status < 200 || result.status >= 300) {
      let serverMessage = '';
      try {
        const parsed = JSON.parse(result.body);
        serverMessage = parsed?.message || '';
      } catch {
        // ответ не JSON — игнорируем
      }
      console.error(
        `Ошибка загрузки в WordPress: HTTP ${result.status}`,
        result.body?.slice(0, 500)
      );
      if (result.status === 413) {
        throw new Error(
          'Файл слишком большой для сервера. Нужно увеличить client_max_body_size в Nginx.'
        );
      }
      throw new Error(
        `Не удалось загрузить файл (HTTP ${result.status})${serverMessage ? ': ' + serverMessage : ''}`
      );
    }

    const data = JSON.parse(result.body);

    onProgress?.(100);

    return {
      url: data.source_url,
      filename,
      size: file.size || 0,
      mediaId: data.id,
    };
  } catch (error) {
    console.error('Ошибка загрузки файла:', error);
    if (error instanceof TypeError || String(error).includes('Network request failed')) {
      throw new Error('Нет соединения с сервером. Проверьте интернет и повторите.');
    }
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
        console.log('Media файл не найден:', mediaUrl, '| filename: ', filename);
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
