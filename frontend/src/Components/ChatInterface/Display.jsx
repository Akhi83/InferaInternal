import React from 'react';
import { Card } from 'react-bootstrap';

const DisplayPanel = ({ messages }) => {
  return (
    <div className="flex-grow-1 overflow-auto p-3" style={{ background: '#f8f9fa' }}>
      {messages.map((msg, idx) => (
        <Card key={idx} className={`mb-2 ${msg.role === 'user' ? 'bg-light' : 'bg-secondary text-white'}`}>
          <Card.Body>
            <strong>{msg.role === 'user' ? 'You' : 'Bot'}:</strong> {msg.text}
          </Card.Body>
        </Card>
      ))}
    </div>
  );
};

export default DisplayPanel;
