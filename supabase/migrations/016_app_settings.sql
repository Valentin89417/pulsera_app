-- Таблица настроек приложения (key-value)
CREATE TABLE app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS: только админ может читать/писать
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage app_settings"
  ON app_settings FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Начальное значение: URL календаря пустой
INSERT INTO app_settings (key, value)
VALUES ('calendar_url', '');
