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
│   │   ├── settings.tsx               # Настройки (профиль: аватар/имя/телефон + тема/уведомления)
│   │   ├── downloads.tsx              # Экран скачанного контента
│   │   ├── accountstatus.tsx          # Статус аккаунта (уровень доступа, дата окончания)
│   │   ├── chat.tsx                   # Чат с автором (Telegram-стиль)
│   │   ├── help.tsx                   # Экран помощи (инструкции)
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
│   │   │   ├── index.tsx              # Главная (лента контента + афиша + категории)
│   │   │   ├── catalog.tsx            # Каталог (фильтры по типу + категориям)
│   │   │   ├── community.tsx          # Чат сообщества (Telegram-стиль)
│   │   │   └── profile.tsx            # Профиль (данные, меню)
│   │   │
│   │   ├── admin/                     # Админ-панель
│   │   │   ├── articles.tsx           # Управление статьями
│   │   │   ├── article-edit.tsx       # Редактор статей (CRUD)
│   │   │   ├── comments.tsx           # Управление комментариями
│   │   │   ├── users.tsx              # Управление пользователями (доступ, роли)
│   │   │   ├── afisha.tsx             # Управление афишей (баннеры)
│   │   │   └── chat/                  # Чат с пользователями
│   │   │       ├── index.tsx          # Список чатов
│   │   │       └── [userId].tsx       # Диалог с пользователем
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
│   │   ├── ChatBubble.tsx             # Пузырь сообщения (isOwn, группировка, контекстное меню)
│   │   ├── CommunityChatBubble.tsx    # Пузырь чата сообщества (с аватаром и датой)
│   │   ├── ArticleMention.tsx         # Инлайновая ссылка на статью (Text + onPress)
│   │   ├── ArticleAutocomplete.tsx    # Выпадающий список статей при вводе @
│   │   ├── ChatLockedScreen.tsx       # Экран блокировки для не-подписчиков
│   │   ├── PremiumGate.tsx            # Закрытый контент (Modal)
│   │   └── AfishaSlider.tsx           # Слайдер баннеров афиши (16:9, snapToInterval)
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
│   │   ├── downloadStore.ts           # Состояние скачанного (Set, downloads)
│   │   └── chatStore.ts               # Состояние чата (activeChatScreen для push)
│   │
│   ├── types/
│   │   ├── content.ts                 # ContentItem, CommentWithAuthor, Bookmark, AfishaBanner
│   │   └── user.ts                    # UserSubscription, ExtendedUserProfile, SubscriptionTier, PushToken
│   │
│   └── utils/
│       ├── themeColors.ts             # Палитры тем (ThemeColors, darkColors, lightColors)
│       ├── constants.ts               # Константы (SIZES, CONTENT_TYPES, API_ENDPOINTS)
│       ├── config.ts                  # Конфигурация (Supabase, WordPress credentials)
│       ├── upload.ts                  # Загрузка/удаление файлов в WordPress Media Library
│       ├── storage.ts                 # Платформенный адаптер (localStorage / AsyncStorage)
│       ├── offlineCache.ts            # Скачивание/чтение контента (expo-file-system)
│       ├── notifications.ts           # Push-уведомления (register, send, batch)
│       └── markdownStyles.ts          # Стили Markdown + processCheckboxes()
│
└── supabase/
    └── migrations/
        ├── 001_initial_schema.sql     # Начальная схема (profiles, content, comments, etc.)
        ├── 002_add_roles.sql          # Роли (admin/user)
        ├── 003_setup_storage.sql      # Storage bucket
        ├── 004_enable_comments_realtime.sql  # Realtime для комментариев
        ├── 005_add_comment_delete_policy.sql # RLS для удаления/редактирования
        ├── 006_chat_upgrade.sql       # Чат: sender, admin RLS, Realtime
        ├── 007_admin_update_profiles.sql # Admin RLS для обновления профилей
        ├── 008_chat_edit_delete.sql   # Чат: edited колонка, RLS для редактирования/удаления
        ├── 009_add_phone_to_profiles.sql # Добавление колонки phone
        ├── 010_add_birthday_to_profiles.sql # Добавление колонки birthday
        ├── 011_community_messages.sql # Чат сообщества (community_messages)
        ├── 012_push_tokens.sql        # Таблица push-токенов
        ├── 013_notification_preferences.sql # Настройки уведомлений
        ├── 014_subscription_expires_at.sql # Дата окончания подписки
        └── 015_afisha_banners.sql     # Баннеры афиши
```

## Ключевые решения

### Система тем
- Двойная тема: светлая (#fffee0 фон, #014960 тийл, #a5593b медь) и тёмная (#1a1a2e фон, #6c63ff акцент)
- Zustand store + AsyncStorage persistence
- Хук `useTheme()` возвращает `{ mode, colors, toggleTheme }`
- Тип `ThemeColors` содержит ~35 токенов
- Медь (#a5593b) — только в светлой теме (границы карточек, иконки каталога, textMuted)
- Тёмная тема: серые границы (#333333), серые иконки
- `inputBg`: светлая → `rgba(1, 73, 96, 0.13)` (primaryAlpha13), тёмная → `#1e2d4a` (светлее原本)

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
- Нет in-app платежей — пользователь самозанятый, оплата на карту
- Apple-комплаент: нет слов «подписка», «купить», «цена», «промокод»
- Тарифы: Начало → Путь → Пробуждение (духовная лестница)
- Экран: «Статус аккаунта» (не «Подписка»)
- Активация: ручная через админ-панель + дата окончания (`subscription_expires_at`)
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

### Чат с автором
- Telegram-стиль: сообщения пользователя справа, автора слева
- Формат ссылок на статьи: `[{title|uuid}]` (инлайновые, кликабельные)
- Автодополнение `@` — список 5 статей, фильтрация при вводе
- Редактирование: долгое нажатие → контекстное меню → баннер над полем ввода
- Удаление: долгое нажатие → контекстное меню → подтверждение
- Прочтение双向 — пользователь видит ✓✓ на сообщениях автора, админ видит на своих
- Realtime: подписка на все события (`INSERT`, `UPDATE`) для обновления статуса
- Выравнивание: `isOwn` (по авторству), не `sender` — админ видит свои сообщения справа
- Группировка: `isConsecutive` — компактные отступы для последовательных сообщений
- Доступ: только для подписки «Пробуждение»
- Поле ввода: `minHeight: 44`, `maxHeight: 120`, нет gap при открытой клавиатуре

### Чат сообщества
- Доступ: все авторизованные пользователи
- Таблица: `community_messages` (id, user_id, message, edited, created_at)
- Дата: `HH:MM DD.MM.YYг.` + разделители между днями ("Сегодня", "Вчера", дата)
- Иконка таба: `users` (группа людей)
- Поле ввода: аналогичное чату с автором (minHeight: 44, maxHeight: 120)

### Экран помощи
- Доступ: меню «Помощь» в профиле → `/help`
- Инструкции: ссылки на статьи через `@`, редактирование/удаление сообщений

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

### Фильтр категорий в каталоге
- Второй горизонтальный слайдер pill-кнопок под фильтром типов
- Загрузка топ-25 категорий через `getCategories()` (sorted by frequency)
- Кнопка «Все категории» для сброса
- Читает URL param `category` — при переходе с главной автоматически выбирает категорию
- Фильтрация контента по выбранной категории + типу

### Популярные категории на главной
- Горизонтальный слайдер pill-кнопок над лентой контента
- Иконка `tag` + название + счётчик статей
- По клику → переход на `/catalog` с param `category`
- Стилизация: `primaryAlpha13` фон, pill-кнопки

### Афиша (слайдер баннеров)
- Компонент: `AfishaSlider.tsx` — горизонтальный FlatList
- Полная ширина экрана, aspectRatio 16:9
- SnapToInterval для точного переключения (без пагинации)
- Ручное управление свайпом (автопрокрутка отключена)
- Точки-индикаторы (активная заполнена, неактивные пустые)
- Заголовок поверх изображения (градиент снизу)
- Навигация при клике (внутренняя / внешняя ссылка)
-.overflow hidden для предотвращения bleed изображений
- БД: таблица `afisha_banners` (image_url, image_filename, title, link_url, sort_order, is_active)
- RLS: SELECT публичный, INSERT/UPDATE/DELETE только админ
- Админка: CRUD + reorder (вверх/вниз)

### Чат сообщества
- Telegram-стиль: аватар, имя автора, группировка сообщений
- Доступ: все авторизованные пользователи
- Таблица: `community_messages` (id, user_id, message, edited, created_at)
- Realtime подписка на новые сообщения
- Контекстное меню: редактирование / удаление (для своих)
- Автодополнение @ — ссылки на статьи
- Индикатор редактирования ("ред.")
- Иконка таба: `users` (группа людей)
- Дата: `HH:MM DD.MM.YYг.` + разделители между днями

### Push-уведомления
- Механизм: Expo Push API (отправка с клиента)
- Батчинг: 30 сек для chat/community, immediate для articles
- Проверка online/offline: `last_community_active > 5 мин`
- In-chat detection: push пропускается если получатель на экране чата
- 4 отдельных настройки: чат, сообщества, статьи, комментарии
- Токены: таблица `push_tokens`, сохранение при login/signup, удаление при logout
- Динамический импорт expo-notifications (Expo Go совместимость)

### Настройки профиля
- Объединённый экран: профиль + настройки приложения
- Аватар: выбор из галереи (expo-image-picker), загрузка в WordPress Media Library
- Поля: имя, телефон (маска +7 (XXX) XXX-XX-XX), дата рождения (маска ДД.ММ.ГГГГ), email (read-only)
- Настройки: тема (переключатель), уведомления (4 Switch), версия
- Телефон хранится как цифры, отображается с маской
- Дата рождения хранится как YYYY-MM-DD, отображается как ДД.ММ.ГГГГ

### Роли и RLS
- `profiles.role`: `'user'` | `'admin'`
- SELECT — публичный
- UPDATE — только свой профиль
- INSERT — только свой профиль (auth.uid() = id)
- DELETE комментариев/закладок — автор + админ
- Контент — только INSERT/UPDATE/DELETE для admin
- Chat: пользователь видит свои сообщения, админ видит все и может отвечать

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
    ├── Home (лента контента + афиша + категории)
    ├── Catalog (каталог + фильтры по типу/категориям)
    ├── Community (чат сообщества)
    └── Profile
        ├── Настройки → /settings (профиль + настройки приложения)
        ├── Скачанное → /downloads
        ├── Закладки → /bookmarks
        ├── Чат с автором → /chat (Пробуждение)
        ├── Статус аккаунта → /accountstatus
        ├── Помощь → /help
        └── Админ-панель → /admin
            ├── Управление статьями → /admin/articles
            ├── Комментарии → /admin/comments
            ├── Афиша → /admin/afisha
            ├── Чат с пользователями → /admin/chat
            └── Пользователи → /admin/users
```