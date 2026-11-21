# Прогресс разработки Pulsera App

## Expo SDK 54 → 57 Upgrade ✅
**Статус:** Завершено
**Дата:** 10.09.2026

### Миграция
- [x] **expo-av → expo-audio** — миграция AudioPlayer.tsx и DailyCard.tsx на новый API (`useAudioPlayer`, `useAudioPlayerStatus`, методы в секундах)
- [x] **useFocusEffect** — замена импорта `@react-navigation/native` → `expo-router/react-navigation` (8 файлов)
- [x] **StyleSheet.absoluteFillObject** → инлайн-стили (RN 0.86 удалил `absoluteFillObject`)
- [x] **NodeJS.Timeout** → `ReturnType<typeof setTimeout>` (TypeScript 6.0)
- [x] **@expo/vector-icons** — добавлен как явная зависимость
- [x] **react-native-worklets@0.12.2** — установлена для совместимости с reanimated 4.6
- [x] **babel.config.js** — создан с `babel-preset-expo`

### Версии после апгрейда
| Пакет | Было | Стало |
|---|---|---|
| expo | ~54.0.37 | ^57.0.0 |
| react | ^19.1.0 | 19.2.3 |
| react-native | 0.81.5 | 0.86.3 |
| typescript | ~5.9.2 | ~6.0.3 |
| expo-av | ~16.0.8 | удалён |
| expo-audio | — | ~57.0.4 |
| react-native-reanimated | — | 4.6.0 (через expo-router) |

### Проверка
- [x] `npx expo-doctor` — 21/21 checks passed
- [x] `npx tsc --noEmit` — 0 ошибок

---

## Expo SDK 57 → 58 Upgrade ✅
**Статус:** Завершено
**Дата:** 28.10.2026
**Причина:** Expo Go обновился до SDK 58 — проект перестал запускаться в Expo Go

### Миграция
- [x] **Пакеты** — `npm install expo@^58` + `npx expo install --fix` (25 пакетов). `expo upgrade` в локальном CLI не поддерживается
- [x] **Peer-конфликт** — `npm install --legacy-peer-deps` (expo-router ↔ опциональный `@expo/ui`)
- [x] **app.json: splash** — корневой блок `splash` удалён из схемы SDK 58, перенесён в плагин `["expo-splash-screen", { image, resizeMode, backgroundColor }]`
- [x] **RN 0.88: типы рефов** — `useRef<View>` → `useRef<ViewInstance>`, `useRef<TextInput>` → `useRef<TextInputInstance>` (index.tsx, DailyCard.tsx, MarkdownEditor.tsx)
- [x] **RN 0.88: событие selection** — `TextInputSelectionChangeEventData` → `TextInputSelectionChangeEvent`
- [x] **RN 0.88: цвет иконки таба** — `color` из `tabBarIcon` теперь `ColorValue`, приведение к `string`
- [x] **expo-notifications в Expo Go** — `expo-notifications` 58.x при импорте требует нативный модуль `ExpoTopicSubscriptionModule` (нет в Expo Go) → детекция через `isRunningInExpoGo()`, защита от частично загруженного модуля, `setupNotificationListeners().catch()` в `_layout.tsx`

### Версии после апгрейда
| Пакет | Было | Стало |
|---|---|---|
| expo | ^57.0.0 | ^58.0.20 |
| react | 19.2.3 | 19.3.0 |
| react-dom | 19.2.3 | 19.3.0 |
| react-native | 0.86.3 | 0.88.0 |
| expo-router | ~57.0.20 | ~58.0.27 |
| expo-notifications | ~57.0.17 | ~58.1.6 |
| @types/react | 19.2.18 | ~19.3.0 |

### Проверка
- [x] `npx expo-doctor` — 20/20 checks passed
- [x] `npx tsc --noEmit` — 0 ошибок
- [x] `npx expo export --platform android` — бандл собирается (1559 модулей)
- [x] Запуск в Expo Go SDK 58 — ошибок нет

### Проверить при сборке APK
- [ ] **Push-уведомления** — в Expo Go не работают по определению (`isRunningInExpoGo()` отключает модуль). После `eas build --platform android --profile preview` проверить: запрос разрешения, получение Expo Push Token, сохранение в `push_tokens`, приход push в foreground/background, навигация по тапу

---

## Фотокарусель статьи ✅
**Статус:** Завершено
**Дата:** 01.11.2026

- [x] **Хранилище** — `content_data.images` (обычная карусель) и `content_data.premium_images` (платная), массив `{ url, filename }`; обложка `image_url` в карусель не входит
- [x] **Компонент** — `src/components/PhotoCarousel.tsx`: слайд на всю ширину экрана (выходит за отступы статьи), высота по пропорции конкретного фото (`Image.getSize`, до загрузки — 4:3), `resizeMode="cover"` без обрезки и скруглений
- [x] **Навигация** — горизонтальный ScrollView с `pagingEnabled`/`snapToInterval`, точки под кадром показывают количество слайдов и текущую позицию; высота карусели плавно анимируется при переходе между фото разной ориентации
- [x] **Редактор (`article-edit.tsx`)** — для типа «Статья»: загрузка нескольких фото сразу (`pickImageFiles`, `multiple: true`), прогресс «2/5 · 45%», удаление, изменение порядка (‹ ›); блок «Платные фотографии статьи» при включённом «Платный контент»
- [x] **Экран статьи** — карусель под датой, перед текстом; подписчик видит `premium_images`, при их отсутствии — `images`; без доступа — только `images`
- [x] **Офлайн-кэш** — фото качаются в `{id}_gallery_N`, порядок слайдов и набор (`public`/`premium`) хранятся в метаданных; при удалении файлы чистятся; статья только с фото тоже скачивается
- [x] **Документация** — `docs/architecture.md`, `docs/database-schema.md`

---

## Загрузка файлов в Expo Go (Android) ✅
**Статус:** Завершено
**Дата:** 01.11.2026

- [x] **Проблема** — `uploadTaskStartAsync` падал с `java.io.IOException: Location 'file:///data/user/0/host.exp.exponent/cache/DocumentPicker/...' isn't readable`: `expo-document-picker` копирует файл в системный кэш Expo Go, а он вне песочницы опыта (в standalone APK тот же путь читается)
- [x] **Решение** — на Android выбор без копирования (`copyToCacheDirectory: false`) → исходный `content://` (ему `expo-file-system` разрешает чтение) → `copyAsync` в собственную папку `{cacheDirectory}pulsera-uploads/`, откуда нативный upload читает обычный `file://`
- [x] **Область** — `pickFile` (обложка, аудио, видео) и `pickImageFiles` (фотокарусель); на iOS поведение прежнее (кэш DocumentPicker уже в песочнице)
- [x] **Прочее** — расширение файла берётся по MIME с фолбэком на имя (бывает `mimeType = null`); временная копия удаляется после успешной загрузки
- [x] `npx tsc --noEmit` — чисто; `npx expo export --platform android` — успешно

---

## Адаптивный кадр видео ✅
**Статус:** Завершено
**Дата:** 01.11.2026

- [x] **Проблема** — кадр видео был жёстко 16:9, вертикальные видео показывались маленьким «столбиком» с полями
- [x] **Определение пропорции** — по метаданным файла: `sourceLoad` → `availableVideoTracks[0].size` (натив, `expo-video`), `loadedmetadata` → `videoWidth/videoHeight` (веб). Происходит до запуска воспроизведения
- [x] **Скелетон** — пока размер неизвестен, показывается чёрный кадр 16:9 с индикатором загрузки; неправильная пропорция не мелькает
- [x] **Плавный переход** — `LayoutAnimation.easeInEaseOut` при смене размера кадра (на вебе без анимации)
- [x] **Ограничения** — ширина кадра = ширина экрана − 40; высота по пропорции, максимум 70% высоты экрана (вертикальные)
- [x] **Фолбэк** — таймаут 8 с и событие `statusChange: error` → кадр 16:9 с нативными контролами
- [x] **Чистка** — удалён дублирующий StyleSheet, заголовок единообразно под кадром, размеры через `useWindowDimensions()`

---

## Текст для всех типов контента ✅
**Статус:** Завершено
**Дата:** 01.11.2026

- [x] **Редактор (`article-edit.tsx`)** — блок «Текст статьи (Markdown)» показывается для всех типов контента (статья, видео, аудио, курс), сохраняется в `content_data.body`
- [x] **Платный текст** — блок «Платный текст статьи» показывается при включённом «Платный контент» независимо от типа, сохраняется в `content_data.premium_body`
- [x] **Экран просмотра (`content/[id].tsx`)** — текст выводится под плеером для видео/аудио; подписчик видит премиум-медиа + `premium_body` (если его нет — общий `body`), остальные — бесплатное медиа + `body`
- [x] **Офлайн-кэш (`offlineCache.ts`)** — текст скачивается для любого типа контента (видео/аудио с текстом читаются офлайн), при удалении чистится и .txt
- [x] **Тип «Статья»** — остался без изменений, статьи по-прежнему текстовый контент

---

## UX-правки: карточка «Слово стаи» ✅
**Статус:** Завершено
**Дата:** 01.11.2026

- [x] **Подсказка о времени** — если вопросы для подведения итогов ещё не открылись (до 17:00), под блоком ответа на фото мелким шрифтом (`12px`, `colors.textMuted`) показывается «Вопросы для подведения итогов появятся после 17:00»

---

## Слёт: хаб и «Пожужжим» ✅
**Статус:** Завершено
**Дата:** 04.11.2026

- [x] **Вкладка** — «Сообщество» → «Слёт», иконка `fire`
- [x] **Хаб** — `src/app/(tabs)/slet.tsx`: три карточки («Тихий вопрос», «Обмен силой», «Пожужжим»), у новых разделов бейдж «скоро»
- [x] **Чат** — перенесён в `src/app/slet/chat.tsx`, добавлен хедер с возвратом в «Слёт», заголовок «Пожужжим»
- [x] **Заглушки** — `src/app/slet/quiet-question.tsx` (позже заменён рабочей лентой в `src/app/slet/quiet-question/`), `src/app/slet/power-exchange.tsx`, общий компонент `src/components/SectionPlaceholder.tsx`
- [x] **Уведомления** — ключ активного экрана `slet-chat`, push-заголовок «Пожужжим», подпись в настройках
- [x] **Тексты** — «Сообщество» заменено на «Слёт»/«Пожужжим» в навигации, настройках и статусе аккаунта
- [x] **Проверки** — `npx tsc --noEmit`; экспорт Android/Web

---

## Phase 1: Foundation ✅
- [x] Структура папок (src/app, components, hooks, services, store, utils, types)
- [x] Инициализация проекта (Expo SDK 57 + Expo Router)
- [x] Supabase клиент + типы Database
- [x] Auth Store (Zustand) + хуки useAuth/useAdmin
- [x] Навигация: auth flow, табы (Home, Catalog, Слёт, Profile)
- [x] Экраны авторизации (login, register, forgot-password)
- [x] Онбординг (3 экрана, сохранение в AsyncStorage)
- [x] SQL миграции (001 schema, 002 roles, 003 storage, 004 realtime, 005 comment policies)

## Phase 2: Core Features ✅
- [x] Главная страница (лента контента из Supabase)
- [x] Каталог с фильтрами по типу
- [x] Детальный экран контента (`/content/[id]`)
- [x] Навигация из карточек (главная + каталог → контент)
- [x] Аудио-плеер (expo-audio, play/pause, ±15s, прогресс-бар)
- [x] Видео-плеер (expo-video на нативе, HTML5 на веб, контроль качества)

## Phase 3: Premium Features ✅
- [x] PremiumGate — модальное окно-замок поверх всех элементов (opacity: 0.3 контент за ним)
- [x] Экран «Статус аккаунта» (`accountstatus.tsx`) — нейтральная информация о доступе
- [x] Проверка доступа в `content/[id].tsx` — интеграция PremiumGate
- [x] Тестирование подписки — toggle-кнопки в админ-панели (Путь/Пробуждение/Выкл)
- [x] useSubscription: `activateSubscription(tier)` / `deactivateSubscription()` для тестов
- [ ] Интеграция платежей (ЮKassa + Stripe) — ОТМЕНЕНО (самозанятый, оплата на карту)
- [x] Офлайн-режим (кэширование контента)

## Phase 4: Social & Engagement
- [x] Закладки (кнопка ❤️, экран закладок, навигация из профиля)
- [x] Комментарии (добавление, реалтайм, модалка ввода)
- [x] Редактирование комментариев (автор自己的)
- [x] Удаление комментариев (автор + админ)
- [x] Ответы на комментарии (с цитатой)
- [x] Админ-панель комментариев (просмотр, ответ, удаление)
- [x] Офлайн-кэширование контента (скачивание текста, аудио, видео)
- [x] Чат с автором (Telegram-стиль, Realtime, ссылки на статьи)
- [x] «Пожужжим» — общий чат для всех пользователей (бывший чат сообщества, раздел «Слёта»)
- [x] Push-уведомления (Expo Push API, батчинг, настройки)
- [x] Настройки профиля (аватар, имя, телефон, дата рождения)
- [ ] Профиль пользователя (расширенный)

## Phase 5: UI & Theming
- [x] Система тем (светлая/тёмная) — Zustand store + AsyncStorage persistence
- [x] Светлая тема на основе pulsera.ru (#fffee0 фон, #014960 тийл, #fcb900 золото)
- [x] Тёмная тема (текущая: #1a1a2e фон, #6c63ff акцент)
- [x] Переключатель тёмной темы перенесён в админ-панель (admin-only)
- [x] StatusBar обновляется при смене темы (light/dark content)
- [x] Все 25 файлов обновлены на useTheme() хук
- [x] Токен `onPrimary` — цвет текста/иконок на фоне primary (#ffffff dark, #fbf9d5 light)
- [x] Токен `copper` (#a5593b) — тёплый медно-коричневый акцент в светлой теме
- [x] Токен `cardBorder` — медный в светлой, серый (#333333) в тёмной теме
- [x] Токены `cardIconBg` / `cardIconColor` — иконки карточек: медный фон + кремовый в светлой, фон/primary в тёмной
- [x] Токен `inputBg` — поле ввода: `rgba(1, 73, 96, 0.13)` (primaryAlpha13) в светлой, `#1e2d4a` в тёмной
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

### ~~Платная подписка (ЮKassa + Stripe)~~ — ОТМЕНЕНО
**Статус:** ОТМЕНЕНО
**Причина:** Пользователь — самозанятый (без ИП). Оплата напрямую на карту. Активация подписки вручную через админ-панель. Нет in-app платежей.

**Вместо этого:**
- Админ-панель: ручная смена тарифа + дата окончания
- Apple-комплаент: нет слов «подписка», «купить», «цена», «промокод»
- Экран «Статус аккаунта» — нейтральная информация

---

### Календарь на главной ✅
**Статус:** Завершено

**Описание:**
- Блок «Расписание на неделю» на главной странице (после ленты контента)
- Горизонтальный выбор дня (7 дней от текущего)
- События загружаются из публичного Google Calendar по iCal URL
- Цвета событий определяются по CATEGORIES в iCal
- Пустые дни показывают «Нет событий»
- URL календаря настраивается в админ-панели

**Реализация:**
- Библиотека: `ical.js` (RFC 5545, zero deps, совместим с React Native)
- Хранение URL: таблица `app_settings` (key-value, RLS только для админа)
- Админ-экран: `admin/calendar-settings.tsx` — ввод URL + инструкция

**Цвета категорий:**
| Категория | Цвет |
|-----------|------|
| Встреча / meeting | 🟢 Зелёный (#4caf50) |
| Пост / post / Публикация | 🔵 Синий (#2196f3) |
| Медитация / meditation | 🟣 Фиолетовый (#9c27b0) |
| Практика / practice | 🟠 Оранжевый (#ff9800) |
| Вебинар / webinar | 🔴 Розовый (#e91e63) |
| Разбор / consultation | 🔵 Бирюзовый (#00bcd4) |
| Другое | ⚪ Серый (#78909c) |

**Файлы:**
- `supabase/migrations/016_app_settings.sql` — миграция
- `src/utils/calendar.ts` — парсинг iCal, форматирование
- `src/components/WeekCalendar.tsx` — компонент
- `src/app/admin/calendar-settings.tsx` — настройки
- `src/app/admin.tsx` — пункт меню
- `src/app/(tabs)/index.tsx` — интеграция
- `src/services/api.ts` — getSetting/setSetting
- `src/services/supabase.ts` — тип app_settings

---

### Тихий вопрос ✅
**Статус:** Завершено
**Дата:** 04.11.2026

**Суть:** пользователь анонимно задаёт вопрос сообществу. Карта не выбирается: он пишет вопрос, выбирает колоду по теме и публикует — сервер в этот момент случайно привязывает карту. Вопрос живёт в общей ленте 7 дней, затем уходит в архив: автору — в профиль, администратору — в админ-панель.

**Модель данных:**
- `mak_decks` — колоды: `id`, `title`, `description`, `cover_url`, `is_active`, `created_at`
- `mak_cards` — карты: `id`, `deck_id`, `image_url`, `title`, `sort_order`, `created_at`
- `quiet_questions` — вопросы: `id`, `user_id`, `deck_id`, `card_id`, `card_image_url` (снимок), `question`, `created_at`, `expires_at`, `is_hidden`
- `quiet_answers` — ответы: `id`, `question_id`, `user_id`, `body`, `created_at`, `updated_at`, `is_hidden`; `UNIQUE (question_id, user_id)`
- `expires_at = created_at + interval '7 days'` (триггер); архив вычисляется по `expires_at`, без cron
- Представления: `quiet_questions_feed` (активные + `answers_count`, без `user_id`), `mak_decks_available` (активные колоды с картами)
- RPC `create_quiet_question(p_deck_id, p_question)` — `SECURITY DEFINER`: проверка текста и колоды, случайная карта, вставка вопроса со снимком картинки

**Решения:**
- Карту пользователь не видит до публикации и не может выбрать: `mak_cards` закрыта RLS даже на чтение, розыгрыш идёт в RPC
- Перевытянуть карту нельзя; колода фиксируется в момент публикации
- 7 дней в ленте, затем архив (без cron)
- Один ответ на человека; автор вопроса тоже может ответить
- Правка ответа — 2 часа от создания вопроса (единое окно)
- Удаление вопроса автором — физическое, с каскадом ответов: в первые 2 часа или из архива
- Удаление ответа пользователем не предусмотрено — только админ
- Пуш о новых ответах не делали (вне MVP)

**API:**
- `getAvailableMakDecks()`, `createQuietQuestion(deckId, question)`
- `getQuietQuestions()`, `getQuietQuestion(id, userId)`
- `getQuietAnswers(questionId, userId)`, `createQuietAnswer(...)`, `updateQuietAnswer(...)`
- `deleteQuietQuestion(id)`, `getMyArchivedQuestions(userId)`
- админ: `getAdminQuietArchive()`, `setQuietQuestionHidden()`, `getAllMakDecks()`, `createMakDeck()`, `updateMakDeck()`, `deleteMakDeck()`, `getAllMakCards()`, `addMakCards()`, `deleteMakCard()`

**Экраны:**
- `/slet/quiet-question` — лента: фото карты, вопрос, число ответов, остаток дней, pull-to-refresh
- `/slet/quiet-question/new` — текст вопроса + выбор колоды, без превью карты
- `/slet/quiet-question/[id]` — карта, вопрос, ответы, композер, правка в окне 2 часов, удаление
- Профиль → «Архив вопросов» (`/my-questions`) — завершённые вопросы автора с удалением

**Админка:**
- «Колоды МАК» (`/admin/mak-decks`) — колоды, мультизагрузка карт, вкл/выкл, удаление
- «Архив вопросов» (`/admin/quiet-archive`) — все завершённые вопросы, авторы, ответы, скрытие

**Файлы:**
- `supabase/migrations/018_quiet_question.sql`, `019_quiet_question_views.sql`, `020_quiet_question_rls.sql`
- `src/types/quiet.ts`, `src/utils/quietQuestion.ts`
- `src/components/QuietQuestionCard.tsx`, `src/components/QuietAnswerItem.tsx`
- `src/app/slet/quiet-question/index.tsx`, `new.tsx`, `[id].tsx`
- `src/app/my-questions.tsx`, `src/app/admin/quiet-archive.tsx`, `src/app/admin/mak-decks.tsx`

**Проверки:** `npx tsc --noEmit`; `npx expo export --platform web` и `--platform android`

---

### Markdown-редактор: разметка по выделению ✅
**Статус:** Завершено
**Дата:** 16.11.2026

**Проблема:** кнопки тулбара игнорировали выделение и всегда вставляли `before + placeholder + after` в позицию каретки. Нельзя было выделить текст и нажать «жирный».

**Реализовано:**
- [x] **Обёртка выделения** — жирный, курсив, подчёркнутый, зачёркнутый, код оборачивают выделенный текст, без плейсхолдера
- [x] **Тоггл** — повторное нажатие снимает маркеры: и когда они снаружи выделения (`**|текст|**`), и когда выделены вместе с текстом
- [x] **Строковые блоки** — заголовок, список, нумерация, цитата ставят префикс к каждой непустой строке выделения; нумерация считает `1.`, `2.`, `3.`; повторное нажатие снимает
- [x] **Смена типа блока** — префиксы заменяются, а не копятся: `- abc` + «заголовок» → `## abc`
- [x] **Ссылка** — выделенный текст становится подписью, курсор встаёт на `https://` (сразу можно вставить адрес)
- [x] **Блок кода** — оборачивает выделение в fence; таблица и разделитель вставляются после выделения, не затирая его
- [x] **Сохранение выделения** — после применения остаётся выделенным внутренний текст, можно нажать вторую кнопку (жирный + курсив)
- [x] **Без выделения** — прежнее поведение: плейсхолдер вставляется выделенным, печатаешь поверх
- [x] **Потеря выделения** — позиция читается из `selectionRef` (state отстаёт на кадр), `keyboardShouldPersistTaps="handled"` в `article-edit.tsx` не даёт клавиатуре схлопываться и сбрасывать фокус на Android

**Файлы:**
- `src/components/MarkdownEditor.tsx` — `buildEdit()` и группы `inline` / `line-prefix` / `insert`
- `src/app/admin/article-edit.tsx` — `keyboardShouldPersistTaps="handled"`

**Проверки:** `npx tsc --noEmit`; 29 сценариев разметки (обёртка, тоггл, многострочные списки, ссылки, блок кода, цепочка стилей) прогнаны через транспиляцию модуля; `npx expo export --platform web`

---

### Загрузка файлов: понятные сетевые ошибки ✅
**Статус:** Завершено
**Дата:** 16.11.2026

**Проблема:** пока `pulsera.ru` лежал, загрузка видео падала через 60 секунд с сырым текстом `failed to connect to pulsera.ru/87.236.16.28 (port 443) ... after 60000ms` — это таймаут TCP-подключения OkHttp, а не размер файла.

**Реализовано:**
- [x] **Preflight** — `checkWpServerReachable()`: `GET /wp-json/` с таймаутом 10 с перед загрузкой; сервер не ответил → загрузка не начинается
- [x] **Тексты** — «Сервер pulsera.ru не отвечает. Проверьте интернет и повторите загрузку позже» и «Не удалось подключиться к pulsera.ru…»
- [x] **Единый детектор** — `isNetworkError` из `src/utils/networkError.ts`, маркеры OkHttp добавлены (`failed to connect`, `SocketTimeout`, `ENETUNREACH`); дубль из `upload.ts` убран
- [x] **Веб** — preflight пропускается (CORS давал бы ложный отказ)

**Файлы:** `src/utils/upload.ts`, `src/utils/networkError.ts`

**Проверки:** `npx tsc --noEmit`; загрузка видео на устройстве после подъёма сервера — успешно

---

### Сборка APK: worklets 0.13.0 ✅
**Статус:** Завершено
**Дата:** 12.11.2026

**Проблема:** сборка на EAS падала за ~3 секунды в фазе `INSTALL_DEPENDENCIES` (`npm ci` → `ERESOLVE`).

**Причина:** `react-native-worklets@0.12.2` имеет peer `react-native 0.83–0.87`, а в проекте RN 0.88.0; `react-native-reanimated@4.7.1` требует worklets 0.13.x. Расхождение скрывалось исключением в `expo.install.exclude`.

- [x] `react-native-worklets` → `0.13.0`, `expo.install.exclude` удалён
- [x] `package-lock.json` пересобран (`npm install`)
- [x] Проверка того же шага, что делает EAS: `npm ci --dry-run --include=dev` — без ошибок; `npx expo install --check` — worklets больше не в списке
- [x] Сборка `c9c21500-f632-4fd1-a8a7-50adc17a4c37` — FINISHED, APK 98 МБ, keystore `b5DZq2glvf`, versionCode 1

**Файлы:** `package.json`, `package-lock.json`

---

### Фикс: календарь не показывался не-админам ✅
**Статус:** Завершено
**Дата:** 16.11.2026

**Проблема:** `app_settings` была закрыта единственной политикой «Admin can manage app_settings» (`FOR ALL`). `WeekCalendar` на главной читает `calendar_url` клиентом обычного пользователя, `getSetting()` возвращал `null`, блок «Расписание на неделю» не отображался никому, кроме админа. Подтверждено запросом к REST: anon-выборка из `app_settings` — `[]`, а из `afisha_banners` / `content` / `daily_cards` — данные.

- [x] Миграция `021_app_settings_public_read.sql` — политика `SELECT` только для `key = 'calendar_url'` (`anon`, `authenticated`), остальные ключи остаются админскими
- [x] Документация: `database-schema.md` (миграции, RLS `app_settings`), `architecture.md` (список миграций)

---

### Отложенная публикация статей ✅
**Статус:** Завершено (миграция 022 применена)
**Дата:** 20.11.2026

**Задача:** в «Управлении статьями» задавать дату публикации. Пока дата не наступила — материал виден в каталоге только админу, после — всем.

**Реализовано:**
- [x] **БД** — `content.published_at TIMESTAMPTZ NOT NULL DEFAULT now()`; у старых записей `published_at = created_at`; индекс `content_published_at_idx`
- [x] **RLS** — политика «Контент доступен после публикации»: `published_at <= now() OR админ`. Прямой запрос к PostgREST под обычным пользователем запланированное не возвращает
- [x] **Форма статьи** — поле `ДД.ММ.ГГГГ ЧЧ:ММ` после категории, кнопки «Сейчас» и «Завтра 09:00», валидация (в т.ч. 31.02), хранение в UTC
- [x] **Список статей** — метка «Запланировано · 25.11 09:00» и кнопка «Опубликовать и отправить push» (ставит дату на «сейчас» и рассылает push)
- [x] **Push** — при создании уходит только для уже опубликованных материалов; запланированные молчат
- [x] **Каталог, главная, страница материала** — дата берётся из `published_at`; у админа плашка «Запланировано»
- [x] **Утилиты** — `src/utils/contentPublish.ts`, рассылка вынесена в `notifyNewContent`

**Файлы:** `supabase/migrations/022_content_published_at.sql`, `src/utils/contentPublish.ts`, `src/services/api.ts`, `src/services/supabase.ts`, `src/services/notifications.ts`, `src/app/admin/article-edit.tsx`, `src/app/admin/articles.tsx`, `src/app/(tabs)/catalog.tsx`, `src/app/(tabs)/index.tsx`, `src/app/content/[id].tsx`

**Проверки:** `npx tsc --noEmit` — чисто; сценарий в Expo Go после применения миграции

---

### Медиа и UI статьи ✅
**Статус:** Завершено
**Дата:** 21.11.2026

- [x] **Фотокарусель** — на всю ширину экрана, высота по пропорции фото, плавная анимация высоты при свайпе (`PhotoCarousel.tsx`)
- [x] **Видео** — кадр на всю ширину экрана без скруглений, высота по пропорции, для вертикальных — не выше 70% высоты экрана (`VideoPlayer.tsx`)
- [x] **Шапка статьи** — убран двойной отступ статусбара (60 → 4, `SafeAreaView` уже даёт инсет), статья начинается сразу под шапкой
- [x] **Удаление статьи** — в «Управлении статьями» на время удаления (файлы из WordPress Media Library) кнопки «Редактировать»/«Удалить» заменяются спиннером, остальные карточки заблокированы; ошибка удаления показывается алертом

**Файлы:** `src/components/PhotoCarousel.tsx`, `src/components/VideoPlayer.tsx`, `src/app/content/[id].tsx`, `src/app/admin/articles.tsx`

---

### Обмен силой (план)
**Статус:** Запланировано · раздел скрыт из «Слёта» (20.11.2026) — карточки в `src/app/(tabs)/slet.tsx` нет, экран-заглушка `/slet/power-exchange` остался

**Суть:** лента коротких поддерживающих сообщений. Пользователи делятся теплом, благодарят, поддерживают друг друга и возвращают себе силу.

**Предварительная модель:**
- `power_posts` — `id`, `user_id`, `message`, `created_at`, `is_hidden`
- `power_reactions` — `post_id`, `user_id`, `created_at`; `UNIQUE (post_id, user_id)`

**RLS:** публичное чтение, свои записи/реакции, модерация админом.

**Экраны:** `/slet/power-exchange` — лента, форма публикации, реакции, удаление своего; админ-модерация.

**Открытые детали:** формат (только текст или текст + фото), набор реакций, необходимость push.

---

## Технические заметки
- **Миграции**: 001–021 применены; 022 (`content.published_at`) нужно применить в Supabase Dashboard SQL Editor ✅
- **Темы**: useTheme() хук возвращает colors из Zustand store, persists в AsyncStorage
- **Палитра**: ThemeColors тип с ~30 токенами (background, surface, primary, text, border, alpha-варианты)
- **Иконки**: FontAwesome (`@expo/vector-icons`) — все UI-иконки заменены с эмодзи на FontAwesome
- **Видео**: нативные контролы на Android/iOS (expo-video), кастомные на веб (HTML5)
- **Клавиатура**: модалка ввода комментариев вместо полей ввода внизу экрана
- **Комментарии**: двухзапросной подход (comments + profiles раздельно из-за отсутствия FK в schema cache)
- **RLS**: SELECT публичный, INSERT/UPDATE/DELETE только для автора + админ
- **Реалтайм**: подписка на INSERT комментариев через Supabase channels
- **Хранение файлов**: WordPress Media Library (WP REST API `/wp-json/wp/v2/media`) с Basic Auth (Application Passwords). Файлы: `https://pulsera.ru/wp-content/uploads/YYYY/MM/...`
- **useFocusEffect**: экраны (главная, каталог, админ-статьи) обновляют данные при каждом фокусе, а не только при маунте
- **Автозаполнение категорий**: `CategoryInput` компонент — показывает топ-5 категорий по популярности, фильтрация при вводе. API: `getCategories()` возвращает `{ name, count }[]`
- **Чекбоксы в Markdown**: `processCheckboxes()` заменяет `- [ ]` / `- [x]` на юникод-символы (☐/☑), т.к. `react-native-markdown-display` не поддерживает GitHub task lists

---

## Завершённые задачи

### Markdown-редактор для статей ✅
- [x] Рендеринг Markdown для чтения статей (`react-native-markdown-display`)
- [x] Markdown-редактор в админке с тулбаром (14 кнопок)
- [x] Переключение "Редактор / Просмотр" с предпросмотром
- [x] Формат хранения: `content_data.body` в Markdown
- [x] Кастомные стили для рендеринга — `src/utils/markdownStyles.ts`
- [x] Кнопка «Вставить изображение» в тулбаре (picker + upload в WordPress Media Library)
- [x] Автоматическая вставка `![описание](URL)` в Markdown
- [x] Кастомный рендеринг изображений — `src/components/MarkdownImage.tsx`
- [x] Чекбоксы в Markdown — юникод-символы (☐/☑)

### Хранение файлов ✅
- [x] WordPress Media Library вместо Supabase Storage (нет лимита 50 МБ)
- [x] Увеличение max_upload_size на хостинге (upload_max_filesize=256M, post_max_size=256M)

### Админ-панель ✅
- [x] Автозаполнение категорий — выпадающий список с топ-5 по популярности
- [x] Превью изображения выше типа контента в редакторе
- [x] Премиум-контент в редакторе (premium_body, premium_audio_url, premium_video_url)
- [x] Управление пользователями — список, смена подписки и роли (для тестов)

### Офлайн-кэш ✅
- [x] Скачивание текста/аудио/видео
- [x] Приоритет: локальный файл → сетевой URL
- [x] Автоочистка удалённых статей при загрузке
- [x] Скачивание превью + изображений из тела статьи, перезапись URL на локальные пути
- [x] Премиум-медиа в кэше: `downloadContent` качает `premium_video_url` / `premium_audio_url` (приоритет полной версии)
- [x] Премиум-ветка плеера использует локальный файл (`offlineMediaUri || premium_*_url`)
- [x] Обновление `offlineMediaUri` после скачивания прямо на экране контента (подписка на `downloadedIds`)
- [x] Защита: локальный премиум-файл не воспроизводится без подписки (`effectiveOfflineUri`)

---

### Чат с автором (Telegram-стиль) ✅
**Статус:** Завершено
**Доступ:** Только для подписки «Пробуждение»

**Реализовано:**

#### Фаза 1: БД ✅
- [x] Добавить колонку `sender` ('user' | 'author') в `chat_messages` — миграция 006
- [x] RLS: админ видит все сообщения и может отвечать
- [x] Включить Realtime для `chat_messages`

#### Фаза 2: API ✅
- [x] Обновить `sendChatMessage` — параметр `sender`
- [x] `getAdminChatUsers()` — список пользователей с последним сообщением
- [x] `getAdminChatMessages(userId)` — все сообщения диалога
- [x] `markChatAsRead(userId)` — отметить как прочитанное
- [x] `markAuthorMessagesAsRead(userId)` — отметить сообщения автора как прочитанные
- [x] `getPopularArticles()` / `searchArticles()` — для автодополнения @
- [x] `editChatMessage(messageId, text)` — редактирование сообщения
- [x] `deleteChatMessage(messageId)` — удаление сообщения

#### Фаза 3: Пользовательский чат ✅
- [x] `src/app/chat.tsx` — экран чата (Telegram-стиль)
- [x] Лента сообщений (FlatList), сообщения пользователя справа, автора слева
- [x] Поле ввода + кнопка отправки
- [x] Realtime подписка на сообщения и статус прочтения
- [x] Блокировка для не-подписчиков (`ChatLockedScreen`)
- [x] Автодополнение @ — 5 последних статей, фильтрация

#### Фаза 4: Админ-панель ✅
- [x] `src/app/admin/chat/index.tsx` — список чатов с пользователями
- [x] `src/app/admin/chat/[userId].tsx` — диалог с пользователем
- [x] Бейдж непрочитанных

#### Фаза 5: Навигация ✅
- [x] Кнопка «Чат с автором» в профиле → `/chat`
- [x] Кнопка «Чат с пользователями» в админке → `/admin/chat`

#### Фаза 6: Редактирование и удаление ✅
- [x] Долгое нажатие — контекстное меню (Редактировать / Удалить)
- [x] Режим редактирования — баннер, иконка ✓, замена плейсхолдера
- [x] Миграция `008_chat_edit_delete.sql` — колонка `edited`, RLS-политики
- [x] Звёздочки «✓✓» — прочтение в обе стороны

#### Фаза 7: Полировка ✅
- [x] Выравнивание сообщений — `isOwn` (по авторству, не по sender)
- [x] Фон собственных сообщений — белый с синей рамкой
- [x] Группировка сообщений — `isConsecutive`, компактные отступы
- [x] Безопасная зона — `useSafeAreaInsets` для Android
- [x] Ссылки на статьи — инлайновые (Text вместо TouchableOpacity)

#### Фаза 8: Управление чатом (админ) ✅
- [x] Удаление чата — кнопка в списке чатов и в диалоге
- [x] Подтверждение удаления — модалка с предупреждением
- [x] `deleteChat(userId)` — удаление всех сообщений пользователя из БД
- [x] Экспорт чата в .md — кнопка в списке чатов и в хедере диалога
- [x] `shareChatAsMarkdown()` — форматирование + шаринг через expo-sharing

#### Фаза 8: Экран помощи ✅
- [x] `src/app/help.tsx` — инструкции по использованию чата
- [x] Кнопка «Помощь» в профиле → `/help`

#### Компоненты ✅
- [x] `ChatBubble.tsx` — пузырь сообщения (isOwn-based, группировка, контекстное меню)
- [x] `ArticleMention.tsx` — инлайновая ссылка на статью (Text с onPress)
- [x] `ArticleAutocomplete.tsx` — выпадающий список статей при @
- [x] `ChatLockedScreen.tsx` — экран блокировки для не-подписчиков

---

### Настройка профиля ✅
**Статус:** Завершено

**Задачи:**

#### Фаза 1: БД ✅
- [x] Миграция `009_add_phone_to_profiles.sql` — колонка `phone` в profiles
- [x] Миграция `010_add_birthday_to_profiles.sql` — колонка `birthday` в profiles

#### Фаза 2: Экран настроек ✅
- [x] `src/app/settings.tsx` — объединённый экран (профиль + настройки приложения)
- [x] Аватар: выбор из галереи (expo-image-picker), загрузка в WordPress Media Library
- [x] Поля: имя, телефон (маска +7), дата рождения (маска ДД.ММ.ГГГГ), email (read-only)
- [x] Настройки: уведомления (4 Switch)
- [x] Тёмная тема — доступна только из админ-панели
- [x] Кнопка «Сохранить» в хедере

#### Фаза 3: Интеграция ✅
- [x] Пункт «Настройки» в профиле → `/settings`
- [x] Обновление `updateProfile` в API (расширен на `phone`, `birthday`)
- [x] Типы `profiles` обновлены в `supabase.ts`

#### Фаза 4: Аватар по всему приложению ✅
- [x] `profile.tsx` — показ `Image` при наличии `avatar_url`, fallback на первую букву
- [x] `admin/chat/index.tsx` — показ `Image` при наличии `avatar_url`
- [x] `admin/users.tsx` — показ `Image` при наличии `avatar_url`
- [x] `chat.tsx` — запрос профиля автора (admin), показ аватара
- [x] `admin/chat/[userId].tsx` — показ аватара пользователя в хедере диалога

---

### Чат сообщества ✅
**Статус:** Завершено
**Доступ:** Все авторизованные пользователи

**Реализовано:**

#### Фаза 1: БД ✅
- [x] Миграция `011_community_messages.sql` — таблица `community_messages`
- [x] RLS: SELECT для всех авторизованных, INSERT только свои, DELETE свои + админ
- [x] Realtime включён для `community_messages`
- [x] Индекс по `created_at DESC` для пагинации

#### Фаза 2: API ✅
- [x] `getCommunityMessages(limit, before?)` — загрузка с пагинацией
- [x] `sendCommunityMessage(userId, message)` — отправка
- [x] `editCommunityMessage(messageId, text)` — редактирование своего
- [x] `deleteCommunityMessage(messageId)` — удаление своего + админ
- [x] Тип `CommunityMessageWithProfile` — сообщение + профиль автора

#### Фаза 3: Экран ✅
- [x] `community.tsx` — полноценный экран чата сообщества
- [x] `CommunityChatBubble.tsx` — пузырь с аватаром и именем автора
- [x] Realtime подписка на новые сообщения
- [x] Группировка сообщений по автору (`isConsecutive`)
- [x] Контекстное меню: редактирование / удаление (для своих)
- [x] Автодополнение @ — ссылки на статьи
- [x] Индикатор редактирования ("ред.")
- [x] Иконка таба: `users` (группа людей)

---

### Push-уведомления ✅
**Статус:** Завершено
**Механизм:** Expo Push API (отправка с клиента)

**Реализовано:**

#### Фаза 1: Инфраструктура ✅
- [x] Миграция `012_push_tokens.sql` — таблица токенов + RLS
- [x] Миграция `013_notification_preferences.sql` — `notif_chat`, `notif_community`, `notif_articles`, `notif_comments`, `last_community_active`
- [x] Типы `push_tokens` в `supabase.ts`
- [x] Типы `PushToken`, `NotificationType` в `types/user.ts`
- [x] `chatStore.ts` — `activeChatScreen` для пропуска push при открытом чате

#### Фаза 2: Сервис ✅
- [x] `notifications.ts` — registerForPushNotifications, savePushToken, removePushToken
- [x] `sendPushNotification()` — HTTP POST в Expo Push API
- [x] `batchSend()` — буферизация 30 сек, проверка `notif_*` и `activeChatScreen`
- [x] `checkCommunityOffline()` — проверка `last_community_active > 5 мин`
- [x] `sendImmediatePush()` — для новых статей (без батча)
- [x] `setupNotificationListeners()` — foreground handler

#### Фаза 3: Авторизация ✅
- [x] `authStore.ts` — registerToken на login/signup, removeToken на logout
- [x] `_layout.tsx` — setupNotificationListeners при старте

#### Фаза 4: Настройки ✅
- [x] `settings.tsx` — 4 отдельных Switch (чат, сообщества, статьи, комментарии)
- [x] Привязка к `profile.notif_*`, мгновенное обновление в Supabase

#### Фаза 5: Push пользователю ✅
- [x] `chat.tsx` — batch push автору при отправке сообщения
- [x] `community.tsx` — batch push всем кроме отправителя, offline > 5 мин

#### Фаза 6: Push админу ✅
- [x] `admin/chat/[userId].tsx` — batch push пользователю при ответе автора
- [x] `admin/article-edit.tsx` — immediate push при публикации статьи

#### Логика
- **Батч:** 30 сек для chat/community, immediate для articles
- **In-chat:** push пропускается если получатель на экране чата
- **Community:** push только если `last_community_active > 5 мин`
- **Настройки:** каждый тип уведомлений включается/выключается отдельно

---

### Фильтр по категориям в каталоге + блок на главной ✅
**Статус:** Завершено

**Реализовано:**

#### Каталог — фильтр по категориям ✅
- [x] Загрузка категорий через `getCategories()` (топ-25 по популярности)
- [x] Второй горизонтальный слайдер pill-кнопок под фильтром типов
- [x] Кнопка «Все категории» для сброса
- [x] Читает URL param `category` — при переходе с главной автоматически выбирает категорию
- [x] Фильтрация контента по выбранной категории + типу

#### Главная — блок «Популярные категории» ✅
- [x] Загрузка топ-25 категорий через `getCategories()`
- [x] Горизонтальный слайдер pill-кнопок над лентой контента
- [x] Иконка `tag` + название + счётчик статей
- [x] По клику → переход на `/catalog` с param `category`
- [x] Стилизация: `primaryAlpha13` фон, pill-кнопки

#### Файлы
- `src/app/(tabs)/catalog.tsx` — +useLocalSearchParams, +categories state, +второй фильтр
- `src/app/(tabs)/index.tsx` — +categories state, +renderCategories, +ListHeaderComponent

---

### Афиша на главной странице ✅
**Статус:** Завершено
**Цель:** Слайдер баннеров (16:9) на главной + управление в админке

#### Миграция БД
- [x] Миграция `015_afisha_banners.sql` — таблица `afisha_banners` (image_url, image_filename, title, link_url, sort_order, is_active)
- [x] RLS: SELECT публичный, INSERT/UPDATE/DELETE только админ
- [x] Выполнить миграцию в Supabase Dashboard SQL Editor

#### Типы и API
- [x] Типы `AfishaBanner`, `AfishaBannerInsert`, `AfishaBannerUpdate` в `types/content.ts`
- [x] Таблица `afisha_banners` в `supabase.ts` Database типы
- [x] `getActiveBanners()` — активные баннеры для главной
- [x] `getAllBanners()` — все баннеры для админки
- [x] `createAfishaBanner()`, `updateAfishaBanner()`, `deleteAfishaBanner()`
- [x] `reorderAfishaBanners()` — массовое обновление порядка

#### Компонент слайдера
- [x] `AfishaSlider.tsx` — горизонтальный FlatList с pagingEnabled
- [x] Полная ширина экрана, aspectRatio 16:9
- [x] Точки-индикаторы (активная заполнена, неактивные пустые)
- [x] Заголовок поверх изображения (градиент снизу)
- [x] Навигация при клике (внутренняя / внешняя ссылка)
- Ручное управление свайпом (автопрокрутка отключена)

#### Главная страница
- [x] AfishaSlider в `index.tsx` — первый блок после заголовка
- [x] Блок «Популярные категории» под афишей

#### Админка
- [x] `admin/afisha.tsx` — управление баннерами (CRUD + reorder)
- [x] Загрузка изображений через WordPress Media Library
- [x] Превью баннеров (缩略图 80x45)
- [x] Toggle вкл/выкл, кнопки вверх/вниз для порядка
- [x] Модалка редактирования заголовка и ссылки
- [x] Пункт «Афиша» в `admin.tsx` (меню админки)

#### Файлы
- `supabase/migrations/015_afisha_banners.sql` — миграция
- `src/services/supabase.ts` — типы afisha_banners
- `src/types/content.ts` — экспорт AfishaBanner
- `src/services/api.ts` — 6 функций для афиши
- `src/components/AfishaSlider.tsx` — компонент слайдера
- `src/app/(tabs)/index.tsx` — подключение слайдера
- `src/app/admin.tsx` — пункт меню «Афиша»
- `src/app/admin/afisha.tsx` — экран управления

---

### UI фиксы и полировка ✅
**Статус:** Завершено

**Исправления:**
- [x] Community chat date format — `HH:MM DD.MM.YYг.` + разделители между днями
- [x] Input field padding — убран gap при открытой клавиатуре, minHeight: 44, maxHeight: 120
- [x] Dark theme input lighter — inputBg `#16213e` → `#1e2d4a`
- [x] Light theme input bg — `#fffee0` → `rgba(1, 73, 96, 0.13)` (primaryAlpha13)
- [x] Settings text wrapping — удалён `width: 80` с fieldLabel, добавлен `flexShrink: 1`
- [x] Afisha slider overflow — `overflow: 'hidden'` на bannerWrapper
- [x] Afisha slider snap — snapToInterval вместо pagingEnabled, decelerationRate="fast", overScrollMode="never"
- [x] Afisha auto-scroll отключен — ручное управление свайпом
- [x] Убрана секция «О приложении» из settings.tsx

---

## Следующие шаги
1. **Обмен силой** — лента поддержки с реакциями (см. план выше)
2. **Поддержка** — отдельный чат поддержки (несколько админов)
3. **Профиль пользователя (расширенный)**
4. **Собрать новый APK** — `eas build --platform android --profile preview`**
5. **Проверить Push-уведомления при создании APK** — в Expo Go не работают; проверить в собранном APK: разрешение, Expo Push Token, сохранение в `push_tokens`, приход push в foreground/background и переход по тапу

---

### Apple-комплаент (убрать платёжную лексику) ✅
**Статус:** Завершено
**Цель:** Убрать все намёки на покупку/подписку для прохождения Review в App Store / Google Play

#### Миграция БД
- [x] Миграция `014_subscription_expires_at.sql` — поле `subscription_expires_at` в `profiles`
- [x] Типы `supabase.ts` обновлены (Row, Insert, Update)
- [x] Выполнить миграцию в Supabase Dashboard SQL Editor

#### Переименование тарифов
- [x] `Бесплатный` → `Начало` (без намёка на покупку)
- [x] `Путь` — без изменений
- [x] `Пробуждение` — без изменений
- [x] Полный путь: Начало → Путь → Пробуждение (духовная лестница)

#### Убрать платёжную лексику (7 файлов)
- [x] `profile.tsx` — убрана кнопка «Улучшить подписку», добавлена «Действует до»
- [x] `subscription.tsx` → **Удалён**, заменён на `accountstatus.tsx`
- [x] `accountstatus.tsx` — заголовок «Статус аккаунта», нейтральный текст
- [x] `PremiumGate.tsx` — «Подписаться» → «Этот материал доступен участникам с расширенным доступом»
- [x] `content/[id].tsx` — убрана кнопка «Подписаться»
- [x] `ChatLockedScreen.tsx` — «Оформить подписку» → «Написать в чат»
- [x] `admin.tsx` — убрана ссылка «Экран подписки»
- [x] `onboarding.tsx` — «премиум-подписка» → «расширенный доступ»
- [x] `admin/article-edit.tsx` — «Требуемый тариф» → «Требуемый доступ»

#### Apple-комплаентные формулировки
- ❌ «Подписка» / «Subscription»
- ❌ «Купить» / «Purchase» / «Цена» / «Price»
- ❌ «Промокод» / «Промо»
- ❌ «Бесплатный» / «Бесплатно»
- ✅ «Статус аккаунта» / «Доступ» / «Уровень»
- ✅ «Расширенный доступ» / «Расширенный контент»
- ✅ «Начало → Путь → Пробуждение»

#### Проверка подписки при возвращении из фона
- [x] `authStore.ts` — метод `refreshProfile()` (обновление профиля из БД)
- [x] `_layout.tsx` — `AppState` listener (обновление при `active`)
- [x] Логика: возврат из фона → refreshProfile → PremiumGate автоматически блокирует/разблокирует контент

#### Админ: управление датой окончания
- [x] `admin/users.tsx` — при смене тарифа спрашивает дату окончания (ДД.ММ.ГГГГ)
- [x] `api.ts` — `updateUserSubscription()` принимает `expiresAt` параметр
- [x] Отображение даты окончания в списке пользователей

#### Роуты
- [x] `/subscription` → **Удалён**
- [x] `/accountstatus` — новый роут (заголовок «Статус аккаунта»)
- [x] `_layout.tsx` — обновлён Stack.Screen name

---

### Android сборка (EAS Build) ✅
**Статус:** Завершено
**Цель:** APK для тестирования на реальном Android-устройстве

#### Подготовка
- [x] Установить `eas-cli` глобально (`npm install -g eas-cli`)
- [x] Залогиниться в Expo (`eas login`)
- [x] Настроить проект (`eas build:configure`)
- [x] Поменять `android.package` в `app.json` на `ru.pulsera.app`

#### Конфигурация `app.json`
- [x] Добавить `expo-notifications` в plugins
- [x] Добавить `expo-av` в plugins
- [x] Добавить `expo-document-picker` в plugins
- [x] Добавить `expo-image-picker` в plugins
- [x] Добавить `expo-file-system` в plugins

#### Конфигурация `eas.json`
- [x] Профиль `preview` — APK для тестирования (без подписи Play Store)
- [x] Профиль `production` — AAB для Play Store (будущее)

#### Сборка
- [x] Собрать APK: `eas build --platform android --profile preview`
- [x] Скачать APK по ссылке из логов
- [ ] Установить на Android-устройство (включить "Из неизвестных источников")
- [ ] Протестировать ключевые сценарии:
  - Авторизация
  - Контент (статьи, аудио, видео)
  - Чат с автором
  - «Пожужжим» (бывший чат сообщества)
  - Push-уведомления
  - Офлайн-кэш
  - Настройки профиля

#### Зависимости
- Аккаунт на [expo.dev](https://expo.dev) (бесплатный тариф)
- Android-устройство с USB-отладкой или возможностью установки APK
