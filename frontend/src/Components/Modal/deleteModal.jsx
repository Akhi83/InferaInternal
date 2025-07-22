import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import './Modals.css'; 

export default function DeleteModal({
  show,
  onHide,
  onConfirm,
  title = "Confirm Delete",
  bodyText = "Are you sure you want to delete this item? This action cannot be undone.",
  confirmText = "Delete"
}) {
  return (
    <Modal show={show} onHide={onHide} centered className="custom-modal">
      <Modal.Header>
        <Modal.Title className="custom-modal-title">{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body className="custom-modal-body">
        {bodyText}
      </Modal.Body>
      <Modal.Footer className="custom-modal-footer">
        <Button variant="secondary" onClick={onHide} className="modal-btn cancel-btn">
          Cancel
        </Button>
        <Button variant="danger" onClick={onConfirm} className="modal-btn danger-btn">
          {confirmText}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
