-- ============================================
-- СЛОВО СТАИ — ежедневные карточки + ответы
-- ============================================

-- Карточки (1 карточка = 1 день, цикличность по годам)
CREATE TABLE IF NOT EXISTS daily_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  image_url TEXT NOT NULL,
  image_filename TEXT,
  photo_question TEXT NOT NULL,
  summary_questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  audio_url TEXT,
  audio_filename TEXT,
  card_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Уникальность по месяцу+дню (цикличность: 10.03.2025 и 10.03.2026 — разные записи, но показывается только одна)
CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_cards_month_day
  ON daily_cards (EXTRACT(MONTH FROM card_date), EXTRACT(DAY FROM card_date));

-- Ответы пользователей
CREATE TABLE IF NOT EXISTS daily_card_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  card_id UUID NOT NULL REFERENCES daily_cards(id) ON DELETE CASCADE,
  response_type TEXT NOT NULL CHECK (response_type IN ('photo', 'summary')),
  question_index INTEGER,
  answer TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Запрет повторных ответов (1 ответ на фото + 1 ответ на каждый summary вопрос)
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_response
  ON daily_card_responses (user_id, card_id, response_type, question_index);

-- RLS: daily_cards
ALTER TABLE daily_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read daily_cards"
  ON daily_cards FOR SELECT
  USING (true);

CREATE POLICY "Admin manage daily_cards"
  ON daily_cards FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- RLS: daily_card_responses
ALTER TABLE daily_card_responses ENABLE ROW LEVEL SECURITY;

-- SELECT: свои ответы + admin видит всё
CREATE POLICY "responses_select_own_or_admin"
  ON daily_card_responses FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- INSERT: только свои
CREATE POLICY "responses_insert_own"
  ON daily_card_responses FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- DELETE: свои + admin
CREATE POLICY "responses_delete_own_or_admin"
  ON daily_card_responses FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
