import { create } from 'zustand';
import LZString from 'lz-string';export const useChatStore = create((set, get) => ({
  activeChatId: null,
  chats: [],
  messagesCache: {},
  databases: [],
  selectedDb: null,

  setActiveChatId: (id) => set({ activeChatId: id }),
  setChats: (chats) => set({ chats }),

  addChat: (chat) => {
    set((state) => ({
      chats: [...state.chats, chat],
      activeChatId: chat.chat_id,
    }));
  },

  deleteChat: (chatId) => {
    set((state) => {
      const newChats = state.chats.filter((chat) => chat.chat_id !== chatId);
      const newCache = { ...state.messagesCache };
      delete newCache[chatId];
      localStorage.removeItem(`chat-${chatId}`);

      const isActive = state.activeChatId === chatId;

      return {
        chats: newChats,
        messagesCache: newCache,
        activeChatId: isActive ? (newChats[0]?.chat_id || null) : state.activeChatId,
      };
    });
  },

  selectChat: (chatId) => {
    get().getMessages(chatId);
    set({ activeChatId: chatId });
  },

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
