// Утилиты раздела «Тихий вопрос»: сроки жизни вопроса и окно правок ответа

// Вопрос живёт в общей ленте 7 дней
export const QUESTION_TTL_DAYS = 7;

// Правки ответов доступны 2 часа от создания вопроса (решение продукта)
export const EDIT_WINDOW_MS = 2 * 60 * 60 * 1000;

// Вопрос уже в архиве?
export const isQuestionArchived = (expiresAt: string): boolean => {
  return new Date(expiresAt).getTime() <= Date.now();
};

// Момент закрытия правок ответов
export const getEditDeadline = (questionCreatedAt: string): Date => {
  return new Date(new Date(questionCreatedAt).getTime() + EDIT_WINDOW_MS);
};

// Открыто ли ещё окно правок
export const isEditWindowOpen = (questionCreatedAt: string): boolean => {
  return Date.now() < getEditDeadline(questionCreatedAt).getTime();
};

// Склонение слова «день»
const pluralDays = (n: number): string => {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return 'день';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'дня';
  return 'дней';
};

// Сколько полных дней осталось (минимум 0)
export const daysLeft = (expiresAt: string): number => {
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return 0;
  return Math.ceil(diff / (24 * 60 * 60 * 1000));
};

// «осталось 5 дней» / «последний день» / «в архиве»
export const formatDaysLeft = (expiresAt: string): string => {
  if (isQuestionArchived(expiresAt)) return 'в архиве';
  const days = daysLeft(expiresAt);
  const hours = Math.ceil((new Date(expiresAt).getTime() - Date.now()) / (60 * 60 * 1000));
  if (hours <= 24) return 'последний день';
  return `осталось ${days} ${pluralDays(days)}`;
};

// «до 14:30» или «до 05.11, 14:30», если дедлайн не сегодня
export const formatEditDeadline = (questionCreatedAt: string): string => {
  const deadline = getEditDeadline(questionCreatedAt);
  const now = new Date();
  const time = deadline.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  const sameDay = deadline.toDateString() === now.toDateString();
  if (sameDay) return `до ${time}`;
  const date = deadline.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
  return `до ${date}, ${time}`;
};

// «1 ч 20 мин» — остаток окна правок
export const formatEditTimeLeft = (questionCreatedAt: string): string => {
  const left = getEditDeadline(questionCreatedAt).getTime() - Date.now();
  if (left <= 0) return '';
  const totalMinutes = Math.ceil(left / (60 * 1000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours <= 0) return `${minutes} мин`;
  if (minutes === 0) return `${hours} ч`;
  return `${hours} ч ${minutes} мин`;
};

// Время ответа: «14:30 04.11»
export const formatAnswerTime = (createdAt: string): string => {
  const date = new Date(createdAt);
  const time = date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  const day = date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
  return `${time} ${day}`;
};

// Дата публикации вопроса: «4 ноября»
export const formatQuestionDate = (createdAt: string): string => {
  return new Date(createdAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
};
