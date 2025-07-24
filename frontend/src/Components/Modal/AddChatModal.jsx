import React, { useEffect, useRef, useState } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import "./Modals.css";

const CreateChatModal = ({ show, onHide, onCreate, databases }) => {
  const [chatTitle, setChatTitle] = useState('');
  const [selectedDb, setSelectedDb] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (show) {
      if (inputRef.current) {
        inputRef.current.focus();
      }
      // Reset state when modal opens
      setChatTitle('');
      setSelectedDb(databases.length > 0 ? databases[0].database_id : '');
    }
  }, [show, databases]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const title = chatTitle.trim();
    if (title && selectedDb) {
      onCreate(title, selectedDb);
      onHide();
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered className="custom-modal">
      <Modal.Header>
        <Modal.Title className="custom-modal-title">New Chat</Modal.Title>
      </Modal.Header>
      <Modal.Body className="custom-modal-body">
        <Form onSubmit={handleSubmit}>
          <Form.Group controlId="chatTitle" className="mb-3">
            <Form.Label>Chat Title</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter chat name"
              value={chatTitle}
              onChange={(e) => setChatTitle(e.target.value)}
              ref={inputRef}
              className="custom-modal-input"
            />
          </Form.Group>
          <Form.Group controlId="databaseSelect">
            <Form.Label>Select Database</Form.Label>
            <Form.Select
              value={selectedDb}
              onChange={(e) => setSelectedDb(e.target.value)}
              className="custom-modal-input"
            >
              {databases.map((db) => (
                <option key={db.database_id} value={db.database_id}>
                  {db.database_name}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer className="custom-modal-footer">
        <Button variant="secondary" onClick={onHide} className="modal-btn cancel-btn">
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={handleSubmit}
          disabled={!chatTitle.trim() || !selectedDb}
          className="modal-btn primary-btn"
        >
          Create Chat
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default CreateChatModal;