-- ============================================
-- PULSERA APP — Начальная миграция БД
-- ============================================

-- 1. Профили пользователей
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  display_name TEXT,
  avatar_url TEXT,
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'path', 'awakening')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Контент
CREATE TABLE content (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('article', 'video', 'audio', 'course')),
  category TEXT NOT NULL,
  content_data JSONB DEFAULT '{}',
  is_premium BOOLEAN DEFAULT false,
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'path', 'awakening')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Прогресс пользователя по контенту
CREATE TABLE user_content_progress (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content_id UUID REFERENCES content(id) ON DELETE CASCADE,
  progress FLOAT DEFAULT 0.0 CHECK (progress >= 0 AND progress <= 1),
  last_position INTEGER DEFAULT 0,
  is_downloaded BOOLEAN DEFAULT false,
  PRIMARY KEY (user_id, content_id)
);

-- 4. Закладки
CREATE TABLE bookmarks (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content_id UUID REFERENCES content(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, content_id)
);

-- 5. Комментарии
CREATE TABLE comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content_id UUID REFERENCES content(id) ON DELETE CASCADE NOT NULL,
  text TEXT NOT NULL,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Чат с автором
CREATE TABLE chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  read BOOLEAN DEFAULT false
);

-- 7. Подписки
CREATE TABLE subscriptions (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  tier TEXT NOT NULL CHECK (tier IN ('path', 'awakening')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
  expires_at TIMESTAMPTZ NOT NULL
);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE content ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_content_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Profiles: каждый видит свой профиль, публичные данные видны всем
CREATE POLICY "Профили публичны для чтения" ON profiles FOR SELECT USING (true);
CREATE POLICY "Пользователь обновляет свой профиль" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Content: бесплатный виден всем, платный — проверка на уровне приложения
CREATE POLICY "Контент доступен для чтения всем" ON content FOR SELECT USING (true);

-- Progress: только свои данные
CREATE POLICY "Свой прогресс" ON user_content_progress FOR ALL USING (auth.uid() = user_id);

-- Bookmarks: только свои
CREATE POLICY "Свои закладки" ON bookmarks FOR ALL USING (auth.uid() = user_id);

-- Comments: чтение для всех, запись для авторизованных
CREATE POLICY "Комментарии публичны" ON comments FOR SELECT USING (true);
CREATE POLICY "Авторизованные пишут комментарии" ON comments FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Chat: только свои сообщения
CREATE POLICY "Свой чат" ON chat_messages FOR ALL USING (auth.uid() = user_id);

-- Subscriptions: только свои
CREATE POLICY "Своя подписка" ON subscriptions FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- ТРИГГЕР: авто-создание профиля при регистрации
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();