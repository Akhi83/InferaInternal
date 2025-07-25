  import { create } from 'zustand';
  import LZString from 'lz-string';

  export const useChatsStore = create((set, get) => ({
    activeChatId: null,
    chats: [],
    messagesCache: {},
    databases: [],
    selectedDb: null,

    setActiveChatId: (id) => set({ activeChatId: id }),

    setChats: (chats) => set({ chats }),

    addChat: (chat) => {
      set((state) => ({
        chats: [chat, ...state.chats],
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
        const nextChat = newChats[0] || null;

        return {
          chats: newChats,
          messagesCache: newCache,
          activeChatId: isActive ? nextChat?.chat_id || null : state.activeChatId,
          selectedDb: nextChat?.database_id
            ? state.databases.find((db) => db.database_id === nextChat.database_id)
            : (state.databases.length > 0 ? state.databases[0] : null),
        };
      });
    },

    selectChat: (chatId) => {
      const chat = get().chats.find((c) => c.chat_id === chatId);
      const db = chat?.database_id
        ? get().databases.find((d) => d.database_id === chat.database_id)
        : null;

      get().getMessages(chatId); 
      set({
        activeChatId: chatId,
        selectedDb: db,
      });
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
    },

    setDatabases: (dbs) => set({ databases: dbs }),
    setSelectedDb: (db) => set({ selectedDb: db }),
  }));
