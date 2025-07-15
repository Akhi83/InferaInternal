import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
import { useState, useEffect } from 'react';
import './Modal.css';
import axios from 'axios';

export default function AddDatabaseModal({ 
  show, 
  onHide, 
  onDatabaseAdd, 
  onDatabaseEdit, 
  mode = "add", 
  initialData = {} 
}) {
  const [formData, setFormData] = useState({
    database_type: '',
    database_string: '',
    database_name: ''
  });

  useEffect(() => {
    if (mode === "edit" && initialData) {
      setFormData(initialData);
    } else {
      setFormData({
        database_type: '',
        database_string: '',
        database_name: ''
      });
    }
  }, [mode, initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { database_type, database_string, database_name } = formData;

    if (!database_type || !database_string || !database_name) {
      alert("All fields are required.");
      return;
    }

    const patterns = {
      PostgreSQL: /^(postgres(ql)?):\/\/[^:]+:[^@]+@[^:]+:\d+\/[\w\-]+$/i,
      MySQL: /^(mysql(\+\w+)?):\/\/[^:]+:[^@]+@[^:]+:\d+\/[\w\-]+$/i,
      SQLite: /^sqlite:\/\/\/.+\.sqlite$/i
    };

    const pattern = patterns[database_type];
    if (pattern && !pattern.test(database_string)) {
      alert(`Invalid ${database_type} connection string format.`);
      return;
    }

    try {
      const token = await window.Clerk?.session?.getToken();

      if (mode === "edit") {
        await axios.put(
          `/api/databases/${initialData.database_id}`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        onDatabaseEdit?.();
      } else {
        await axios.post(
          '/api/databases',
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        onDatabaseAdd?.();
      }

      onHide();
    } catch (error) {
      console.error('Error submitting database:', error.response?.data || error.message);
      alert("Failed: " + (error.response?.data?.error || error.message));
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered backdrop="static" className="custom-modal">
      <div className="modal-content-wrapper">
        <Modal.Header className="custom-header">
          <Modal.Title className="d-flex align-items-center gap-2">
            <span style={{ fontSize: '1.5rem' }}></span>
            <span className="modal-title-text">
              {mode === "edit" ? "Edit Database" : "Add New Database"}
            </span>
          </Modal.Title>
        </Modal.Header>

        <Modal.Body className="custom-body">
          <div className="form-container">
            <div className="form-group">
              <Form.Label className="custom-label">
                Database Type
              </Form.Label>
              <Form.Select
                name="database_type"
                value={formData.database_type}
                onChange={handleChange}
                required
                className="custom-input"
              >
                <option value="">-- Select Database Type --</option>
                <option value="PostgreSQL">PostgreSQL</option>
                <option value="MySQL">MySQL</option>
                <option value="SQLite">SQLite</option>
              </Form.Select>
            </div>

            <div className="form-group">
              <Form.Label className="custom-label">Connection String</Form.Label>
              <Form.Control
                type="text"
                name="database_string"
                value={formData.database_string}
                onChange={handleChange}
                placeholder="e.g. postgresql://user:pass@host:port/db"
                required
                className="custom-input"
              />
            </div>

            <div className="form-group">
              <Form.Label className="custom-label">Database Name</Form.Label>
              <Form.Control
                type="text"
                name="database_name"
                value={formData.database_name}
                onChange={handleChange}
                placeholder="My Database"
                required
                className="custom-input"
              />
            </div>
          </div>

          <div className="button-container">
            <Button variant="secondary" onClick={onHide} className="btn-cancel">Cancel</Button>
            <Button onClick={handleSubmit} className="btn-cancel">
              {mode === "edit" ? "Save Changes" : "Connect Database"}
            </Button>
          </div>
        </Modal.Body>
      </div>
    </Modal>
  );
}
