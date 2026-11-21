-- Отложенная публикация контента
--
-- До этой миграции весь контент был доступен на чтение всем
-- ("Контент доступен для чтения всем" USING (true)). Теперь у каждой
-- записи есть published_at: пока дата в будущем, материал видит только
-- админ. Фильтрация — на уровне БД, иначе запланированную статью можно
-- было бы вытащить прямым запросом к PostgREST.

ALTER TABLE content ADD COLUMN published_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- Существующие материалы уже опубликованы: дата публикации = дата создания
UPDATE content SET published_at = created_at;

-- Индекс для сортировки ленты и проверки в политике
CREATE INDEX IF NOT EXISTS content_published_at_idx ON content (published_at DESC);

-- Чтение: опубликованное — всем, будущее — только админу
DROP POLICY IF EXISTS "Контент доступен для чтения всем" ON content;

CREATE POLICY "Контент доступен после публикации" ON content FOR SELECT
  USING (
    published_at <= now()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE id = (SELECT auth.uid()) AND role = 'admin'
    )
  );
