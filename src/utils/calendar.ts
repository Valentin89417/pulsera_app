import ICAL from 'ical.js';

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  location?: string;
  startDate: Date;
  endDate: Date;
  isAllDay: boolean;
  color: string;
}

// Цвета для категорий событий
const CATEGORY_COLORS: Record<string, string> = {
  'Встреча': '#4caf50',
  'meeting': '#4caf50',
  'Пост': '#2196f3',
  'post': '#2196f3',
  'Публикация': '#2196f3',
  'Медитация': '#9c27b0',
  'meditation': '#9c27b0',
  'Практика': '#ff9800',
  'practice': '#ff9800',
  'Вебинар': '#e91e63',
  'webinar': '#e91e63',
  'Разбор': '#00bcd4',
  'consultation': '#00bcd4',
};

const DEFAULT_COLOR = '#78909c';

// Определить цвет по категориям из iCal
const getEventColor = (categories?: string[]): string => {
  if (!categories || categories.length === 0) return DEFAULT_COLOR;

  for (const cat of categories) {
    const normalized = cat.trim();
    if (CATEGORY_COLORS[normalized]) {
      return CATEGORY_COLORS[normalized];
    }
    // Поиск по частичному совпадению
    for (const [key, color] of Object.entries(CATEGORY_COLORS)) {
      if (normalized.toLowerCase().includes(key.toLowerCase())) {
        return color;
      }
    }
  }
  return DEFAULT_COLOR;
};

// Получить события на неделю из iCal URL
export const getWeekEvents = async (calendarUrl: string): Promise<CalendarEvent[]> => {
  if (!calendarUrl || !calendarUrl.trim()) return [];

  try {
    // Cache-busting: добавляем timestamp чтобы избежать HTTP-кэширования
    const separator = calendarUrl.includes('?') ? '&' : '?';
    const url = `${calendarUrl.trim()}${separator}_t=${Date.now()}`;

    const response = await fetch(url, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
      },
    });
    if (!response.ok) {
      console.error('Ошибка загрузки календаря:', response.status);
      return [];
    }

    const icsData = await response.text();
    const jcalData = ICAL.parse(icsData);
    const comp = new ICAL.Component(jcalData);
    const vevents = comp.getAllSubcomponents('vevent');

    // Границы недели: от сегодня до +7 дней
    const now = new Date();
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 7);

    const events: CalendarEvent[] = [];

    for (const vevent of vevents) {
      const event = new ICAL.Event(vevent);
      const startDate = event.startDate?.toJSDate();
      const endDate = event.endDate?.toJSDate();

      if (!startDate) continue;

      // Проверяем попадание в диапазон недели
      const eventStart = startDate;
      const eventEnd = endDate || startDate;

      // Событие попадает в неделю, если оно начинается до конца недели
      // и заканчивается после начала недели
      if (eventStart < endOfWeek && eventEnd > startOfWeek) {
        // Определяем категорию из CATEGORIES
        const categoriesProp = vevent.getFirstPropertyValue('categories');
        let categories: string[] = [];
        if (Array.isArray(categoriesProp)) {
          categories = categoriesProp;
        } else if (typeof categoriesProp === 'string') {
          categories = categoriesProp.split(',').map(c => c.trim());
        }

        events.push({
          id: event.uid || `${startDate.getTime()}-${Math.random()}`,
          title: event.summary || 'Без названия',
          description: event.description || undefined,
          location: event.location || undefined,
          startDate: startDate,
          endDate: endDate || startDate,
          isAllDay: event.duration?.toSeconds() === 0 || (
            startDate.getHours() === 0 &&
            startDate.getMinutes() === 0 &&
            (!endDate || (endDate.getHours() === 0 && endDate.getMinutes() === 0))
          ),
          color: getEventColor(categories),
        });
      }
    }

    // Сортируем по времени начала
    events.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

    return events;
  } catch (error) {
    console.error('Ошибка парсинга iCal:', error);
    return [];
  }
};

// Форматировать время для отображения
export const formatEventTime = (date: Date): string => {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

// Форматировать дату для заголовка дня
export const formatDayHeader = (date: Date): string => {
  const days = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
  return days[date.getDay()];
};

// Форматировать число дня
export const formatDayNumber = (date: Date): string => {
  return date.getDate().toString();
};

// Проверить, сегодня ли дата
export const isToday = (date: Date): boolean => {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
};

// Получить массив дней недели начиная с сегодня
export const getWeekDays = (): Date[] => {
  const days: Date[] = [];
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  for (let i = 0; i < 7; i++) {
    const day = new Date(start);
    day.setDate(day.getDate() + i);
    days.push(day);
  }

  return days;
};
