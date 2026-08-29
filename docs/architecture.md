# Архитектура приложения

pulsera-app/
│
├── AGENTS.md                          # Инструкции для AI (OpenCode/Claude)
├── .env.example                       # Пример переменных окружения
├── app.json                           # Конфигурация Expo
├── package.json                       # Зависимости проекта
├── tsconfig.json                      # TypeScript конфигурация
│
├── docs/
│   ├── architecture.md                # Архитектура приложения
│   ├── database-schema.md             # Схема БД
│   ├── api-spec.md                    # Спецификация API
│   └── progress.md                    # Прогресс разработки
│
├── src/
│   ├── app/                           # Expo Router (файлы-роуты)
│   │   ├── _layout.tsx                # Корневой layout
│   │   │
│   │   ├── (auth)/                    # Группа авторизации
│   │   │   ├── _layout.tsx            # Layout авторизации
│   │   │   ├── login.tsx              # Экран входа
│   │   │   ├── register.tsx           # Экран регистрации
│   │   │   └── forgot-password.tsx    # Восстановление пароля
│   │   │
│   │   └── (tabs)/                    # Группа основных табов
│   │       ├── _layout.tsx            # Layout табов
│   │       ├── index.tsx              # Главная
│   │       ├── catalog.tsx            # Каталог
│   │       ├── community.tsx          # Сообщество
│   │       └── profile.tsx            # Профиль
│   │
│   ├── components/                    # UI компоненты
│   │
│   ├── hooks/
│   │   └── useAuth.ts                 # Хук аутентификации
│   │
│   ├── services/
│   │   ├── supabase.ts                # Supabase клиент
│   │   └── api.ts                     # API функции
│   │
│   ├── store/
│   │   └── authStore.ts               # Zustand store
│   │
│   ├── types/
│   │   ├── auth.ts                    # Типы аутентификации
│   │   ├── content.ts                 # Типы контента
│   │   ├── user.ts                    # Типы пользователя
│   │   └── index.ts                   # Экспорт типов
│   │
│   ├── utils/
│   │   ├── constants.ts               # Константы
│   │   ├── helpers.ts                 # Утилиты
│   │   └── index.ts                   # Экспорт утилит
│   │
│   └── constants/
│       └── Colors.ts                  # Цвета (из шаблона Expo)
│
└── supabase/
└── migrations/
└── 001_initial_schema.sql     # Начальная схема БД