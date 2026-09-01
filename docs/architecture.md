# Архитектура приложения Pulsera App

Мобильное приложение блога духовного целителя Дины Кануниковой (pulsera.ru).
Контент: духовные практики, арт-терапия, медитации. Бесплатный + премиум-контент.

## Стек технологий

- **React Native + Expo SDK 54** (Expo Go для разработки)
- **Expo Router** (файловая маршрутизация)
- **TypeScript** (строгий режим)
- **Zustand** (управление состоянием)
- **Supabase** (аутентификация, база данных, realtime)
- **WordPress Media Library** (хранение файлов: изображения, аудио, видео через WP REST API)
- **ЮKassa + Stripe** (платежи через WebView)
- **expo-video** (видеоплеер на нативе)
- **expo-av** (аудиоплеер)
- **expo-file-system** (офлайн-кэширование)
- **react-native-keyboard-aware-scroll-view** (обработка клавиатуры)
- **react-native-markdown-display** (рендеринг Markdown)
- **FontAwesome** (@expo/vector-icons) — все UI-иконки

## Структура проекта

```
D:\pulsera_app\
├── AGENTS.md                          # Инструкции для AI
├── .env                               # Переменные окружения (Supabase + WordPress)
├── app.json                           # Конфигурация Expo
├── package.json                       # Зависимости
│
├── docs/
│   ├── architecture.md                # ← ЭТОТ ФАЙЛ
│   ├── progress.md                    # Прогресс разработки
│   └── ...
│
├── src/
│   ├── app/                           # Expo Router (файлы-роуты)
│   │   ├── _layout.tsx                # Корневой layout (авторизация, тема, статус-бар, downloads)
│   │   ├── settings.tsx               # Экран настроек (переключатель темы)
│   │   ├── downloads.tsx              # Экран скачанного контента
│   │   ├── subscription.tsx           # Экран подписки
│   │   ├── +not-found.tsx             # 404 экран
│   │   │
│   │   ├── (auth)/                    # Группа авторизации
│   │   │   ├── _layout.tsx
│   │   │   ├── login.tsx
│   │   │   ├── register.tsx
│   │   │   └── forgot-password.tsx
│   │   │
│   │   ├── (tabs)/                    # Основные табы
│   │   │   ├── _layout.tsx            # Нижняя навигация (FontAwesome иконки)
│   │   │   ├── index.tsx              # Главная (лента контента)
│   │   │   ├── catalog.tsx            # Каталог (фильтры по типу)
│   │   │   ├── community.tsx          # Сообщество (заглушка)
│   │   │   └── profile.tsx            # Профиль (данные, меню)
│   │   │
│   │   ├── admin/                     # Админ-панель
│   │   │   ├── articles.tsx           # Управление статьями
│   │   │   ├── article-edit.tsx       # Редактор статей (CRUD)
│   │   │   └── comments.tsx           # Управление комментариями
│   │   │
│   │   ├── content/
│   │   │   └── [id].tsx               # Детальный экран контента
│   │   │
│   │   └── admin.tsx                  # Главный экран админки
│   │
│   ├── components/                    # Переиспользуемые UI компоненты
│   │   ├── AudioPlayer.tsx            # Аудиоплеер (expo-av)
│   │   ├── VideoPlayer.tsx            # Видеоплеер (expo-video / HTML5)
│   │   ├── BookmarkButton.tsx         # Кнопка закладки (❤️)
│   │   ├── DownloadButton.tsx         # Кнопка скачивания (cloud-download)
│   │   ├── CommentItem.tsx            # Комментарий (ответ, редактирование, удаление)
│   │   ├── CommentInput.tsx           # Поле ввода комментария
│   │   ├── CommentsSection.tsx        # Секция комментариев (модалка, реалтайм)
│   │   ├── MarkdownEditor.tsx         # Markdown-редактор с тулбаром
│   │   ├── MarkdownToolbar.tsx        # Тулбар редактора (14 кнопок)
│   │   ├── MarkdownImage.tsx          # Кастомный рендеринг изображений в Markdown
│   │   ├── CategoryInput.tsx          # Автозаполнение категорий (топ-5 по популярности)
│   │   └── PremiumGate.tsx            # Закрытый контент (Modal) — не используется
│   │
│   ├── hooks/
│   │   ├── useAuth.ts                 # useAuth, useProtectedRoute, useSubscription, useAdmin
│   │   └── useTheme.ts                # Хук темы (mode, colors, toggleTheme)
│   │
│   ├── services/
│   │   ├── supabase.ts                # Клиент Supabase + типы Database
│   │   └── api.ts                     # Функции API (CRUD для всех таблиц)
│   │
│   ├── store/
│   │   ├── authStore.ts               # Состояние аутентификации + профиль
│   │   ├── themeStore.ts              # Состояние темы (Zustand + AsyncStorage)
│   │   └── downloadStore.ts           # Состояние скачанного (Set, downloads)
│   │
│   ├── types/
│   │   ├── content.ts                 # ContentItem, CommentWithAuthor, Bookmark
│   │   └── user.ts                    # UserSubscription, ExtendedUserProfile, SubscriptionTier
│   │
│   └── utils/
│       ├── themeColors.ts             # Палитры тем (ThemeColors, darkColors, lightColors)
│       ├── constants.ts               # Константы (SIZES, CONTENT_TYPES, API_ENDPOINTS)
│       ├── config.ts                  # Конфигурация (Supabase, WordPress credentials)
│       ├── upload.ts                  # Загрузка/удаление файлов в WordPress Media Library
│       ├── storage.ts                 # Платформенный адаптер (localStorage / AsyncStorage)
│       ├── offlineCache.ts            # Скачивание/чтение контента (expo-file-system)
│       └── markdownStyles.ts          # Стили Markdown + processCheckboxes()
│
└── supabase/
    └── migrations/
        ├── 001_initial_schema.sql     # Начальная схема (profiles, content, comments, etc.)
        ├── 002_add_roles.sql          # Роли (admin/user)
        ├── 003_setup_storage.sql      # Storage bucket
        ├── 004_enable_comments_realtime.sql  # Realtime для комментариев
        └── 005_add_comment_delete_policy.sql # RLS для удаления/редактирования
```

## Ключевые решения

### Система тем
- Двойная тема: светлая (#fffee0 фон, #014960 тийл, #a5593b медь) и тёмная (#1a1a2e фон, #6c63ff акцент)
- Zustand store + AsyncStorage persistence
- Хук `useTheme()` возвращает `{ mode, colors, toggleTheme }`
- Тип `ThemeColors` содержит ~35 токенов
- Медь (#a5593b) — только в светлой теме (границы карточек, иконки каталога, textMuted)
- Тёмная тема: серые границы (#333333), серые иконки

### Офлайн-кэширование
- Текст статей → .txt файлы
- Аудио → .mp3 файлы
- Видео → .mp4 файлы
- Хранение: `{documentDirectory}downloads/`
- Метаданные: AsyncStorage key `@pulsera_downloads`
- **Приоритет**: локальный файл → сетевой URL

### Видеоплеер (платформенный сплит)
- **Натив**: expo-video (`VideoView` + `useVideoPlayer`)
- **Веб**: HTML5 `<video>` через DOM ref
- Экспорт: `Platform.OS === 'web'` → WebVideoPlayer, иначе NativeVideoPlayer

### Подписка (кастомная система)
- Не RevenueCat, а своя через ЮKassa + Stripe
- WebView оплата → deep link `pulsera://payment/success`
- Тарифы: Free / Путь / Пробуждение
- Тестирование: toggle-кнопки в админ-панели

### Хранение файлов (WordPress Media Library)
- Файлы (изображения, аудио, видео) хранятся на WordPress хостинге pulsera.ru
- Загрузка через WP REST API `/wp-json/wp/v2/media` с Basic Auth (Application Passwords)
- Лимиты определяются хостингом (php.ini `upload_max_filesize=256M`), не Supabase
- URL формат: `https://pulsera.ru/wp-content/uploads/YYYY/MM/filename.ext`
- Конфигурация: `src/config.ts` (WP_URL, WP_USER, WP_APP_PASSWORD из .env)
- Загрузка/удаление: `src/utils/upload.ts`
- Supabase используется ТОЛЬКО для базы данных и аутентификации (не для хранения файлов)
- Удаление контента также удаляет связанные файлы из WordPress Media Library

### Автозаполнение категорий
- `CategoryInput` компонент — `src/components/CategoryInput.tsx`
- API: `getCategories()` возвращает `{ name: string; count: number }[]` (sorted by frequency)
- При пустом поле — топ-5 самых популярных категорий с количеством статей
- При вводе — фильтрация по вхождению, популярные наверху
- Максимум 5 подсказок в выпадающем списке

### Рендеринг Markdown
- Библиотека: `react-native-markdown-display`
- Стили: `src/utils/markdownStyles.ts`
- Кастомные правила: изображения через `MarkdownImage` (определение пропорций)
- Чекбоксы: `processCheckboxes()` заменяет `- [ ]` / `- [x]` на юникод ☐/☑

### useFocusEffect (обновление данных)
- Экраны (главная, каталог, админ-статьи) используют `useFocusEffect` вместо `useEffect`
- Данные обновляются каждый раз при фокусе на экране (возврат из редактора и т.д.)
- Избегает необходимости ручного обновления (pull-to-refresh)

### Роли и RLS
- `profiles.role`: `'user'` | `'admin'`
- SELECT — публичный
- UPDATE — только свой профиль
- INSERT — только свой профиль (auth.uid() = id)
- DELETE комментариев/закладок — автор + админ
- Контент — только INSERT/UPDATE/DELETE для admin

### Комментарии
- Комментарии ссылаются на `auth.users`, НЕ на `profiles`
- Двухзапросной подход: comments + profiles раздельно
- Реалтайм через Supabase channels (postgres_changes)
- Модалка ввода (KeyboardAvoidingView)

## Навигация

```
RootLayout
├── Onboarding (state-based)
├── Auth Flow (login, register, forgot-password)
└── Tabs
    ├── Home (лента контента)
    ├── Catalog (каталог + фильтры)
    ├── Community (заглушка)
    └── Profile
        ├── Настройки → /settings
        ├── Скачанное → /downloads
        ├── Закладки → /bookmarks
        ├── Улучшить подписку → /subscription
        └── Админ-панель → /admin
```