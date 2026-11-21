// Отложенная публикация: разбор и форматирование даты, проверка «ещё не вышло»
// Чистые функции без React — одинаково работают в админке, каталоге и на главной

import type { ContentItem } from '../types/content';

// Разбор строки «ДД.ММ.ГГГГ ЧЧ:ММ» в локальную дату.
// Возвращает null, если формат или значения неверные (в т.ч. 30.02).
export const parsePublishInput = (input: string): Date | null => {
  const match = input.trim().match(/^(\d{2})\.(\d{2})\.(\d{4})\s+(\d{1,2}):(\d{2})$/);
  if (!match) return null;

  const [, day, month, year, hours, minutes] = match;
  const d = parseInt(day, 10);
  const m = parseInt(month, 10);
  const y = parseInt(year, 10);
  const h = parseInt(hours, 10);
  const min = parseInt(minutes, 10);

  if (d < 1 || d > 31 || m < 1 || m > 12 || y < 2020 || y > 2100) return null;
  if (h > 23 || min > 59) return null;

  const date = new Date(y, m - 1, d, h, min, 0, 0);

  // Date молча переносит 31.02 на начало марта — сверяем, что день не «уехал»
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) {
    return null;
  }

  return date;
};

// Локальная дата → строка для поля ввода «ДД.ММ.ГГГГ ЧЧ:ММ»
export const formatPublishInput = (value: string | Date): string => {
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return '';

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${day}.${month}.${date.getFullYear()} ${hours}:${minutes}`;
};

// Короткая метка для карточки: «25.11 09:00»
export const formatPublishLabel = (value: string | Date): string => {
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return '';

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${day}.${month} ${hours}:${minutes}`;
};

// Материал ещё не опубликован (дата в будущем)
export const isScheduled = (content: Pick<ContentItem, 'published_at'>): boolean => {
  if (!content.published_at) return false;
  return new Date(content.published_at).getTime() > Date.now();
};

// Дата для показа читателю: публикации, а не создания
export const getPublishDate = (content: Pick<ContentItem, 'published_at' | 'created_at'>): string =>
  content.published_at || content.created_at;
