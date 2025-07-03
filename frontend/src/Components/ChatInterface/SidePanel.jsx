import React from 'react';
import { ListGroup, Button } from 'react-bootstrap';

const SidePanel = ({ chats, onSelectChat, onNewChat, activeChatId }) => {
  return (
    <div className="p-3">
      <Button variant="primary" className="mb-3" onClick={onNewChat}>
        + New Chat
      </Button>
      <ListGroup>
        {chats.map(chat => (
          <ListGroup.Item
            key={chat.id}
            active={chat.id === activeChatId}
            onClick={() => onSelectChat(chat.id)}
            style={{ cursor: 'pointer' }}
          >
            {chat.title || `Chat ${chat.id.slice(0, 6)}`}
          </ListGroup.Item>
        ))}
      </ListGroup>
    </div>
  );
};

export default SidePanel;
