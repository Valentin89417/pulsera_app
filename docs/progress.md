# Прогресс разработки Pulsera App

## Phase 1: Foundation ✅
- [x] Структура папок (src/app, components, hooks, services, store, utils, types)
- [x] Инициализация проекта (Expo SDK 54 + Expo Router)
- [x] Supabase клиент + типы Database
- [x] Auth Store (Zustand) + хуки useAuth/useAdmin
- [x] Навигация: auth flow, табы (Home, Catalog, Community, Profile)
- [x] Экраны авторизации (login, register, forgot-password)
- [x] Онбординг (3 экрана, сохранение в AsyncStorage)
- [x] SQL миграции (001 schema, 002 roles, 003 storage, 004 realtime, 005 comment policies)

## Phase 2: Core Features ✅
- [x] Главная страница (лента контента из Supabase)
- [x] Каталог с фильтрами по типу
- [x] Детальный экран контента (`/content/[id]`)
- [x] Навигация из карточек (главная + каталог → контент)
- [x] Аудио-плеер (expo-av, play/pause, ±15s, прогресс-бар)
- [x] Видео-плеер (expo-video на нативе, HTML5 на веб, контроль качества)

## Phase 3: Premium Features
- [x] Блюр-компонент (`PremiumGate.tsx`) — размытие премиум-контента с замком
- [x] Экран подписки (`subscription.tsx`) — сравнение тарифов, выбор периода
- [x] Проверка доступа в `content/[id].tsx` — интеграция PremiumGate
- [x] Кнопка «Улучшить подписку» в профиле — переход на экран подписки
- [x] Тестирование подписки — админ-панель с кнопками включения/отключения
- [ ] Интеграция платежей (ЮKassa + Stripe)
- [ ] Офлайн-режим (кэширование контента)

## Phase 4: Social & Engagement
- [x] Закладки (кнопка ❤️, экран закладок, навигация из профиля)
- [x] Комментарии (добавление, реалтайм, модалка ввода)
- [x] Редактирование комментариев (автор自己的)
- [x] Удаление комментариев (автор + админ)
- [x] Ответы на комментарии (с цитатой)
- [x] Админ-панель комментариев (просмотр, ответ, удаление)
- [ ] Чат с автором
- [ ] Push-уведомления
- [ ] Профиль пользователя (расширенный)

## Phase 5: Polish & Analytics
- [ ] Анимации (Reanimated)
- [ ] Оптимизация производительности
- [ ] Аналитика
- [ ] Тестирование

---

## Запланированные задачи

### Markdown-редактор для статей
**Статус:** Запланировано
**Приоритет:** Средний

**Задачи:**
- Подключить рендеринг Markdown для чтения статей (`react-native-markdown-display`)
- Добавить Markdown-редактор в админку (веб) — `@uiw/react-md-editor` или `react-simplemde-editor`
- Формат хранения: `content_data.body` в Markdown
- На вебе рендеринг через `react-markdown`

**Изображения в статьях:**
- Папка `images/` в бакете `content` (Supabase Storage)
- Функция загрузки изображений в `api.ts`
- Кнопка «📷 Вставить изображение» в редакторе
- Автоматическая вставка `![описание](URL)` в Markdown
- Рендеринг изображений в `react-native-markdown-display` и `react-markdown`

**Зависимости:**
- `react-native-markdown-display` — рендеринг на нативе
- `@uiw/react-md-editor` — редактор в админке (веб)
- `react-markdown` — рендеринг на вебе

---

### Платная подписка (ЮKassa + Stripe)
**Статус:** Запланировано
**Приоритет:** Высокий
**Оплата:** Через WebView на сайте ЮKassa/Stripe
**Webhook:** Supabase Edge Functions

**Тарифы:**

| Тариф | Что входит |
|-------|-----------|
| **Free** | Бесплатный контент |
| **Путь** | Бесплатный + платный контент |
| **Пробуждение** | Путь + разборы + прямой чат с автором |

**Период:** Месячная или годовая подписка (цены TBD)

**Задачи:**

#### Фаза 1: Supabase
- [ ] Обновить таблицу `subscriptions` (добавить payment_provider, subscription_type, price_id, payment_id)
- [ ] Создать таблицу `payments` (id, user_id, subscription_id, amount, currency, payment_provider, payment_id, status)
- [ ] RLS-политики для subscriptions и payments

#### Фаза 2: Supabase Edge Functions
- [ ] Функция `create-payment` — создаёт платёж в ЮKassa/Stripe, возвращает URL
- [ ] Функция `webhook-yookassa` — обрабатывает уведомления от ЮKassa
- [ ] Функция `webhook-stripe` — обрабатывает уведомления от Stripe
- [ ] Обновление подписки в Supabase после оплаты

#### Фаза 3: Приложение (React Native)
- [x] Экран подписки (`src/app/subscription.tsx`) — сравнение тарифов, выбор периода
- [ ] WebView оплаты (`src/app/payment.tsx`) — открытие сайта ЮKassa/Stripe
- [x] Блюр-компонент (`src/components/PremiumGate.tsx`) — размытие премиум-контента
- [x] Проверка доступа в `src/app/content/[id].tsx`
- [ ] Deep links: `pulsera://payment/success` для возврата из WebView
- [x] Кнопка «Улучшить подписку» в профиле

#### Фаза 4: Тестирование
- [ ] Тестовые данные: ЮKassa sandbox (карта 4111...), Stripe test mode (карта 4242...)
- [ ] Проверка создания платежа
- [ ] Проверка webhook-ов
- [ ] Проверка обновления подписки
- [ ] Проверка доступа в приложении

**Зависимости:**
- `react-native-webview` — WebView для оплаты
- `expo-blur` — блюр-эффект
- `expo-linking` — deep links для возврата из WebView

**Deep links (app.json):**
```json
{
  "expo": {
    "scheme": "pulsera"
  }
}
```

---

## Технические заметки
- **Видео**: нативные контролы на Android/iOS (expo-video), кастомные на веб (HTML5)
- **Клавиатура**: модалка ввода комментариев вместо полей ввода внизу экрана
- **Комментарии**: двухзапросной подход (comments + profiles раздельно из-за отсутствия FK в schema cache)
- **RLS**: SELECT публичный, INSERT/UPDATE/DELETE только для автора + админ
- **Реалтайм**: подписка на INSERT комментариев через Supabase channels

---

## Следующие шаги
1. **Платная подписка** — ЮKassa + Stripe, WebView оплата, блюр премиум-контента
2. **Markdown-редактор** — рендеринг и редактирование статей в Markdown
3. **Офлайн** — кэширование прочитанного контента
4. **Чат** — общение с автором
