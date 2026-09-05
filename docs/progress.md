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
- [x] Чат с автором (Telegram-стиль, Realtime, ссылки на статьи)
- [x] Чат сообщества (общий чат для всех пользователей)
- [x] Push-уведомления
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

### ~~Платная подписка (ЮKassa + Stripe)~~ — ОТМЕНЕНО
**Статус:** ОТМЕНЕНО
**Причина:** Пользователь — самозанятый (без ИП). Оплата напрямую на карту. Активация подписки вручную через админ-панель. Нет in-app платежей.

**Вместо этого:**
- Админ-панель: ручная смена тарифа + дата окончания
- Apple-комплаент: нет слов «подписка», «купить», «цена», «промокод»
- Экран «Статус аккаунта» — нейтральная информация

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
- [x] Настройки: тема, уведомления, версия
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

## Следующие шаги
1. **Поддержка** — отдельный чат поддержки (несколько админов)
2. **Профиль пользователя (расширенный)**

---

### Apple-комплаент (убрать платёжную лексику) ✅
**Статус:** Завершено
**Цель:** Убрать все намёки на покупку/подписку для прохождения Review в App Store / Google Play

#### Миграция БД
- [x] Миграция `014_subscription_expires_at.sql` — поле `subscription_expires_at` в `profiles`
- [x] Типы `supabase.ts` обновлены (Row, Insert, Update)
- [ ] Выполнить миграцию в Supabase Dashboard SQL Editor

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
  - Чат сообщества
  - Push-уведомления
  - Офлайн-кэш
  - Настройки профиля

#### Зависимости
- Аккаунт на [expo.dev](https://expo.dev) (бесплатный тариф)
- Android-устройство с USB-отладкой или возможностью установки APK
