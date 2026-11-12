-- ============================================
-- ТИХИЙ ВОПРОС — представления
-- ============================================

-- Лента активных вопросов: без user_id, со счётчиком ответов.
-- Представление работает от владельца (обходит RLS), поэтому явно
-- фильтрует скрытые и истёкшие вопросы и не отдаёт автора.
CREATE OR REPLACE VIEW quiet_questions_feed AS
SELECT
  q.id,
  q.card_image_url,
  q.question,
  q.created_at,
  q.expires_at,
  (COUNT(a.id) FILTER (WHERE a.is_hidden = false))::int AS answers_count
FROM quiet_questions q
LEFT JOIN quiet_answers a ON a.question_id = q.id
WHERE q.is_hidden = false
  AND now() < q.expires_at
GROUP BY q.id;

REVOKE ALL ON quiet_questions_feed FROM anon;
GRANT SELECT ON quiet_questions_feed TO authenticated;

-- Доступные колоды: только активные и только те, где есть карты.
-- Клиент видит число карт, но не сами карты (mak_cards закрыта RLS).
CREATE OR REPLACE VIEW mak_decks_available AS
SELECT
  d.id,
  d.title,
  d.description,
  d.cover_url,
  d.created_at,
  (SELECT COUNT(*) FROM mak_cards c WHERE c.deck_id = d.id)::int AS cards_count
FROM mak_decks d
WHERE d.is_active = true
  AND EXISTS (SELECT 1 FROM mak_cards c WHERE c.deck_id = d.id);

REVOKE ALL ON mak_decks_available FROM anon;
GRANT SELECT ON mak_decks_available TO authenticated;
