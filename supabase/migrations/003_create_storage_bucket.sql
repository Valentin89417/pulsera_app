-- Создаем bucket для контента (файлы)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'content',
  'content',
  true,
  52428800, -- 50 МБ
  ARRAY[
    -- Аудио
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'audio/ogg',
    -- Видео
    'video/mp4',
    'video/quicktime',
    'video/webm',
    -- Изображения
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/webp'
  ]
);

-- RLS политики для storage.objects
-- Anyone can read public files
CREATE POLICY "Public read access" ON storage.objects
  FOR SELECT USING (bucket_id = 'content');

-- Authenticated users can upload files
CREATE POLICY "Authenticated upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'content'
    AND auth.role() = 'authenticated'
  );

-- Users can delete their own files
CREATE POLICY "Users delete own files" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'content'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Admin full access
CREATE POLICY "Admin full access" ON storage.objects
  FOR ALL USING (
    bucket_id = 'content'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
