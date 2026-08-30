-- Удаление комментариев: автор自己的 + админы
CREATE POLICY "Удаление комментариев" ON comments
  FOR DELETE USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Админы могут обновлять комментарии (для будущего функционала)
CREATE POLICY "Админы редактируют комментарии" ON comments
  FOR UPDATE USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
