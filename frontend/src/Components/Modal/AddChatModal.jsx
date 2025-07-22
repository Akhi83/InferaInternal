import React, { useEffect, useRef } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import "./Modals.css"; 

const CreateChatModal = ({ show, onHide, onCreate, chatTitle, setChatTitle }) => {
  const inputRef = useRef(null);

  useEffect(() => {
    if (show && inputRef.current) {
      inputRef.current.focus();
    }
  }, [show]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const title = chatTitle.trim();
    if (title) {
      onCreate(title);
      setChatTitle('');
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
          <Form.Group controlId="chatTitle">
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
        </Form>
      </Modal.Body>
      <Modal.Footer className="custom-modal-footer">
        <Button variant="secondary" onClick={onHide} className="modal-btn cancel-btn">
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={handleSubmit}
          disabled={!chatTitle.trim()}
          className="modal-btn primary-btn"
        >
          Create Chat
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default CreateChatModal;
