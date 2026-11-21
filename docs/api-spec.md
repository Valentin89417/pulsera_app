# Спецификация API

Файл описывает, с какими API работает приложение и где лежит код. Источник истины —
`src/services/api.ts` и `src/services/supabase.ts`; здесь карта, чтобы не искать по коду.

## 1. Supabase (БД, авторизация, realtime)

Клиент: `src/services/supabase.ts` (там же типы `Database` — таблицы, представления, RPC).
Все запросы идут напрямую в PostgREST под RLS, отдельного бэкенда нет.

| Группа | Функции (`src/services/api.ts`) |
|---|---|
| Профиль | `getProfile`, `updateProfile` |
| Контент | `getContent`, `getContentById`, `getCategories`, `createContent`, `updateContent`, `deleteContent`, `getExistingContentIds` |
| Прогресс / закладки | `getUserProgress`, `updateUserProgress`, `addBookmark`, `removeBookmark`, `isBookmarked`, `getUserBookmarks` |
| Комментарии | `getContentComments`, `addComment`, `getAllComments`, `updateComment`, `deleteComment`, `getCommentAuthorId` |
| Чат с автором | `getChatMessages`, `sendChatMessage`, `editChatMessage`, `deleteChatMessage`, `getAdminChatUsers`, `getAdminChatMessages`, `markChatAsRead`, `markAuthorMessagesAsRead`, `deleteChat`, `exportChatToMarkdown`, `shareChatAsMarkdown` |
| «Пожужжим» | `getCommunityMessages`, `sendCommunityMessage`, `editCommunityMessage`, `deleteCommunityMessage` |
| Подписка / пользователи | `getUserSubscription`, `isSubscriptionActive`, `getAllUsers`, `updateUserRole`, `updateUserSubscription`, `getAllUserIds`, `getUserNotificationPrefs` |
| Статьи для `@`-ссылок | `getPopularArticles`, `searchArticles` |
| Афиша | `getActiveBanners`, `getAllBanners`, `createAfishaBanner`, `updateAfishaBanner`, `deleteAfishaBanner`, `reorderAfishaBanners` |
| Настройки | `getSetting`, `setSetting` (таблица `app_settings`, RLS admin-only — см. database-schema.md) |
| «Слово стаи» / дневник | `getTodaysCard`, `getAllDailyCards`, `createDailyCard`, `updateDailyCard`, `deleteDailyCard`, `getUserCardResponse`, `createDailyCardResponse`, `getUserDiaryEntries` |
| «Тихий вопрос» | `getAvailableMakDecks`, `createQuietQuestion`, `getQuietQuestions`, `getQuietQuestion`, `getQuietAnswers`, `createQuietAnswer`, `updateQuietAnswer`, `deleteQuietQuestion`, `getMyArchivedQuestions`, `getAdminQuietArchive`, `setQuietQuestionHidden` |
| Колоды МАК | `getAllMakDecks`, `createMakDeck`, `updateMakDeck`, `deleteMakDeck`, `getMakCards`, `getAllMakCards`, `addMakCards`, `deleteMakCard` |

### RPC
- `create_quiet_question(p_deck_id uuid, p_question text) → uuid` — единственный путь создания
  «Тихого вопроса»: `SECURITY DEFINER`, проверяет колоду и текст, случайно тянет карту и пишет
  снимок `card_image_url`. Прямой `insert` в `quiet_questions` запрещён RLS.

### Представления
- `quiet_questions_feed` — активные вопросы + `answers_count`, без `user_id`.
- `mak_decks_available` — активные колоды с картами (только `authenticated`).

### Realtime
Каналы `postgres_changes` на `comments`, `chat_messages`, `community_messages`.

### Отложенная публикация
`getContent` сортирует по `published_at DESC`. Материалы с `published_at` в будущем PostgREST
не возвращает обычному пользователю — это RLS-политика (022), отдельного параметра в API нет.
`createContent` / `updateContent` принимают `published_at` (ISO-строка UTC).

## 2. WordPress REST API (файлы)

- База: `EXPO_PUBLIC_WP_URL` + `/wp-json/wp/v2`, авторизация Basic Auth (Application Passwords).
- `POST /media` — загрузка файла (Binary Content-Disposition), ответ содержит `id` и `source_url`.
- `GET /media?search=<filename>` — поиск media по имени файла (для удаления).
- `DELETE /media/{id}?force=true` — физическое удаление файла.
- `GET /wp-json/` — preflight-проверка доступности сервера перед большой загрузкой
  (`checkWpServerReachable`, таймаут 10 с).
- Лимиты — на стороне хостинга (`client_max_body_size`, `upload_max_filesize`), не Supabase.

## 3. Expo Push API

- `POST https://exp.host/--/api/v2/push/send` — отправка уведомлений с клиента
  (`src/services/notifications.ts`).
- Батчинг: буфер на пользователя, отправка через 30 с для чатов; для статей — сразу.
- `notifyNewContent(contentId, title)` — рассылка «Новая публикация» тем, у кого включён
  `notif_articles`. Вызывается при создании уже опубликованного материала и по кнопке
  «Опубликовать и отправить push» для запланированных; для будущих дат не вызывается.
- Push пропускается, если получатель на активном экране чата (ключ `slet-chat`).

## 4. Соглашения

- Каждая функция: `async/await` + `try/catch`, при ошибке возвращает `null` / `false` и пишет
  `console.error`, не выбрасывает исключение наружу (кроме загрузки файлов).
- Сетевые ошибки распознаются в `src/utils/networkError.ts` (`isNetworkError`), пользователю
  показывается «Нет интернета. Проверьте подключение к сети» вместо сырого текста OkHttp/fetch.
- Права доступа — только через RLS в БД, клиент не фильтрует данные «на доверии».
