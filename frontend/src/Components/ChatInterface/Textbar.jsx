import React, { useState } from 'react';
import { Form, InputGroup, Button } from 'react-bootstrap';

const InputPanel = ({ onSend }) => {
  const [text, setText] = useState('');

  const handleSend = () => {
    if (text.trim()) {
      onSend(text);
      setText('');
    }
  };

  return (
    <Form className="p-3 border-top">
      <InputGroup>
      <Button variant="outline-secondary" >Voice</Button>
        <Form.Control
          type="text"
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Ask the bot..."
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
        />

        <Button variant="primary" onClick={handleSend}>
          Send
        </Button>
      </InputGroup>
    </Form>
  );
};

export default InputPanel;
