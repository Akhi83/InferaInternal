import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import './deleteModal.css';

export default function DeleteModal({
  show,
  onHide,
  onConfirm,
  title = "Confirm Delete",
  bodyText = "Are you sure you want to delete this item? This action cannot be undone.",
  confirmText = "Delete"
}) {
  return (
    <Modal show={show} onHide={onHide} centered className="delete-modal">
      <Modal.Header>
        <Modal.Title className="delete-modal-title">{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body className="delete-modal-body">
        {bodyText}
      </Modal.Body>
      <Modal.Footer className="delete-modal-footer">
        <Button variant="secondary" onClick={onHide} className="modal-btn cancel-btn">
          Cancel
        </Button>
        <Button variant="danger" onClick={onConfirm} className="modal-btn delete-btn">
          {confirmText}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
