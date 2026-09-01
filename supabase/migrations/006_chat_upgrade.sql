-- ============================================
-- ЧАТ С АВТОРОМ — Апгрейд
-- ============================================

-- 1. Добавить колонку sender (кто отправил: пользователь или автор)
ALTER TABLE chat_messages 
ADD COLUMN sender TEXT DEFAULT 'user' CHECK (sender IN ('user', 'author'));

-- 2. RLS: админ видит все сообщения чата
CREATE POLICY "Admin read all chat" ON chat_messages 
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- 3. RLS: админ может отвечать в чат (вставлять сообщения от имени автора)
CREATE POLICY "Admin insert chat" ON chat_messages 
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- 4. Включить Realtime для таблицы chat_messages
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
