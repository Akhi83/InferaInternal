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

      const dbRes = await axios.get('/api/databases', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const activeDbs = dbRes.data.filter(db => db.database_status === 'Active');
      setDatabases(activeDbs);

      if (chatsData.length > 0) {
        const firstChat = chatsData[0];
        setActiveChatId(firstChat.chat_id);
        if (firstChat.database_id) {
          const db = activeDbs.find(d => d.database_id === firstChat.database_id);
          setSelectedDb(db);
        } else if (activeDbs.length > 0) {
          setSelectedDb(activeDbs[0]);
        }
      }
      setSidePanelOpen(true);
    };

    fetchInitialData().catch(console.error);
  }, [isLoaded, getToken]);

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

  const handleCreateChat = async (title, dbId) => {
    if (!title.trim() || !dbId) return;

    const token = await getToken();
    const res = await axios.post('/api/chats', { title, database_id: dbId }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const newChat = res.data;
    setChats([newChat, ...chats]);
    setActiveChatId(newChat.chat_id);
    const selected = databases.find(db => db.database_id === dbId);
    setSelectedDb(selected);
    setSidePanelOpen(true);
    setShowCreateModal(false);
  };

  const handleDeleteChat = async (chatId) => {
    const token = await getToken();
    await axios.delete(`/api/chats/${chatId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const updatedChats = chats.filter(chat => chat.chat_id !== chatId);
    setChats(updatedChats);

    if (activeChatId === chatId) {
      const nextChat = updatedChats[0] || null;
      setActiveChatId(nextChat?.chat_id || null);
      if (nextChat && nextChat.database_id) {
        const db = databases.find(d => d.database_id === nextChat.database_id);
        setSelectedDb(db);
      } else {
        setSelectedDb(databases.length > 0 ? databases[0] : null);
      }
      setMessages([]);
    }
  };

  const handleSelectChat = (chatId) => {
    setActiveChatId(chatId);
    const chat = chats.find(c => c.chat_id === chatId);
    if (chat && chat.database_id) {
      const db = databases.find(d => d.database_id === chat.database_id);
      setSelectedDb(db);
    }
  };

  const handleSend = async (prompt) => {
    if (!selectedDb || !activeChatId || !prompt.trim()) return;
    const token = await getToken();

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

      setMessages(prev => [
        ...prev.slice(0, -1),
        message
      ]);

    } catch (err) {
      const errorMsg = {
        prompt,
        response: `Error: ${err.response?.data?.error || err.error || 'Unexpected error'}`
      };
      setMessages(prev => [
        ...prev.slice(0, -1),
        errorMsg
      ]);
    }
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