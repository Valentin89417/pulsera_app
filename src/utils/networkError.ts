// Утилита для распознавания сетевых ошибок (нет интернета, DNS, таймауты)

// Маркеры сетевых сбоев в тексте ошибки (fetch/OkHttp/Node)
const NETWORK_MARKERS = [
  'fetch failed',
  'Network request failed',
  'UnknownHostException',
  'Unable to resolve host',
  'timeout',
  'ETIMEDOUT',
  'ECONNREFUSED',
  'ECONNRESET',
  'ERR_NETWORK',
  'ERR_INTERNET_DISCONNECTED',
];

// Проверяет, является ли ошибка сетевой (нет соединения с сервером)
export const isNetworkError = (message: string): boolean => {
  const lower = message.toLowerCase();
  return NETWORK_MARKERS.some((marker) => lower.includes(marker.toLowerCase()));
};

// Текст для показа пользователю при отсутствии сети
export const NETWORK_MESSAGE = 'Нет интернета. Проверьте подключение к сети';

// Дружелюбный текст ошибки авторизации:
// сетевая ошибка → «Нет интернета…», иначе — исходный текст сервера
export const friendlyAuthError = (raw: string): string => {
  if (isNetworkError(raw)) {
    return NETWORK_MESSAGE;
  }
  return raw;
};
