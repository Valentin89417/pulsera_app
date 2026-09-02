-- Таблица сообщений чата сообщества
-- Общий чат для всех авторизованных пользователей

CREATE TABLE IF NOT EXISTS community_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message text NOT NULL,
  edited boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Индекс для быстрой загрузки (новые сверху)
CREATE INDEX IF NOT EXISTS idx_community_messages_created_at ON community_messages(created_at DESC);

-- RLS
ALTER TABLE community_messages ENABLE ROW LEVEL SECURITY;

-- SELECT: все авторизованные могут читать
CREATE POLICY "community_messages_select_auth"
  ON community_messages FOR SELECT
  TO authenticated
  USING (true);

-- INSERT: авторизованные могут отправлять (только свои)
CREATE POLICY "community_messages_insert_own"
  ON community_messages FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: только свои сообщения (редактирование)
CREATE POLICY "community_messages_update_own"
  ON community_messages FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE: свои + админ
CREATE POLICY "community_messages_delete_own_or_admin"
  ON community_messages FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Включить Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE community_messages;
