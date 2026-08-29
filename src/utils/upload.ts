import * as DocumentPicker from 'expo-document-picker';
import { readAsStringAsync, EncodingType } from 'expo-file-system/legacy';
import { supabase } from '../services/supabase';

// Типы загружаемых файлов
export type UploadFileType = 'audio' | 'video' | 'image';

// Результат загрузки
export interface UploadResult {
  url: string;
  filename: string;
  size: number;
}

// Максимальный размер файла (50 МБ)
const MAX_FILE_SIZE = 50 * 1024 * 1024;

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

    const file = result.assets[0];

    // Проверка размера
    if (file.size && file.size > MAX_FILE_SIZE) {
      throw new Error('Файл слишком большой. Максимум 50 МБ.');
    }

    return file;
  } catch (error) {
    console.error('Ошибка выбора файла:', error);
    throw error;
  }
};

// Загрузить файл в Supabase Storage
export const uploadFile = async (
  file: DocumentPicker.DocumentPickerAsset,
  type: UploadFileType,
  onProgress?: (progress: number) => void
): Promise<UploadResult> => {
  try {
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
    const storagePath = `${type}/${filename}`;

    onProgress?.(50);

    // Конвертируем base64 в Uint8Array для Supabase
    const binaryString = atob(fileContent);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    onProgress?.(70);

    // Загружаем в Supabase Storage
    const { data, error } = await supabase.storage
      .from('content')
      .upload(storagePath, bytes, {
        contentType: file.mimeType || 'application/octet-stream',
        upsert: false,
      });

    if (error) {
      console.error('Ошибка загрузки в Storage:', error.message);
      throw new Error('Не удалось загрузить файл: ' + error.message);
    }

    onProgress?.(90);

    // Получаем публичный URL
    const { data: urlData } = supabase.storage
      .from('content')
      .getPublicUrl(data.path);

    onProgress?.(100);

    return {
      url: urlData.publicUrl,
      filename,
      size: file.size || 0,
    };
  } catch (error) {
    console.error('Ошибка загрузки файла:', error);
    throw error;
  }
};

// Удалить файл из Supabase Storage
export const deleteFile = async (path: string): Promise<boolean> => {
  try {
    const { error } = await supabase.storage
      .from('content')
      .remove([path]);

    if (error) {
      console.error('Ошибка удаления файла:', error.message);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Неожиданная ошибка при удалении файла:', error);
    return false;
  }
};
