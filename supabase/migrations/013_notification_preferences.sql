-- Настройки уведомлений в профиле (по умолчанию все включены)
ALTER TABLE profiles ADD COLUMN notif_chat boolean DEFAULT true;
ALTER TABLE profiles ADD COLUMN notif_community boolean DEFAULT true;
ALTER TABLE profiles ADD COLUMN notif_articles boolean DEFAULT true;
ALTER TABLE profiles ADD COLUMN notif_comments boolean DEFAULT true;

-- Timestamp последней активности в community (для проверки offline > 5 мин)
ALTER TABLE profiles ADD COLUMN last_community_active timestamptz DEFAULT now();
