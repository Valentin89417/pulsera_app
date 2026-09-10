-- Таблица баннеров афиши для главной страницы
CREATE TABLE afisha_banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url TEXT NOT NULL,
  image_filename TEXT,
  title TEXT,
  link_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS: SELECT публичный (все видят активные баннеры)
ALTER TABLE afisha_banners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read afisha banners"
  ON afisha_banners FOR SELECT
  USING (true);

CREATE POLICY "Admin manage afisha banners"
  ON afisha_banners FOR ALL
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- Индекс для сортировки
CREATE INDEX idx_afisha_banners_sort ON afisha_banners(sort_order ASC);
