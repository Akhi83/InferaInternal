import React, { useState } from 'react';
import { Form, Button, InputGroup } from 'react-bootstrap';
import { FiSend } from 'react-icons/fi';
import './InputPanel.css';

const InputPanel = ({ onSend, isDbSelected }) => {
  const [message, setMessage] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim()) {
      onSend(message);
      setMessage('');
    }  };

  return (
    <div className="input-panel">
    <Form onSubmit={handleSubmit}>
      <div className="d-flex align-items-end">
        <Form.Control
          as="textarea"
          rows={1}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={isDbSelected ? 'Ask the bot...' : 'Please select a database first'}
          disabled={!isDbSelected}
          className="flex-grow-1 me-2"
        />
        <Button type="submit" disabled={!message.trim() || !isDbSelected}>
          <FiSend size={18} />
        </Button>
      </div>
    </Form>
    </div>
  );
};

export default InputPanel;
