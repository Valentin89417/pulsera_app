import { create } from 'zustand';

// Какой экран чата сейчас открыт (для пропуска push-уведомлений)
// Значения: 'chat', 'community', 'admin-chat-<userId>', null
interface ChatState {
  activeChatScreen: string | null;
  setActiveChatScreen: (screen: string | null) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  activeChatScreen: null,
  setActiveChatScreen: (screen) => set({ activeChatScreen: screen }),
}));
