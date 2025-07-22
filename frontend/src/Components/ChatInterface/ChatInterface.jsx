import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { Container, Row, Col } from 'react-bootstrap';
import { useAuth } from '@clerk/clerk-react';
import SidePanel from './SidePanel';
import DisplayPanel from './DisplayPanel';
import Header from './DBHeader';
import CreateChatModal from '../Modal/AddChatModal';

const ChatContainer = () => {
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [databases, setDatabases] = useState([]);
  const [selectedDb, setSelectedDb] = useState(null);
  const [sidePanelOpen, setSidePanelOpen] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newChatTitle, setNewChatTitle] = useState('');

  const { getToken, isLoaded } = useAuth();
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!isLoaded) return;

    const fetchInitialData = async () => {
      const token = await getToken();
      const chatRes = await axios.get('/api/chats', {
        headers: { Authorization: `Bearer ${token}` }
      });

      const chatsData = chatRes.data;
      setChats(chatsData);

      if (chatsData.length > 0) {
        setActiveChatId(chatsData[0].chat_id);
      }      
      setSidePanelOpen(true);

      const dbRes = await axios.get('/api/databases', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const activeDbs = dbRes.data.filter(db => db.database_status === 'Active');
      setDatabases(activeDbs);
      if (activeDbs.length > 0) setSelectedDb(activeDbs[0]);
    };

    fetchInitialData().catch(console.error);
  }, [isLoaded]);

  useEffect(() => {
    if (!activeChatId) return;

    const fetchMessages = async () => {
      const token = await getToken();
      const msgRes = await axios.get(`/api/chats/${activeChatId}/messages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(msgRes.data);
    };

    fetchMessages().catch(console.error);
  }, [activeChatId, getToken]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleCreateChat = async (title) => {
    if (!title.trim()) return;

    const token = await getToken();
    const res = await axios.post('/api/chats', { title }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const newChat = res.data;
    setChats([newChat, ...chats]);
    setActiveChatId(newChat.chat_id);
    setSidePanelOpen(true);
    setShowCreateModal(false);
    setNewChatTitle('');
  };

  const handleDeleteChat = async (chatId) => {
    const token = await getToken();
    await axios.delete(`/api/chats/${chatId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const updatedChats = chats.filter(chat => chat.chat_id !== chatId);
    setChats(updatedChats);

    if (activeChatId === chatId) {
      setActiveChatId(updatedChats[0]?.chat_id || null);
      setMessages([]);
    }

    if (updatedChats.length === 0) {
      setSidePanelOpen(false);
    }
  };

  const handleSelectChat = (chatId) => {
    setActiveChatId(chatId);
  };

  const handleSend = async (prompt) => {
    if (!selectedDb || !activeChatId || !prompt.trim()) return;
    const token = await getToken();

    // Optimistically show placeholder response
    const tempMessage = {
      prompt,
      response: "Thinking..."
    };
    setMessages(prev => [...prev, tempMessage]);
    const history = messages.slice(-4).map(msg => ({
      prompt: msg.prompt,
      response: msg.response
    }));

    try {
      const res = await axios.post('/api/query', {
        prompt,
        database_id: selectedDb.database_id,
        chat_id: activeChatId,
        history : history
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const { message } = res.data;

      // Replace the last optimistic message with the real response
      setMessages(prev => [
        ...prev.slice(0, -1),
        message
      ]);

    } catch (err) {
      const errorMsg = {
        prompt,
        response: `Error: ${err.response?.data?.error || 'Unexpected error'}`
      };
      setMessages(prev => [
        ...prev.slice(0, -1),
        errorMsg
      ]);
    }
  };


  const handleDbSelect = (id) => {
    const db = databases.find((d) => d.database_id === id);
    setSelectedDb(db);
  };

  const handleEmptyClick = () => {
    if (chats.length === 0) {
      setShowCreateModal(true);
    }
  };

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
              databases={databases}
              selectedDb={selectedDb}
              onSelectDb={handleDbSelect}
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
        chatTitle={newChatTitle}
        setChatTitle={setNewChatTitle}
      />
    </Container>
  );
};

export default ChatContainer;
