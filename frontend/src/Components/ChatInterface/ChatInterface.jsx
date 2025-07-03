import React, { useState, useEffect } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import SidePanel from './SidePanel';
import DisplayPanel from './Display';
import InputPanel from './Textbar';
import { fetchChats, sendMessage, createNewChat } from './ChatApi';
import './ChatInterface.css';

const ChatContainer = () => {
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    loadChats();
  }, []);

  const loadChats = async () => {
    const data = await fetchChats();
    setChats(data);
    if (data.length > 0) setActiveChatId(data[0].id);
  };

  const handleSend = async (text) => {
    const response = await sendMessage(activeChatId, text);
    setMessages(prev => [...prev, response]);
  };

  const handleNewChat = async () => {
    const newChat = await createNewChat();
    setChats(prev => [newChat, ...prev]);
    setActiveChatId(newChat.id);
    setMessages([]);
  };

  return (
    <Container fluid className="chat-container">
      <Row style={{width: '100%'}}>
        <Col md={2} className="p-0 side-panel" >
          <SidePanel
            chats={chats}
            onSelectChat={setActiveChatId}
            onNewChat={handleNewChat}
            activeChatId={activeChatId}
          />
        </Col>
        <Col md={10} className="d-flex flex-column" style={{ height: '84vh' }}>
          <div className="display-panel" style={{flex: 1}}>
            <DisplayPanel messages={messages} />
          </div>
          <div className="input-panel">
            <InputPanel onSend={handleSend} />
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default ChatContainer;
