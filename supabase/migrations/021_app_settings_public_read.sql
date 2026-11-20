-- Публичное чтение URL календаря из app_settings

-- В 016 вся таблица была закрыта админской политикой FOR ALL.
-- При этом WeekCalendar на главной читает calendar_url клиентом
-- обычного пользователя: getSetting() получал null, и блок
-- «Расписание на неделю» не отображался никому, кроме админа.

-- Открываем чтение ТОЛЬКО ключа calendar_url. Остальные настройки
-- остаются под политикой "Admin can manage app_settings".
DROP POLICY IF EXISTS "Anyone can read calendar_url" ON app_settings;

CREATE POLICY "Anyone can read calendar_url"
  ON app_settings FOR SELECT
  TO anon, authenticated
  USING (key = 'calendar_url');
