import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
import { useState, useEffect } from 'react';
import './DatabaseModal.css';
import axios from 'axios';

export default function DatabaseModal({ 
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
  const [error, setError] = useState(null);


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
      setError("All fields are required.");
      return;
    }

    const patterns = {
      PostgreSQL: /^(postgres(ql)?):\/\/[^:]+:[^@]+@[^:]+:\d+\/[\w\-]+$/i,
      MySQL: /^(mysql(\+\w+)?):\/\/[^:]+:[^@]+@[^:]+:\d+\/[\w\-]+$/i,
      SQLite: /^sqlite:\/\/\/.+\.sqlite$/i
    };

    const pattern = patterns[database_type];
    if (pattern && !pattern.test(database_string)) {      
      setError(`${database_type} connection string format.`);
      return;
    }

setError(null); // clear previous error
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
    const responseError = error?.response?.data;
    const statusCode = error?.response?.status;

    let message = "Something went wrong. Please try again.";

    if (statusCode === 400 && responseError?.error === "Connection failed") {
      message = "Please recheck your connection string.";
    } else if (statusCode === 400 && responseError?.error?.includes("Missing fields")) {
      message = "Missing required fields.";
    } else if (statusCode === 500) {
      message = "Internal server error. Try again later.";
    } else if (responseError?.error) {
      message = `${responseError.error}`;
    }

    setError(message);
    console.error("Database submission error:", error);
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
          {error && (
            <div className="text-danger mb-3" style={{ fontWeight: 'bold' }}>
              {error}
            </div>
          )}
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
                placeholder="Enter Your Database Name"
                required
                className="custom-input"
              />
            </div>
          </div>

          <div className="button-container">
            <Button variant="secondary" onClick={onHide} className="btn-cancel modal-btn">Cancel</Button>
            <Button onClick={handleSubmit} className="btn-connect modal-btn">
              {mode === "edit" ? "Save Changes" : "Connect Database"}
            </Button>
          </div>
        </Modal.Body>
      </div>
    </Modal>
  );
}
