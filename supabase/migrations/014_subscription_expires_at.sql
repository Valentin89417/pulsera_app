-- Добавляем поле даты окончания подписки
ALTER TABLE profiles
ADD COLUMN subscription_expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;
