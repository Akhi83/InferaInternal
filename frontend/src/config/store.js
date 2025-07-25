import { create } from 'zustand';
import LZString from 'lz-string';

export const useChatStore = create((set, get) => ({
  // State
  activeChatId: null,
  chats: [],
  messagesCache: {},
  databases: [],
  selectedDb: null,

  // Actions
  setActiveChatId: (id) => set({ activeChatId: id }),
  setChats: (chats) => set({ chats }),
  setDatabases: (databases) => set({ databases }),
  setSelectedDb: (db) => set({ selectedDb: db }),

  setMessages: (chatId, messages) => {
    const compressed = LZString.compress(JSON.stringify(messages));
    localStorage.setItem(`chat-${chatId}`, compressed);

    set((state) => ({
      messagesCache: {
        ...state.messagesCache,
        [chatId]: messages,
      },
    }));
  },

  getMessages: (chatId) => {
    const cache = get().messagesCache[chatId];
    if (cache) return cache;

    const stored = localStorage.getItem(`chat-${chatId}`);
    if (!stored) return [];

    const decompressed = JSON.parse(LZString.decompress(stored));
    set((state) => ({
      messagesCache: {
        ...state.messagesCache,
        [chatId]: decompressed,
      },
    }));

    return decompressed;
  },

  clearMessages: (chatId) => {
    localStorage.removeItem(`chat-${chatId}`);
    set((state) => {
      const newCache = { ...state.messagesCache };
      delete newCache[chatId];
      return { messagesCache: newCache };
    });
  }
}));
