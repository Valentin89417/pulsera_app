-- Админ может обновлять профили других пользователей
CREATE POLICY "Admin update any profile" ON profiles
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);
