-- Добавить колонку edited для редактирования сообщений
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS edited BOOLEAN DEFAULT false;

-- Политика: пользователь может редактировать свои сообщения
CREATE POLICY "User edit own messages" ON chat_messages
  FOR UPDATE USING (
    auth.uid() = user_id
  );

-- Политика: пользователь может удалять свои сообщения
CREATE POLICY "User delete own messages" ON chat_messages
  FOR DELETE USING (
    auth.uid() = user_id
  );

-- Политика: админ может редактировать любые сообщения
CREATE POLICY "Admin edit all messages" ON chat_messages
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Политика: админ может удалять любые сообщения
CREATE POLICY "Admin delete all messages" ON chat_messages
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );
