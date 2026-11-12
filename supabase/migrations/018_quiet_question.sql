-- ============================================
-- ТИХИЙ ВОПРОС — колоды МАК, карты, вопросы, ответы
-- ============================================

-- Колоды МАК-карт (изображения карт лежат в WordPress Media Library)
CREATE TABLE IF NOT EXISTS mak_decks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  cover_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Карты колоды
CREATE TABLE IF NOT EXISTS mak_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deck_id UUID NOT NULL REFERENCES mak_decks(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  title TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mak_cards_deck
  ON mak_cards (deck_id, sort_order);

-- Вопросы сообществу (анонимные)
-- user_id нужен только для доступа автора и админа — в публичные выборки не попадает
CREATE TABLE IF NOT EXISTS quiet_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  deck_id UUID REFERENCES mak_decks(id) ON DELETE SET NULL,
  card_id UUID REFERENCES mak_cards(id) ON DELETE SET NULL,
  -- Снимок картинки карты: удаление колоды/карты не ломает архив
  card_image_url TEXT NOT NULL,
  question TEXT NOT NULL CHECK (char_length(question) BETWEEN 1 AND 500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  is_hidden BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_quiet_questions_feed
  ON quiet_questions (expires_at DESC, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_quiet_questions_user
  ON quiet_questions (user_id, expires_at DESC);

-- Ответы: один ответ на пользователя
CREATE TABLE IF NOT EXISTS quiet_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES quiet_questions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body TEXT NOT NULL CHECK (char_length(body) BETWEEN 1 AND 1000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_hidden BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT quiet_answers_one_per_user UNIQUE (question_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_quiet_answers_question
  ON quiet_answers (question_id, created_at);

-- Срок жизни вопроса — 7 дней с момента публикации.
-- Архив вычисляется по expires_at, отдельный cron не нужен.
CREATE OR REPLACE FUNCTION public.set_quiet_question_expiry()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.expires_at := NEW.created_at + INTERVAL '7 days';
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_quiet_questions_expiry ON quiet_questions;
CREATE TRIGGER trg_quiet_questions_expiry
  BEFORE INSERT ON quiet_questions
  FOR EACH ROW
  EXECUTE FUNCTION public.set_quiet_question_expiry();

-- Автообновление updated_at у ответов
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_quiet_answers_updated_at ON quiet_answers;
CREATE TRIGGER trg_quiet_answers_updated_at
  BEFORE UPDATE ON quiet_answers
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_updated_at();

-- ============================================
-- Публикация вопроса: вопрос + случайная карта одной операцией
-- Клиент не видит карты до публикации и не может выбрать конкретную
-- ============================================
CREATE OR REPLACE FUNCTION public.create_quiet_question(p_deck_id UUID, p_question TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_card_id UUID;
  v_card_url TEXT;
  v_question_id UUID;
  v_text TEXT := btrim(p_question);
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Требуется авторизация';
  END IF;

  IF v_text IS NULL OR char_length(v_text) < 1 OR char_length(v_text) > 500 THEN
    RAISE EXCEPTION 'Вопрос должен быть от 1 до 500 символов';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM mak_decks WHERE id = p_deck_id AND is_active) THEN
    RAISE EXCEPTION 'Колода недоступна';
  END IF;

  -- Случайная карта колоды: выбирает сервер, не клиент
  SELECT c.id, c.image_url
    INTO v_card_id, v_card_url
  FROM mak_cards c
  WHERE c.deck_id = p_deck_id
  ORDER BY random()
  LIMIT 1;

  IF v_card_id IS NULL THEN
    RAISE EXCEPTION 'В этой колоде пока нет карт';
  END IF;

  INSERT INTO quiet_questions (user_id, deck_id, card_id, card_image_url, question)
  VALUES (auth.uid(), p_deck_id, v_card_id, v_card_url, v_text)
  RETURNING id INTO v_question_id;

  RETURN v_question_id;
END;
$$;

-- Функцию вызывает только авторизованный клиент
REVOKE ALL ON FUNCTION public.create_quiet_question(UUID, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_quiet_question(UUID, TEXT) FROM anon;
GRANT EXECUTE ON FUNCTION public.create_quiet_question(UUID, TEXT) TO authenticated;
