import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { Container, Row, Col } from 'react-bootstrap';
import { useAuth } from '@clerk/clerk-react';
import SidePanel from './SidePanel';
import DisplayPanel from './DisplayPanel';
import Header from './DBHeader';
import CreateChatModal from '../Modal/AddChatModal';
import { useChatsStore } from '../../Store/useChatsStore';

const ChatContainer = () => {
  const [sidePanelOpen, setSidePanelOpen] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const {
    chats,
    databases,
    selectedDb,
    activeChatId,
    getMessages,
    setMessages,
    setChats,
    setActiveChatId,
    addChat,
    deleteChat,
    setDatabases,
    setSelectedDb
  } = useChatsStore();

  const { getToken, isLoaded } = useAuth();
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!isLoaded) return;

    const fetchInitialData = async () => {
      const token = await getToken();

      const [chatRes, dbRes] = await Promise.all([
        axios.get('/api/chats', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/api/databases', { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      const chatsData = chatRes.data;
      const activeDbs = dbRes.data.filter(db => db.database_status === 'Active');

      setChats(chatsData);
      setDatabases(activeDbs);

      if (!activeChatId && chatsData.length > 0) {
        const firstChat = chatsData[0];
        setActiveChatId(firstChat.chat_id);

        const db = activeDbs.find(d => d.database_id === firstChat.database_id);
        setSelectedDb(db || activeDbs[0] || null);
      }


      setSidePanelOpen(true);
    };

    fetchInitialData().catch(console.error);
  }, [isLoaded, getToken]);

  useEffect(() => {
    if (!activeChatId) return;

    
    const cached = getMessages(activeChatId);
    if (cached.length > 0) {
      setMessages(activeChatId, cached); 
    }

    // Then fetch fresh from server in background
    const fetchMessages = async () => {
      const token = await getToken();
      const res = await axios.get(`/api/chats/${activeChatId}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setMessages(activeChatId, res.data);
    };

    fetchMessages().catch(console.error);
  }, [activeChatId]);


  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [getMessages(activeChatId)]); 

  const handleCreateChat = async (title, dbId) => {
    if (!title.trim() || !dbId) return;
    const token = await getToken();

    const res = await axios.post('/api/chats', { title, database_id: dbId }, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const newChat = res.data;
    addChat(newChat);
    setActiveChatId(newChat.chat_id);

    const selected = databases.find(db => db.database_id === dbId);
    setSelectedDb(selected);

    setSidePanelOpen(true);
    setShowCreateModal(false);
  };

  const handleDeleteChat = async (chatId) => {
    const token = await getToken();
    await axios.delete(`/api/chats/${chatId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    deleteChat(chatId);

    if (activeChatId === chatId) {
      const updated = chats.filter(chat => chat.chat_id !== chatId);
      const nextChat = updated[0] || null;
      setActiveChatId(nextChat?.chat_id || null);

      if (nextChat?.database_id) {
        const db = databases.find(d => d.database_id === nextChat.database_id);
        setSelectedDb(db);
      } else {
        setSelectedDb(databases[0] || null);
      }

      setMessages(chatId, []);
    }
  };

  const handleSelectChat = (chatId) => {
    setActiveChatId(chatId);
    const chat = chats.find(c => c.chat_id === chatId);
    if (chat?.database_id) {
      const db = databases.find(d => d.database_id === chat.database_id);
      setSelectedDb(db);
    }
  };

  const handleSend = async (prompt) => {
    if (!selectedDb || !activeChatId || !prompt.trim()) return;
    const token = await getToken();

    const currentMessages = getMessages(activeChatId) || [];

    const tempMessage = {
      prompt,
      response: "Thinking..."
    };

    setMessages(activeChatId, [...currentMessages, tempMessage]);

    const history = currentMessages.slice(-4).map(msg => ({
      prompt: msg.prompt,
      response: msg.response
    }));

    try {
      const res = await axios.post('/api/query', {
        prompt,
        database_id: selectedDb.database_id,
        chat_id: activeChatId,
        history
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const { message } = res.data;
      const updated = [...currentMessages, message];
      setMessages(activeChatId, updated);

    } catch (err) {
      const errorMsg = {
        prompt,
        response: `Error: ${err.response?.data?.error || err.message || 'Unexpected error'}`
      };

      const updated = [...currentMessages.slice(0, -1), errorMsg];
      setMessages(activeChatId, updated);
    }
  };

  const handleEmptyClick = () => {
    if (chats.length === 0) {
      setShowCreateModal(true);
    }
  };

  const messages = getMessages(activeChatId) || [];

  return (
    <Container fluid className="h-100 p-0 overflow-hidden">
      <Row className="h-100 g-0 flex-nowrap">
        {sidePanelOpen && (
          <Col xs="auto" className="p-0 sidebar-col">
            <SidePanel
              chats={chats}
              onSelectChat={handleSelectChat}
              onNewChat={() => setShowCreateModal(true)}
              activeChatId={activeChatId}
              onDeleteChat={handleDeleteChat}
            />
          </Col>
        )}

        <Col className="d-flex flex-column p-0 h-100 overflow-hidden">
          <div className="shrink-0">
            <Header
              selectedDbName={selectedDb ? selectedDb.database_name : 'No Database Selected'}
            />
          </div>

          <div className="flex-grow-1 overflow-auto chat-scroll-area">
            <DisplayPanel
              messages={messages}
              onSend={handleSend}
              onEmptyClick={handleEmptyClick}
              showInput={!!activeChatId}
              messagesEndRef={messagesEndRef}
            />
          </div>
        </Col>
      </Row>

      <CreateChatModal
        show={showCreateModal}
        onHide={() => setShowCreateModal(false)}
        onCreate={handleCreateChat}
        databases={databases}
      />
    </Container>
  );
};

export default ChatContainer;
