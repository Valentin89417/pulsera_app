# Схема базы данных (Supabase / PostgreSQL)

## Миграции

| Файл | Описание |
|------|----------|
| `001_initial_schema.sql` | Начальная схема + RLS + триггер |
| `002_add_roles.sql` | Роли (admin/user), RLS для контента |
| `003_create_storage_bucket.sql` | Storage bucket `content` (сейчас не используется — файлы в WordPress) |
| `004_enable_comments_realtime.sql` | Realtime для комментариев |
| `005_add_comment_delete_policy.sql` | RLS удаления/редактирования комментариев |
| `006_chat_upgrade.sql` | Чат: sender, admin RLS, Realtime |
| `007_admin_update_profiles.sql` | Admin RLS для обновления профилей |
| `008_chat_edit_delete.sql` | Чат: edited колонка, RLS для редактирования/удаления |
| `009_add_phone_to_profiles.sql` | Добавление колонки phone в profiles |
| `010_add_birthday_to_profiles.sql` | Добавление колонки birthday в profiles |
| `011_community_messages.sql` | Чат «Пожужжим» + RLS + Realtime |
| `012_push_tokens.sql` | Push-токены устройств |
| `013_notification_preferences.sql` | Настройки уведомлений и `last_community_active` |
| `014_subscription_expires_at.sql` | Дата окончания доступа в profiles |
| `015_afisha_banners.sql` | Баннеры афиши |
| `016_app_settings.sql` | Настройки приложения (key-value: URL календаря) |
| `017_daily_cards.sql` | «Слово стаи»: карточки и ответы |
| `018_quiet_question.sql` | «Тихий вопрос»: mak_decks, mak_cards, quiet_questions, quiet_answers, RPC |
| `019_quiet_question_views.sql` | `quiet_questions_feed`, `mak_decks_available` |
| `020_quiet_question_rls.sql` | RLS «Тихого вопроса» |
| `021_app_settings_public_read.sql` | Публичное чтение только `calendar_url` |
| `022_content_published_at.sql` | Отложенная публикация: `content.published_at` + новая политика SELECT |

Все миграции 001–021 применены в Supabase. `022_content_published_at.sql` создана, но требует применения (SQL Editor).

---

## Таблицы

### profiles
| Колонка | Тип | Описание |
|---------|-----|----------|
| id | uuid (PK) | Ссылка на auth.users |
| display_name | text | Имя пользователя |
| avatar_url | text | URL аватара |
| phone | text | Номер телефона (added in 009) |
| birthday | date | Дата рождения (added in 010) |
| role | text | `user` / `admin` (added in 002) |
| subscription_tier | text | `free` / `path` / `awakening` |
| subscription_expires_at | timestamptz | Дата окончания доступа (added in 014) |
| notif_chat | boolean | Push о сообщениях в чате с автором (013) |
| notif_community | boolean | Push о «Пожужжиме» (013) |
| notif_articles | boolean | Push о новых статьях (013) |
| notif_comments | boolean | Push о комментариях (013) |
| last_community_active | timestamptz | Последняя активность в «Пожужжиме» — чтобы не пушить тем, кто на экране (013) |
| created_at | timestamptz | Дата создания |

### content
| Колонка | Тип | Описание |
|---------|-----|----------|
| id | uuid (PK) | Уникальный ID |
| title | text | Заголовок |
| description | text | Описание |
| type | text | `article` / `video` / `audio` / `course` |
| category | text | Категория (медитация, практика...) |
| content_data | jsonb | Данные контента |
| is_premium | boolean | Платный ли контент |
| subscription_tier | text | Минимальный тариф: `free` / `path` / `awakening` |
| published_at | timestamptz | Дата публикации (022). Пока в будущем — материал видит только admin |
| created_at | timestamptz | Дата создания |

**Отложенная публикация:** `published_at` задаётся в форме статьи (`ДД.ММ.ГГГГ ЧЧ:ММ`, хранится в UTC). У записей, созданных до миграции 022, `published_at = created_at`. Сортировка ленты — по `published_at DESC`.

**content_data JSONB:**
```json
// Текст (body) — необязателен и доступен для любого типа контента
{ "body": "Текст в Markdown..." }

// article — текстовый контент
{ "body": "Текст статьи в Markdown...", "image_url": "https://...", "image_filename": "cover.jpg" }

// Фотокарусель статьи (только article) — порядок слайдов = порядок в массиве
{
  "images": [
    { "url": "https://.../1.jpg", "filename": "gallery_1.jpg" },
    { "url": "https://.../2.jpg", "filename": "gallery_2.jpg" }
  ]
}

// audio
{ "audio_url": "https://...", "audio_filename": "meditation.mp3", "body": "Текст под плеером (опционально)" }

// video
{ "video_url": "https://...", "video_filename": "practice.mp4", "body": "Текст под плеером (опционально)" }

// Премиум-поля (is_premium = true) — доступны для любого типа
{ "premium_body": "Платный текст в Markdown...", "premium_audio_url": "https://...", "premium_video_url": "https://..." }

// Платная фотокарусель статьи (article) — видит только пользователь с доступом
{ "premium_images": [{ "url": "https://.../1.jpg", "filename": "premium_1.jpg" }] }
```

### user_content_progress
| Колонка | Тип | Описание |
|---------|-----|----------|
| user_id | uuid (FK) | Пользователь |
| content_id | uuid (FK) | Контент |
| progress | float | Прогресс 0.0 — 1.0 |
| last_position | integer | Позиция в секундах (медиа) |
| is_downloaded | boolean | Скачан ли офлайн |

### bookmarks
| Колонка | Тип | Описание |
|---------|-----|----------|
| user_id | uuid (FK) | Пользователь |
| content_id | uuid (FK) | Контент |
| created_at | timestamptz | Дата добавления |

### comments
| Колонка | Тип | Описание |
|---------|-----|----------|
| id | uuid (PK) | Уникальный ID |
| user_id | uuid (FK) | Автор комментария |
| content_id | uuid (FK) | Контент |
| text | text | Текст комментария |
| parent_id | uuid (FK) | Родительский коммент (для ответов) |
| created_at | timestamptz | Дата |

### chat_messages
| Колонка | Тип | Описание |
|---------|-----|----------|
| id | uuid (PK) | Уникальный ID |
| user_id | uuid (FK) | Пользователь (владелец чата) |
| sender | text | `user` / `author` (added in 006) |
| message | text | Текст сообщения |
| edited | boolean | Отредактировано ли (added in 008) |
| read | boolean | Прочитано ли |
| created_at | timestamptz | Дата |

### subscriptions
| Колонка | Тип | Описание |
|---------|-----|----------|
| user_id | uuid (PK) | Пользователь |
| tier | text | `path` / `awakening` |
| status | text | `active` / `expired` / `cancelled` |
| expires_at | timestamptz | Дата окончания |

### community_messages («Пожужжим», 011)
| Колонка | Тип | Описание |
|---------|-----|----------|
| id | uuid (PK) | Уникальный ID |
| user_id | uuid (FK → auth.users) | Автор сообщения |
| message | text | Текст |
| edited | boolean | Отредактировано ли |
| created_at | timestamptz | Дата |

Историческое имя таблицы: раздел раньше назывался «Сообщество», в коде так и осталось.

### push_tokens (012)
| Колонка | Тип | Описание |
|---------|-----|----------|
| id | uuid (PK) | Уникальный ID |
| user_id | uuid (FK → auth.users) | Владелец токена |
| token | text | Expo push token |
| platform | text | `android` / `ios` |
| created_at | timestamptz | Дата |

`UNIQUE (user_id, token)` — один и тот же токен не дублируется.

### afisha_banners (015)
| Колонка | Тип | Описание |
|---------|-----|----------|
| id | uuid (PK) | Уникальный ID |
| image_url | text | Картинка баннера (WordPress) |
| image_filename | text | Имя файла для удаления из WP |
| title | text | Подпись поверх баннера |
| link_url | text | Внутренняя или внешняя ссылка |
| sort_order | integer | Порядок в слайдере |
| is_active | boolean | Показывать ли |
| created_at | timestamptz | Дата |

### app_settings (016)
| Колонка | Тип | Описание |
|---------|-----|----------|
| key | text (PK) | Ключ настройки (например `calendar_ical_url`) |
| value | text | Значение |
| updated_at | timestamptz | Дата обновления |

### daily_cards («Слово стаи», 017)
| Колонка | Тип | Описание |
|---------|-----|----------|
| id | uuid (PK) | Уникальный ID |
| title | text | Заголовок карточки |
| image_url | text | Фото дня |
| image_filename | text | Имя файла для удаления из WP |
| photo_question | text | Вопрос к фото |
| summary_questions | jsonb | Массив вопросов для подведения итогов |
| audio_url | text | Аудио (необязательно) |
| audio_filename | text | Имя аудиофайла |
| card_date | date | Дата карточки |
| created_at | timestamptz | Дата |

### daily_card_responses (017)
| Колонка | Тип | Описание |
|---------|-----|----------|
| id | uuid (PK) | Уникальный ID |
| user_id | uuid (FK → auth.users) | Автор ответа |
| card_id | uuid (FK → daily_cards) | Карточка (`ON DELETE CASCADE`) |
| response_type | text | `photo` / `summary` |
| question_index | integer | Номер вопроса для `summary` |
| answer | text | Ответ |
| created_at | timestamptz | Дата |

---

## Row Level Security (RLS)

### profiles
| Операция | Политика |
|----------|----------|
| SELECT | Публичный (все видят) |
| UPDATE | Только свой профиль (`auth.uid() = id`) + admin может обновлять любые (007) |
| INSERT | Автоматически через триггер |

### content
| Операция | Политика |
|----------|----------|
| SELECT | `published_at <= now()` — всем; запланированные — только admin (022) |
| INSERT | Только admin |
| UPDATE | Только admin |
| DELETE | Только admin |

Изначально чтение было открыто всем (`USING (true)`). Миграция 022 заменила политику на `"Контент доступен после публикации"`: пока `published_at` в будущем, запись возвращается только админу — фильтрация в БД, а не в клиенте.

### user_content_progress
| Операция | Политика |
|----------|----------|
| ALL | Только свои данные (`auth.uid() = user_id`) |

### bookmarks
| Операция | Политика |
|----------|----------|
| ALL | Только свои закладки (`auth.uid() = user_id`) |

### comments
| Операция | Политика |
|----------|----------|
| SELECT | Публичный (все видят) |
| INSERT | Авторизованные (`auth.uid() = user_id`) |
| UPDATE | Автор + admin |
| DELETE | Автор + admin |

### chat_messages
| Операция | Политика |
|----------|----------|
| SELECT | Пользователь видит свои + admin видит все |
| INSERT | Пользователь может писать в свой чат + admin может писать в любой |
| UPDATE | Пользователь может редактировать свои + admin может редактировать любые |
| DELETE | Пользователь может удалять свои + admin может удалять любые |

### subscriptions
| Операция | Политика |
|----------|----------|
| ALL | Только своя подписка (`auth.uid() = user_id`) |

### community_messages (011)
| Операция | Политика |
|----------|----------|
| SELECT | Только авторизованные (`USING (true)` для роли `authenticated`) |
| INSERT | Своё сообщение (`auth.uid() = user_id`) |
| UPDATE | Только своё |
| DELETE | Своё + admin |

### push_tokens (012)
| Операция | Политика |
|----------|----------|
| ALL | Только свои токены (`auth.uid() = user_id`) |

### afisha_banners (015)
| Операция | Политика |
|----------|----------|
| SELECT | Публичный |
| INSERT / UPDATE / DELETE | Только admin |

### app_settings (016)
| Операция | Политика |
|----------|----------|
| SELECT | `calendar_url` — всем (021), остальные ключи — только admin |
| INSERT / UPDATE / DELETE | Только admin |

Изначально таблица была закрыта админской политикой `FOR ALL`, поэтому `WeekCalendar` на главной не получал `calendar_url` под обычным пользователем и блок «Расписание на неделю» не отображался никому, кроме админа. Миграция 021 открыла чтение только этого ключа.

### daily_cards / daily_card_responses (017)
| Таблица | Операция | Политика |
|---------|----------|----------|
| daily_cards | SELECT | Публичный |
| daily_cards | INSERT / UPDATE / DELETE | Только admin |
| daily_card_responses | SELECT | Свои + admin |
| daily_card_responses | INSERT | Свои |
| daily_card_responses | DELETE | Свои + admin |

---

## Триггеры

### Авто-создание профиля при регистрации
```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(
    NEW.raw_user_meta_data->>'display_name',
    split_part(NEW.email, '@', 1)
  ));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

### Авто-назначение первого пользователя админом (002)
```sql
UPDATE profiles SET role = 'admin' WHERE id = (
  SELECT id FROM auth.users ORDER BY created_at ASC LIMIT 1
);
```

---

## Realtime

Таблица `comments` включена в `supabase_realtime` (004):
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE comments;
```

Таблица `chat_messages` включена в `supabase_realtime` (006):
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
```

Таблица `community_messages` («Пожужжим») включена в `supabase_realtime` (011):
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE community_messages;
```

Realtime подписка на все события (INSERT, UPDATE) для обновления статуса прочтения.

---

## Storage

Bucket `content` создан миграцией 003, но **не используется**: изображения, аудио и видео лежат в WordPress Media Library (`pulsera.ru/wp-content/uploads/...`). Supabase отвечает только за БД, авторизацию и realtime.

---

## Связи

```
auth.users ──1:1──▶ profiles
auth.users ──1:N──▶ comments
auth.users ──1:N──▶ bookmarks
auth.users ──1:N──▶ chat_messages
auth.users ──1:N──▶ community_messages
auth.users ──1:N──▶ push_tokens
auth.users ──1:1──▶ subscriptions
auth.users ──N:M──▶ content (через user_content_progress)

content ──1:N──▶ comments (parent_id для вложенности)
content ──1:N──▶ bookmarks

mak_decks ──1:N──▶ mak_cards (ON DELETE CASCADE)
mak_decks ──1:N──▶ quiet_questions (ON DELETE SET NULL)
mak_cards  ──1:N──▶ quiet_questions (ON DELETE SET NULL)
quiet_questions ──1:N──▶ quiet_answers (ON DELETE CASCADE)

daily_cards ──1:N──▶ daily_card_responses (ON DELETE CASCADE)
```

---

## Заметки

- `comments.user_id` ссылается на `auth.users`, НЕ на `profiles`
- PostgREST не может автоматически определить связь comments → profiles
- Двухзапросной подход в коде: comments + profiles раздельно
- Первый пользователь автоматически становится admin

### Миграция 006: Чат
```sql
-- Добавить колонку sender
ALTER TABLE chat_messages ADD COLUMN sender text DEFAULT 'user';

-- RLS: пользователь видит свои сообщения
CREATE POLICY "Users can view own chat messages"
ON chat_messages FOR SELECT
USING (auth.uid() = user_id);

-- RLS: admin видит все сообщения
CREATE POLICY "Admin can view all chat messages"
ON chat_messages FOR SELECT
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- RLS: пользователь может писать в свой чат
CREATE POLICY "Users can send messages in own chat"
ON chat_messages FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- RLS: admin может писать в любой чат
CREATE POLICY "Admin can send messages in any chat"
ON chat_messages FOR INSERT
WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Включить Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
```

### Миграция 007: Admin update profiles
```sql
-- RLS: admin может обновлять любые профили
CREATE POLICY "Admin can update any profile"
ON profiles FOR UPDATE
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
```

### Миграция 008: Редактирование/удаление сообщений
```sql
-- Добавить колонку edited
ALTER TABLE chat_messages ADD COLUMN edited boolean DEFAULT FALSE;

-- RLS: пользователь может редактировать свои сообщения
CREATE POLICY "Users can update own messages"
ON chat_messages FOR UPDATE
USING (auth.uid() = user_id);

-- RLS: admin может редактировать любые сообщения
CREATE POLICY "Admin can update any messages"
ON chat_messages FOR UPDATE
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- RLS: пользователь может удалять свои сообщения
CREATE POLICY "Users can delete own messages"
ON chat_messages FOR DELETE
USING (auth.uid() = user_id);

-- RLS: admin может удалять любые сообщения
CREATE POLICY "Admin can delete any messages"
ON chat_messages FOR DELETE
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
```

### Миграция 009: Добавление телефона
```sql
-- Добавить колонку phone в profiles
ALTER TABLE profiles ADD COLUMN phone text;
```

### Миграция 010: Добавление даты рождения
```sql
-- Добавить колонку birthday в profiles
ALTER TABLE profiles ADD COLUMN birthday date;
```

---

## Тихий вопрос («Слёт»)

### mak_decks
| Колонка | Тип | Описание |
|---------|-----|----------|
| id | uuid (PK) | Уникальный ID |
| title | text | Название колоды |
| description | text | Описание темы |
| cover_url | text | Обложка (WordPress Media Library) |
| is_active | boolean | Доступна ли для выбора |
| created_at | timestamptz | Дата |

### mak_cards
| Колонка | Тип | Описание |
|---------|-----|----------|
| id | uuid (PK) | Уникальный ID |
| deck_id | uuid (FK → mak_decks) | Колода (`ON DELETE CASCADE`) |
| image_url | text | Изображение карты (WordPress) |
| title | text | Подпись (необязательно) |
| sort_order | integer | Порядок в админке |
| created_at | timestamptz | Дата |

### quiet_questions
| Колонка | Тип | Описание |
|---------|-----|----------|
| id | uuid (PK) | Уникальный ID |
| user_id | uuid (FK → auth.users) | Автор (не отдаётся в публичные выборки) |
| deck_id | uuid (FK → mak_decks) | Выбранная колода (`ON DELETE SET NULL`) |
| card_id | uuid (FK → mak_cards) | Выпавшая карта (`ON DELETE SET NULL`) |
| card_image_url | text | Снимок картинки на момент публикации |
| question | text | Вопрос (1–500 символов) |
| created_at | timestamptz | Дата публикации |
| expires_at | timestamptz | `created_at + 7 дней` (триггер) |
| is_hidden | boolean | Скрыт админом |

### quiet_answers
| Колонка | Тип | Описание |
|---------|-----|----------|
| id | uuid (PK) | Уникальный ID |
| question_id | uuid (FK → quiet_questions) | Вопрос (`ON DELETE CASCADE`) |
| user_id | uuid (FK → auth.users) | Автор ответа (не отдаётся в публичные выборки) |
| body | text | Текст ответа (1–1000 символов) |
| created_at | timestamptz | Дата |
| updated_at | timestamptz | Обновляется триггером |
| is_hidden | boolean | Скрыт админом |

Ограничение: `UNIQUE (question_id, user_id)` — один ответ на человека.

### Представления
- `quiet_questions_feed` — активные вопросы (`now() < expires_at`, не скрытые) + `answers_count`, без `user_id`.
- `mak_decks_available` — активные колоды, в которых есть хотя бы одна карта, + `cards_count`.

### RPC
- `create_quiet_question(p_deck_id uuid, p_question text) → uuid` — `SECURITY DEFINER`: проверяет авторизацию, текст и активность колоды, случайно выбирает карту (`ORDER BY random()`), пишет вопрос со снимком картинки. Клиент не имеет доступа к `mak_cards`, поэтому выбрать карту нельзя.

### RLS
| Таблица | SELECT | INSERT | UPDATE | DELETE |
|---------|--------|--------|--------|--------|
| mak_decks | авторизованные (активные) | admin | admin | admin |
| mak_cards | только admin | admin | admin | admin |
| quiet_questions | активные — всем; свои — автору; архив — автору и admin | нет (только через RPC) | admin | автор: `now() < created_at + 2h` или `now() >= expires_at`; admin — всегда |
| quiet_answers | активные — всем; свой — всегда; архивные — автору вопроса и admin | свой + вопрос активен | свой, пока `now() < q.created_at + 2h` | admin |

### Миграции
- `018_quiet_question.sql` — таблицы, триггеры, RPC.
- `019_quiet_question_views.sql` — представления.
- `020_quiet_question_rls.sql` — политики.

