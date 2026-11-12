-- ============================================
-- ТИХИЙ ВОПРОС — RLS
-- ============================================

ALTER TABLE mak_decks ENABLE ROW LEVEL SECURITY;
ALTER TABLE mak_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiet_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiet_answers ENABLE ROW LEVEL SECURITY;

-- ============================================
-- КОЛОДЫ
-- ============================================

-- Пользователь видит только активные колоды
CREATE POLICY "quiet_read_active_decks"
  ON mak_decks FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "quiet_admin_manage_decks"
  ON mak_decks FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================
-- КАРТЫ
-- ============================================
-- Обычный пользователь карты не читает вообще: розыгрыш идёт внутри
-- security definer функции create_quiet_question. Клиент не может
-- получить список карт и подставить нужную.

CREATE POLICY "quiet_admin_manage_cards"
  ON mak_cards FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================
-- ВОПРОСЫ
-- ============================================

-- Активные вопросы видят все авторизованные
CREATE POLICY "quiet_questions_select_active"
  ON quiet_questions FOR SELECT
  TO authenticated
  USING (is_hidden = false AND now() < expires_at);

-- Свои вопросы автор видит всегда (в том числе в архиве)
CREATE POLICY "quiet_questions_select_own"
  ON quiet_questions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() AND is_hidden = false);

-- INSERT-политики нет: вопрос создаётся только через RPC create_quiet_question,
-- иначе клиент мог бы подставить произвольную карту.

-- Удаление: в первые 2 часа после создания либо уже из архива
CREATE POLICY "quiet_questions_delete_own"
  ON quiet_questions FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid()
    AND (
      now() < created_at + INTERVAL '2 hours'
      OR now() >= expires_at
    )
  );

CREATE POLICY "quiet_admin_manage_questions"
  ON quiet_questions FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================
-- ОТВЕТЫ
-- ============================================

-- Ответы на активные вопросы видят все авторизованные
CREATE POLICY "quiet_answers_select_active"
  ON quiet_answers FOR SELECT
  TO authenticated
  USING (
    is_hidden = false
    AND EXISTS (
      SELECT 1 FROM quiet_questions q
      WHERE q.id = quiet_answers.question_id
        AND q.is_hidden = false
        AND now() < q.expires_at
    )
  );

-- Свой ответ пользователь видит всегда (нужно для отметки «Ваш ответ»)
CREATE POLICY "quiet_answers_select_own"
  ON quiet_answers FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() AND is_hidden = false);

-- Автор вопроса видит ответы и в архиве
CREATE POLICY "quiet_answers_select_question_author"
  ON quiet_answers FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM quiet_questions q
      WHERE q.id = quiet_answers.question_id
        AND q.user_id = auth.uid()
    )
  );

-- Один ответ на человека, только на активный вопрос
CREATE POLICY "quiet_answers_insert_own"
  ON quiet_answers FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM quiet_questions q
      WHERE q.id = quiet_answers.question_id
        AND q.is_hidden = false
        AND now() < q.expires_at
    )
  );

-- Правка своего ответа — только 2 часа от создания вопроса
CREATE POLICY "quiet_answers_update_own"
  ON quiet_answers FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid()
    AND is_hidden = false
    AND EXISTS (
      SELECT 1 FROM quiet_questions q
      WHERE q.id = quiet_answers.question_id
        AND q.is_hidden = false
        AND now() < q.expires_at
        AND now() < q.created_at + INTERVAL '2 hours'
    )
  )
  WITH CHECK (user_id = auth.uid() AND is_hidden = false);

CREATE POLICY "quiet_admin_manage_answers"
  ON quiet_answers FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
