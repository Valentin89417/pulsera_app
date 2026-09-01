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

## Phase 3: Premium Features ✅
- [x] PremiumGate — модальное окно-замок поверх всех элементов (opacity: 0.3 контент за ним)
- [x] Экран подписки (`subscription.tsx`) — сравнение тарифов (Путь/Пробуждение), выбор периода
- [x] Проверка доступа в `content/[id].tsx` — интеграция PremiumGate
- [x] Кнопка «Улучшить подписку» в профиле → экран подписки
- [x] Тестирование подписки — toggle-кнопки в админ-панели (Путь/Пробуждение/Выкл)
- [x] useSubscription: `activateSubscription(tier)` / `deactivateSubscription()` для тестов
- [ ] Интеграция платежей (ЮKassa + Stripe)
- [x] Офлайн-режим (кэширование контента)

## Phase 4: Social & Engagement
- [x] Закладки (кнопка ❤️, экран закладок, навигация из профиля)
- [x] Комментарии (добавление, реалтайм, модалка ввода)
- [x] Редактирование комментариев (автор自己的)
- [x] Удаление комментариев (автор + админ)
- [x] Ответы на комментарии (с цитатой)
- [x] Админ-панель комментариев (просмотр, ответ, удаление)
- [x] Офлайн-кэширование контента (скачивание текста, аудио, видео)
- [ ] Чат с автором
- [ ] Push-уведомления
- [ ] Профиль пользователя (расширенный)

## Phase 5: UI & Theming
- [x] Система тем (светлая/тёмная) — Zustand store + AsyncStorage persistence
- [x] Светлая тема на основе pulsera.ru (#fffee0 фон, #014960 тийл, #fcb900 золото)
- [x] Тёмная тема (текущая: #1a1a2e фон, #6c63ff акцент)
- [x] Переключатель тем в настройках профиля (Switch)
- [x] StatusBar обновляется при смене темы (light/dark content)
- [x] Все 25 файлов обновлены на useTheme() хук
- [x] Токен `onPrimary` — цвет текста/иконок на фоне primary (#ffffff dark, #fbf9d5 light)
- [x] Токен `copper` (#a5593b) — тёплый медно-коричневый акцент в светлой теме
- [x] Токен `cardBorder` — медный в светлой, серый (#333333) в тёмной теме
- [x] Токены `cardIconBg` / `cardIconColor` — иконки карточек: медный фон + кремовый в светлой, фон/primary в тёмной
- [x] Токен `inputBg` — поле ввода комментария: `#fffee0` в светлой, surface в тёмной
- [x] `textMuted` светлой темы: `#888888` → `#a5593b` (тёплый вместо холодного серого)
- [x] Медная граница карточек: каталог, закладки, профиль, главная (только светлая тема)
- [x] Каталог: иконки карточек — фон `copper`, цвет `#fbf9d5`
- [x] Убрана строка ID из профиля
- [x] Неактивные табы — `textSecondary` вместо `textMuted`
- [x] Светлая тема по умолчанию (themeStore: mode → light)
- [x] Настройки: переключатель "Тёмная тема" (инверсия логики)

## Phase 5: Polish & Analytics
- [ ] Анимации (Reanimated)
- [ ] Оптимизация производительности
- [ ] Аналитика
- [ ] Тестирование

---

## Запланированные задачи

### Markdown-редактор для статей ✅
**Статус:** Завершено

**Реализовано:**
- [x] Рендеринг Markdown для чтения статей (`react-native-markdown-display`) — `src/app/content/[id].tsx`
- [x] Markdown-редактор в админке с тулбаром (14 кнопок: жирный, курсив, списки, код, ссылки, изображения, таблицы) — `src/components/MarkdownEditor.tsx` + `MarkdownToolbar.tsx`
- [x] Переключение "Редактор / Просмотр" с предпросмотром
- [x] Формат хранения: `content_data.body` в Markdown
- [x] Кастомные стили для рендеринга — `src/utils/markdownStyles.ts`

**Изображения в статьях:**
- [x] Кнопка «Вставить изображение» в тулбаре (picker + upload в WordPress Media Library)
- [x] Автоматическая вставка `![описание](URL)` в Markdown с позиционированием курсора
- [x] Кастомный рендеринг изображений с определением пропорций — `src/components/MarkdownImage.tsx`
- [x] Подсказка по синтаксису под полем ввода

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
- [x] Экран подписки (`src/app/subscription.tsx`) — сравнение тарифов, выбор периода, кастомный хедер с кнопкой «Назад» (ведёт на главную)
- [ ] WebView оплаты (`src/app/payment.tsx`) — открытие сайта ЮKassa/Stripe
- [x] PremiumGate (`src/components/PremiumGate.tsx`) — модальное окно-замок поверх всех элементов
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
- **Темы**: useTheme() хук возвращает colors из Zustand store, persists в AsyncStorage
- **Палитра**: ThemeColors тип с ~30 токенами (background, surface, primary, text, border, alpha-варианты)
- **Иконки**: FontAwesome (`@expo/vector-icons`) — все UI-иконки заменены с эмодзи на FontAwesome
- **Видео**: нативные контролы на Android/iOS (expo-video), кастомные на веб (HTML5)
- **Клавиатура**: модалка ввода комментариев вместо полей ввода внизу экрана
- **Комментарии**: двухзапросной подход (comments + profiles раздельно из-за отсутствия FK в schema cache)
- **RLS**: SELECT публичный, INSERT/UPDATE/DELETE только для автора + админ
- **Реалтайм**: подписка на INSERT комментариев через Supabase channels
- **Хранение файлов**: WordPress Media Library (WP REST API `/wp-json/wp/v2/media`) с Basic Auth (Application Passwords). Файлы: `https://pulsera.ru/wp-content/uploads/YYYY/MM/...`

---

- [x] Markdown-редактор для статей (тулбар, превью, upload изображений)
- [x] Хранение файлов: WordPress Media Library вместо Supabase Storage (нет лимита 50 МБ)
- [x] Увеличение max_upload_size на хостинге (upload_max_filesize=256M, post_max_size=256M, max_execution_time=300, memory_limit=512M)
- [x] Автозаполнение категорий — выпадающий список с подсказками существующих категорий в админке

## Следующие шаги
1. **Платная подписка** — ЮKassa + Stripe, WebView оплата
2. **Чат** — общение с автором
3. **Push-уведомления** — оповещения о новом контенте
4. **Детальный экран статьи** — вывести обложку (image_url из content_data) над телом контента
