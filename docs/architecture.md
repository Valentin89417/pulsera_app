# Архитектура приложения Pulsera App

Мобильное приложение блога духовного целителя Дины Кануниковой (pulsera.ru).
Контент: духовные практики, арт-терапия, медитации. Бесплатный + премиум-контент.

## Стек технологий

- **React Native 0.88 + Expo SDK 58** (Expo Go для разработки, APK — EAS Build)
- **Expo Router** (файловая маршрутизация)
- **TypeScript** (строгий режим)
- **Zustand** (управление состоянием)
- **Supabase** (аутентификация, база данных, realtime)
- **WordPress Media Library** (хранение файлов: изображения, аудио, видео через WP REST API)
- **expo-video** (видеоплеер на нативе)
- **expo-audio** (аудиоплеер)
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
│   │   ├── settings.tsx               # Настройки (профиль: аватар/имя/телефон + уведомления)
│   │   ├── downloads.tsx              # Экран скачанного контента
│   │   ├── accountstatus.tsx          # Статус аккаунта (уровень доступа, дата окончания)
│   │   ├── chat.tsx                   # Чат с автором (Telegram-стиль)
│   │   ├── help.tsx                   # Экран помощи (инструкции)
│   │   ├── bookmarks.tsx              # Закладки
│   │   ├── diary.tsx                  # «Мой дневник» (ответы на «Слово стаи»)
│   │   ├── onboarding.tsx             # Онбординг (один раз, до входа в табы)
│   │   └── +not-found.tsx             # 404 экран
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
│   │   │   ├── slet.tsx               # «Слёт» — распределитель разделов
│   │   │   └── profile.tsx            # Профиль (данные, меню)
│   │   │
│   │   ├── slet/                      # Разделы «Слёта»
│   │   │   ├── chat.tsx               # «Пожужжим» — бывший чат сообщества
│   │   │   ├── power-exchange.tsx     # «Обмен силой» (заглушка)
│   │   │   └── quiet-question/        # «Тихий вопрос»
│   │   │       ├── index.tsx          # Лента активных вопросов
│   │   │       ├── new.tsx            # Создание: вопрос + колода
│   │   │       └── [id].tsx           # Карта, вопрос, ответы
│   │   │
│   │   ├── my-questions.tsx           # Архив «Тихих вопросов» автора
│   │   │
│   │   ├── admin/                     # Админ-панель
│   │   │   ├── articles.tsx           # Управление статьями
│   │   │   ├── article-edit.tsx       # Редактор статей (CRUD)
│   │   │   ├── comments.tsx           # Управление комментариями
│   │   │   ├── users.tsx              # Управление пользователями (доступ, роли)
│   │   │   ├── afisha.tsx             # Управление афишей (баннеры)
│   │   │   ├── daily-cards.tsx        # «Слово стаи»
│   │   │   ├── mak-decks.tsx          # Колоды МАК и загрузка карт
│   │   │   ├── quiet-archive.tsx      # Архив «Тихих вопросов»
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
│   │   ├── AudioPlayer.tsx            # Аудиоплеер (expo-audio)
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
│   │   ├── CommunityChatBubble.tsx    # Пузырь «Пожужжима» (с аватаром и датой)
│   │   ├── SectionPlaceholder.tsx     # Заглушка раздела «Слёта» («Раздел готовится»)
│   │   ├── QuietQuestionCard.tsx      # Карточка вопроса в ленте «Тихого вопроса»
│   │   ├── QuietAnswerItem.tsx        # Анонимный ответ (номер, время, правка)
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
│   │   ├── quiet.ts                   # Типы «Тихого вопроса» (колоды, карты, вопросы, ответы)
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
│       ├── calendar.ts                # Парсинг iCal, форматирование дат
│       ├── quietQuestion.ts           # Сроки «Тихого вопроса» (7 дней, окно правки 2 часа)
│       ├── gallery.ts                 # Фотокарусель: локальные/сетевые наборы
│       ├── networkError.ts            # Классификация сетевых ошибок для текстов
│       ├── helpers.ts                 # debounce и мелкие утилиты
│       └── markdownStyles.ts          # Стили Markdown + processCheckboxes()
│
└── supabase/
    └── migrations/
        ├── 001_initial_schema.sql     # Начальная схема (profiles, content, comments, etc.)
        ├── 002_add_roles.sql          # Роли (admin/user)
        ├── 003_create_storage_bucket.sql  # Storage bucket (сейчас не используется — файлы в WordPress)
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
        ├── 015_afisha_banners.sql     # Баннеры афиши
        ├── 016_app_settings.sql       # Настройки приложения (key-value, URL календаря)
        ├── 017_daily_cards.sql        # «Слово стаи»: карточки и ответы
        ├── 018_quiet_question.sql     # «Тихий вопрос»: таблицы, триггеры, RPC розыгрыша карты
        ├── 019_quiet_question_views.sql # Представления ленты и доступных колод
        ├── 020_quiet_question_rls.sql # RLS «Тихого вопроса»
        └── 021_app_settings_public_read.sql # Публичное чтение ключа calendar_url
```

## Ключевые решения

### Система тем
- Двойная тема: светлая (#fffee0 фон, #014960 тийл, #a5593b медь) и тёмная (#1a1a2e фон, #6c63ff акцент)
- Zustand store + AsyncStorage persistence
- Хук `useTheme()` возвращает `{ mode, colors, toggleTheme }`
- Тип `ThemeColors` содержит ~35 токенов
- Медь (#a5593b) — только в светлой теме (границы карточек, иконки каталога, textMuted)
- Тёмная тема: серые границы (#333333), серые иконки
- `inputBg`: светлая → `rgba(1, 73, 96, 0.13)` (primaryAlpha13), тёмная → `#1e2d4a`
- **Тёмная тема доступна только из админ-панели** — переключатель в `admin.tsx` (секция «Настройки»), не в общих настройках

### Офлайн-кэширование
- Текст → .txt файлы (для любого типа контента: статья, видео, аудио, курс)
- Аудио → .mp3 файлы
- Видео → .mp4 файлы
- Фотокарусель статьи → отдельные файлы `{id}_gallery_N.jpg` (+ порядок слайдов в метаданных)
- Хранение: `{documentDirectory}downloads/`
- Метаданные: AsyncStorage key `@pulsera_downloads`
- **Приоритет**: локальный файл → сетевой URL
- Кэш галереи используется только целиком и только для того набора (`public` / `premium`), который видит пользователь

### Модель контента
- Тип (`type`) определяет основной медиа-формат: статья, видео, аудио, курс
- `content_data.body` — Markdown-текст, доступен **для всех типов** (у видео и аудио выводится под плеером)
- `content_data.premium_body` — платный текст, доступен **для всех типов** при `is_premium = true`; подписчик видит только премиум-версию (медиа + текст)
- Премиум-медиа: `premium_audio_url`, `premium_video_url`
- `content_data.images` — фотокарусель статьи (только `type === 'article'`), массив `{ url, filename }`
- `content_data.premium_images` — платная фотокарусель; подписчик видит только её, при пустом наборе — фолбэк на `images` (как `premium_body` → `body`)
- Обложка карточки каталога (`image_url`) в карусель не входит

### Фотокарусель статьи
- Компонент `src/components/PhotoCarousel.tsx`, только для статей
- Кадр **4:3**: ширина — во всю карточку (экран − 40), высота одинаковая для всех слайдов — при пролистывании экран не прыгает
- `resizeMode="contain"`: фото не обрезаются, вертикальные центрируются, поля по бокам на цвете `surfaceLight`
- Горизонтальный `ScrollView` + `pagingEnabled`/`snapToInterval`; на вебе RNW превращает это в CSS scroll-snap
- Под кадром — точки: количество слайдов и активная позиция
- Источник фото: локальные файлы при скачанном контенте (если совпадает набор), иначе сетевые URL

### Видеоплеер (платформенный сплит)
- **Натив**: expo-video (`VideoView` + `useVideoPlayer`)
- **Веб**: HTML5 `<video>` через DOM ref
- Экспорт: `Platform.OS === 'web'` → WebVideoPlayer, иначе NativeVideoPlayer
- **Кадр по ориентации файла**: пропорция определяется по метаданным видео — `sourceLoad` → `availableVideoTracks[0].size` (натив), `loadedmetadata` → `videoWidth/videoHeight` (веб). До этого показывается чёрный скелетон 16:9 с индикатором загрузки — неправильная пропорция пользователю не показывается
- **Ограничения кадра**: ширина — во всю карточку (экран − 40), высота по пропорции, но не более 70% высоты экрана (для вертикальных видео)
- **Фолбэк**: если метаданные не пришли за 8 с или плеер вернул ошибку — кадр 16:9 с нативными контролами (без бесконечного спиннера)
- Смена источника (`uri`) сбрасывает определённый размер — состояние привязано к URI

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
- Нативный потоковый upload (`createUploadTask`, `expo-file-system/legacy`): файл читается с диска в OkHttp, JS-хип не нагружается (большие видео)
- **Проверка доступности сервера:** `checkWpServerReachable()` — preflight `GET /wp-json/` с таймаутом 10 с. Если сервер лежит, загрузка не начинается: пользователь сразу видит «Сервер pulsera.ru не отвечает», а не ждёт 60 с таймаута TCP-подключения OkHttp (на вебе проверка пропускается из-за CORS)
- Сетевые ошибки OkHttp (`failed to connect`, `SocketTimeout`, `Unable to resolve host`, `ENETUNREACH`) маппятся в понятный текст вместо сырого сообщения
- **Expo Go (Android):** файл из `expo-document-picker` лежит в системном кэше Expo Go вне песочницы опыта — нативный upload его не читает. Поэтому `copyToCacheDirectory: false` (получаем `content://`) + `copyAsync` в `{cacheDirectory}pulsera-uploads/`; временная копия удаляется после успешной загрузки
- Supabase используется ТОЛЬКО для базы данных и аутентификации (не для хранения файлов)
- Удаление контента также удаляет связанные файлы из WordPress Media Library

### Сборка APK (EAS Build)
- Профили в `eas.json`: `preview` (APK, internal) и `production` (app-bundle)
- Команда: `eas build -p android --profile preview` (флага `--non-interactive` достаточно, остальное берётся из конфига)
- Переменные окружения (Supabase, WordPress) подтягиваются из environment `preview` на EAS, локальный `.env` в сборку не попадает
- `android/` и `ios/` в `.gitignore` — проект managed, EAS генерирует нативные папки сам
- Версии нативных модулей должны совпадать с `node_modules/expo/bundledNativeModules.json`: в SDK 58 это `react-native-worklets 0.13.0` + `react-native-reanimated 4.7.1`. Пин `worklets@0.12.2` (peer RN 0.83–0.87) ронял `npm ci` на EAS за 3 секунды
- Расхождения не прятать через `expo.install.exclude` — проверять `npx expo install --check` и `npm ci --dry-run --include=dev` (EAS использует `npm ci --include=dev` на npm 10)
- Подпись: keystore `Build Credentials b5DZq2glvf`, новые APK ставятся поверх без удаления (versionCode не меняется)

### Чат с автором
- Telegram-стиль: сообщения пользователя справа, автора слева
- Формат ссылок на статьи: `[{title|uuid}]` (инлайновые, кликабельные)
- Автодополнение `@` — список 5 статей, фильтрация при вводе
- Редактирование: долгое нажатие → контекстное меню → баннер над полем ввода
- Удаление: долгое нажатие → контекстное меню → подтверждение
- Прочтение: двойная галочка — пользователь видит ✓✓ на сообщениях автора, админ на своих
- Realtime: подписка на все события (`INSERT`, `UPDATE`) для обновления статуса
- Выравнивание: `isOwn` (по авторству), не `sender` — админ видит свои сообщения справа
- Группировка: `isConsecutive` — компактные отступы для последовательных сообщений
- Доступ: только для подписки «Пробуждение»
- Поле ввода: `minHeight: 44`, `maxHeight: 120`, нет gap при открытой клавиатуре

### Пожужжим (чат «Слёта»)
- Доступ: все авторизованные пользователи
- Таблица: `community_messages` (id, user_id, message, edited, created_at) — историческое имя
- Дата: `HH:MM DD.MM.YYг.` + разделители между днями ("Сегодня", "Вчера", дата)
- Иконка таба «Слёт»: `fire`
- Переход: `/slet/chat`, хедер с возвратом в «Слёт»
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

### Markdown-редактор (админка)
- Компоненты: `MarkdownEditor.tsx` (логика и поле ввода) + `MarkdownToolbar.tsx` (14 кнопок, два ряда)
- Режимы «Редактор / Просмотр» — предпросмотр тем же рендерером, что и у читателя
- **Разметка применяется к выделению**, а не к каретке: выделил слово → «жирный» → обёрнуто; без выделения подставляется плейсхолдер, сразу выделенный
- Группы действий:
  - `inline` (жирный, курсив, подчёркнутый, зачёркнутый, код) — обёртка выделения маркерами, повторное нажатие маркеры снимает;
  - `line-prefix` (заголовок, список, нумерация, цитата) — префикс к каждой непустой строке выделения, нумерация считает `1. 2. 3.`, повторное нажатие снимает, смена типа блока заменяет префикс, а не копит;
  - `insert` (ссылка, блок кода, таблица, разделитель, картинка) — ссылка берёт выделение как подпись и ставит курсор на `https://`, блок кода оборачивает выделение в fence, таблица и `---` вставляются после выделения
- Чистая логика вынесена в `buildEdit(text, selection, action)` — без React, легко проверять сценарии
- Позиция каретки читается из `selectionRef` (state отстаёт на кадр), в `article-edit.tsx` у `ScrollView` стоит `keyboardShouldPersistTaps="handled"`, чтобы тап по кнопке не сбрасывал фокус и выделение на Android

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
- `overflow: hidden` — чтобы изображение не выходило за скруглённые края
- БД: таблица `afisha_banners` (image_url, image_filename, title, link_url, sort_order, is_active)
- RLS: SELECT публичный, INSERT/UPDATE/DELETE только админ
- Админка: CRUD + reorder (вверх/вниз)

### Календарь (расписание на неделю)
- Компонент: `WeekCalendar.tsx` — горизонтальный выбор дня + список событий
- Расположение: внизу главной страницы (после ленты контента)
- Горизонтальный скролл дней (7 дней от текущего)
- Сегодня выделен цветом `primary`
- Цвета событий определяются по CATEGORIES в iCal
- Парсинг: `ical.js` (RFC 5545, zero deps)
- Хранение URL: таблица `app_settings` (key-value, RLS admin-only)
- Админка: `admin/calendar-settings.tsx` — ввод URL + инструкция
- Если URL пустой — блок не отображается

### Слёт и «Пожужжим»
- Вкладка «Слёт» (`src/app/(tabs)/slet.tsx`) — экран-распределитель с тремя карточками:
  - «Тихий вопрос» → `/slet/quiet-question`;
  - «Обмен силой» → `/slet/power-exchange` (заглушка, бейдж «скоро»);
  - «Пожужжим» → `/slet/chat` (бывший чат сообщества).
- Иконка таба: `fire`.
- «Пожужжим» — Telegram-стиль: аватар, имя автора, группировка сообщений.
- Доступ: все авторизованные пользователи.
- Таблица: `community_messages` (id, user_id, message, edited, created_at) — историческое имя, не переименовывалась.
- Realtime подписка на новые сообщения.
- Контекстное меню: редактирование / удаление (для своих).
- Автодополнение @ — ссылки на статьи.
- Индикатор редактирования ("ред.").
- Дата: `HH:MM DD.MM.YYг.` + разделители между днями.
- Хедер чата: кнопка «назад» в «Слёт» и название «Пожужжим».
- Активный экран для push: ключ `slet-chat`.
- Заглушки: общий компонент `src/components/SectionPlaceholder.tsx`.

### Тихий вопрос
- Лента `/slet/quiet-question` → детальная `[id]`, создание `/slet/quiet-question/new`.
- Пользователь пишет вопрос и выбирает колоду по теме; **карту не видит и не выбирает**.
- Публикация — одна RPC `create_quiet_question(deck_id, question)`: сервер случайно тянет карту (`ORDER BY random()`), пишет вопрос со снимком `card_image_url`.
- Таблица `mak_cards` закрыта RLS даже на чтение — клиент не может получить список карт.
- Вопрос живёт 7 дней (`expires_at` через триггер), архив считается по дате, без cron.
- Один анонимный ответ на человека: `UNIQUE (question_id, user_id)`.
- Правка ответа — 2 часа от создания вопроса; удаление своего ответа не предусмотрено.
- Автор удаляет вопрос физически (каскад ответов) в первые 2 часа или из архива.
- Публичные выборки без `user_id`; свой ответ определяется отдельным запросом.
- Архив: `/my-questions` (профиль) и `/admin/quiet-archive`; колоды — `/admin/mak-decks`.
- Изображения карт загружаются в WordPress Media Library (`pickImageFiles` + `uploadFile`).

### Push-уведомления
- Механизм: Expo Push API (отправка с клиента)
- Батчинг: 30 сек для chat/«Пожужжим», immediate для articles
- Проверка online/offline: `last_community_active > 5 мин`
- In-chat detection: push пропускается если получатель на экране чата (ключ `slet-chat` для «Пожужжима»)
- 4 отдельных настройки: чат, «Пожужжим», статьи, комментарии
- Токены: таблица `push_tokens`, сохранение при login/signup, удаление при logout
- Динамический импорт expo-notifications (Expo Go совместимость)

### Настройки профиля
- Объединённый экран: профиль + настройки приложения
- Аватар: выбор из галереи (expo-image-picker), загрузка в WordPress Media Library
- Поля: имя, телефон (маска +7 (XXX) XXX-XX-XX), дата рождения (маска ДД.ММ.ГГГГ), email (read-only)
- Настройки: уведомления (4 Switch), версия
- Тёмная тема — переключатель только в админ-панели (`admin.tsx`, секция «Настройки»)
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
    ├── Слёт (распределитель)
    │   ├── Тихий вопрос → /slet/quiet-question (+ /new, /[id])
    │   ├── Обмен силой → /slet/power-exchange (заглушка)
    │   └── Пожужжим → /slet/chat (бывший чат сообщества)
    └── Profile
        ├── Настройки → /settings (профиль + настройки приложения)
        ├── Скачанное → /downloads
        ├── Закладки → /bookmarks
        ├── Мой дневник → /diary
        ├── Архив вопросов → /my-questions
        ├── Чат с автором → /chat (Пробуждение)
        ├── Статус аккаунта → /accountstatus
        ├── Помощь → /help
        └── Админ-панель → /admin
            ├── Управление статьями → /admin/articles
            ├── Комментарии → /admin/comments
            ├── Афиша → /admin/afisha
            ├── Календарь → /admin/calendar-settings
            ├── Слово стаи → /admin/daily-cards
            ├── Колоды МАК → /admin/mak-decks
            ├── Архив вопросов → /admin/quiet-archive
            ├── Чат с пользователями → /admin/chat
            └── Пользователи → /admin/users
```