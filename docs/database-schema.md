# Схема базы данных (Supabase / PostgreSQL)

## Таблицы

### profiles
| Колонка        | Тип        | Описание                  |
|----------------|------------|---------------------------|
| id             | uuid (PK)  | Ссылка на auth.users      |
| display_name   | text       | Имя пользователя          |
| avatar_url     | text       | URL аватара               |
| subscription_tier | text   | free / path / awakening   |
| created_at     | timestamptz| Дата создания             |

### content
| Колонка            | Тип        | Описание                          |
|--------------------|------------|-----------------------------------|
| id                 | uuid (PK)  | Уникальный ID                     |
| title              | text       | Заголовок                         |
| description        | text       | Описание                          |
| type               | text       | article / video / audio / course  |
| category           | text       | Категория (медитация, практика...) |
| content_data       | jsonb      | Данные (markdown, URL, уроки)     |
| is_premium         | boolean    | Платный ли контент                |
| subscription_tier  | text       | Минимальный тариф для доступа     |
| created_at         | timestamptz| Дата публикации                   |

### user_content_progress
| Колонка       | Тип        | Описание                    |
|---------------|------------|-----------------------------|
| user_id       | uuid (FK)  | Пользователь                |
| content_id    | uuid (FK)  | Контент                     |
| progress      | float      | Прогресс 0.0 — 1.0         |
| last_position | integer    | Позиция в секундах (медиа)  |
| is_downloaded | boolean    | Скачан ли офлайн            |

### bookmarks
| Колонка    | Тип        | Описание       |
|------------|------------|----------------|
| user_id    | uuid (FK)  | Пользователь   |
| content_id | uuid (FK)  | Контент        |
| created_at | timestamptz| Дата добавления|

### comments
| Колонка    | Тип        | Описание              |
|------------|------------|-----------------------|
| id         | uuid (PK)  | Уникальный ID         |
| user_id    | uuid (FK)  | Автор комментария     |
| content_id | uuid (FK)  | Контент               |
| text       | text       | Текст комментария     |
| parent_id  | uuid (FK)  | Родительский коммент  |
| created_at | timestamptz| Дата                  |

### chat_messages
| Колонка    | Тип        | Описание          |
|------------|------------|-------------------|
| id         | uuid (PK)  | Уникальный ID     |
| user_id    | uuid (FK)  | Отправитель       |
| message    | text       | Текст сообщения   |
| created_at | timestamptz| Дата              |
| read       | boolean    | Прочитано ли      |

### subscriptions
| Колонка    | Тип        | Описание              |
|------------|------------|-----------------------|
| user_id    | uuid (FK)  | Пользователь          |
| tier       | text       | path / awakening      |
| status     | text       | active / expired      |
| expires_at | timestamptz| Дата окончания        |