-- ============================================
-- PULSERA APP — Добавление ролей (админ/user)
-- ============================================

-- 1. Добавляем поле role в profiles
ALTER TABLE profiles ADD COLUMN role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin'));

-- 2. Удаляем старые политики (разрешали CRUD всем авторизованным)
DROP POLICY IF EXISTS "Авторизованные создают контент" ON content;
DROP POLICY IF EXISTS "Авторизованные обновляют контент" ON content;
DROP POLICY IF EXISTS "Авторизованные удаляют контент" ON content;

-- 3. Создаём новые: CRUD контента только для админов
CREATE POLICY "Админы создают контент" ON content
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Админы обновляют контент" ON content
  FOR UPDATE USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Админы удаляют контент" ON content
  FOR DELETE USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- 4. Делаем первого пользователя админом
UPDATE profiles SET role = 'admin' WHERE id = (
  SELECT id FROM auth.users ORDER BY created_at ASC LIMIT 1
);
