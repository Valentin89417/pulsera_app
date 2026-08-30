# Схема базы данных (Supabase / PostgreSQL)

## Миграции

| Файл | Описание |
|------|----------|
| `001_initial_schema.sql` | Начальная схема + RLS + триггер |
| `002_add_roles.sql` | Роли (admin/user), RLS для контента |
| `003_setup_storage.sql` | Storage bucket для файлов |
| `004_enable_comments_realtime.sql` | Realtime для комментариев |
| `005_add_comment_delete_policy.sql` | RLS удаления/редактирования комментариев |

---

## Таблицы

### profiles
| Колонка | Тип | Описание |
|---------|-----|----------|
| id | uuid (PK) | Ссылка на auth.users |
| display_name | text | Имя пользователя |
| avatar_url | text | URL аватара |
| role | text | `user` / `admin` (added in 002) |
| subscription_tier | text | `free` / `path` / `awakening` |
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
| created_at | timestamptz | Дата публикации |

**content_data JSONB:**
```json
// article
{ "body": "Текст статьи в Markdown..." }

// audio
{ "audio_url": "https://...", "audio_filename": "meditation.mp3" }

// video
{ "video_url": "https://...", "video_filename": "practice.mp4" }
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
| user_id | uuid (FK) | Отправитель |
| message | text | Текст сообщения |
| created_at | timestamptz | Дата |
| read | boolean | Прочитано ли |

### subscriptions
| Колонка | Тип | Описание |
|---------|-----|----------|
| user_id | uuid (PK) | Пользователь |
| tier | text | `path` / `awakening` |
| status | text | `active` / `expired` / `cancelled` |
| expires_at | timestamptz | Дата окончания |

---

## Row Level Security (RLS)

### profiles
| Операция | Политика |
|----------|----------|
| SELECT | Публичный (все видят) |
| UPDATE | Только свой профиль (`auth.uid() = id`) |
| INSERT | Автоматически через триггер |

### content
| Операция | Политика |
|----------|----------|
| SELECT | Публичный (все видят) |
| INSERT | Только admin |
| UPDATE | Только admin |
| DELETE | Только admin |

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
| ALL | Только свои сообщения (`auth.uid() = user_id`) |

### subscriptions
| Операция | Политика |
|----------|----------|
| ALL | Только своя подписка (`auth.uid() = user_id`) |

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

---

## Storage

Bucket `content` для загрузки файлов (статьи, аудио, видео):
- Путь: `content/{type}/{filename}`
- Доступ: публичный для чтения, admin для записи

---

## Связи

```
auth.users ──1:1──▶ profiles
auth.users ──1:N──▶ comments
auth.users ──1:N──▶ bookmarks
auth.users ──1:N──▶ chat_messages
auth.users ──1:1──▶ subscriptions
auth.users ──N:M──▶ content (через user_content_progress)

content ──1:N──▶ comments (parent_id для вложенности)
content ──1:N──▶ bookmarks
```

---

## Заметки

- `comments.user_id` ссылается на `auth.users`, НЕ на `profiles`
- PostgREST не может автоматически определить связь comments → profiles
- Двухзапросной подход в коде: comments + profiles раздельно
- Первый пользователь автоматически становится admin
