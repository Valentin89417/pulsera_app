// Типы раздела «Тихий вопрос» («Слёт»)

import { Database } from '../services/supabase';

// Колода МАК-карт
export type MakDeck = Database['public']['Tables']['mak_decks']['Row'];
export type MakDeckInsert = Database['public']['Tables']['mak_decks']['Insert'];
export type MakDeckUpdate = Database['public']['Tables']['mak_decks']['Update'];

// Карта колоды (доступна только админу)
export type MakCard = Database['public']['Tables']['mak_cards']['Row'];
export type MakCardInsert = Database['public']['Tables']['mak_cards']['Insert'];

// Колода в списке выбора: только активные и с картами
export type AvailableMakDeck = Database['public']['Views']['mak_decks_available']['Row'];

// Вопрос в общей ленте
export type QuietQuestionFeedItem = Database['public']['Views']['quiet_questions_feed']['Row'];

// Вопрос для детального экрана — без user_id (анонимность)
export interface QuietQuestionView {
  id: string;
  card_image_url: string;
  question: string;
  created_at: string;
  expires_at: string;
  is_own: boolean;
}

// Ответ в детальном экране: без user_id, только признак «свой»
export interface QuietAnswerView {
  id: string;
  body: string;
  created_at: string;
  updated_at: string;
  is_own: boolean;
}

// Вопрос из архива автора
export interface ArchivedQuietQuestion {
  question: QuietQuestionView;
  answers: QuietAnswerView[];
}

// Вопрос в админском архиве — с автором и всеми ответами
export interface AdminQuietQuestion {
  id: string;
  user_id: string;
  author_name: string | null;
  card_image_url: string;
  question: string;
  created_at: string;
  expires_at: string;
  is_hidden: boolean;
  answers: {
    id: string;
    body: string;
    created_at: string;
    is_hidden: boolean;
  }[];
}

// Вопрос для массовой загрузки в колоду
export interface MakCardInput {
  image_url: string;
  title?: string | null;
}

// Результат публикации вопроса: id либо текст ошибки от сервера
export interface CreateQuietQuestionResult {
  id: string | null;
  error: string | null;
}
