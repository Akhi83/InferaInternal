import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Accordion, Spinner } from 'react-bootstrap';
import { useAuth } from "@clerk/clerk-react";
import "./DescriptionModal.css";

function AnnotateSchemaModal({ show, onHide, databaseId }) {
    const [schema, setSchema] = useState({});
    const [loading, setLoading] = useState(false);
    const { getToken } = useAuth();

    useEffect(() => {
        if (show && databaseId) {
            const fetchSchema = async () => {
                setLoading(true);
                try {
                    const token = await getToken();
                    const response = await fetch(`/api/databases/${databaseId}/schema`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });

                    if (!response.ok) {
                        throw new Error('Failed to fetch schema');
                    }

                    const data = await response.json();
                    setSchema(data);
                } catch (error) {
                    console.error("Error fetching schema:", error);
                } finally {
                    setLoading(false);
                }
            };
            fetchSchema();
        }
    }, [show, databaseId, getToken]);

    const handleDescriptionChange = (tableName, columnName, value) => {
        const newSchema = { ...schema };
        if (columnName) {
            // Ensure columns array exists
            if (!newSchema[tableName].columns) {
                newSchema[tableName].columns = [];
            }
            const column = newSchema[tableName].columns.find(c => c.name === columnName);
            if (column) {
                column.description = value;
            }
        } else {
            newSchema[tableName].description = value;
        }
        setSchema(newSchema);
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            const token = await getToken();
            await fetch(`/api/databases/${databaseId}/schema`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(schema)
            });
            onHide();
        } catch (error) {
            console.error("Error saving schema:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal show={show} onHide={onHide} size="lg" dialogClassName="annotate-modal">
        <Modal.Header className="annotate-header">
            <Modal.Title className="annotate-title">Add Descriptions to Schema</Modal.Title>
        </Modal.Header>
        <Modal.Body className="annotate-body">
            {loading ? (
            <div className="annotate-loading">
                <Spinner animation="border" />
                <p>Loading Schema...</p>
            </div>
            ) : (
            <Form className="annotate-form">
                <Accordion defaultActiveKey="0" className="annotate-accordion">
                {Object.entries(schema).map(([tableName, tableDetails]) => (
                    <Accordion.Item eventKey={tableName} key={tableName} className="annotate-accordion-item">
                    <Accordion.Header className="annotate-accordion-header">
                        {tableName}
                    </Accordion.Header>
                    <Accordion.Body className="annotate-accordion-body">
                        <Form.Group className="table-description-group">
                        <Form.Label className="form-label-strong">Table Description</Form.Label>
                        <Form.Control
                            type="text"
                            placeholder={`What is the ${tableName} table about?`}
                            value={tableDetails.description || ''}
                            onChange={(e) => handleDescriptionChange(tableName, null, e.target.value)}
                            className="annotate-input"
                        />
                        </Form.Group>
                        <hr />
                        <h5 className="column-description-heading">Column Descriptions</h5>
                        {tableDetails.columns?.map(col => (
                        <Form.Group className="column-description-group" key={col.name}>
                            <Form.Label className="form-label">
                            {col.name} : <small className="text-muted">({col.type})</small>
                            </Form.Label>
                            <Form.Control
                            type="text"
                            placeholder={`Describe the ${col.name} column...`}
                            value={col.description || ''}
                            onChange={(e) => handleDescriptionChange(tableName, col.name, e.target.value)}
                            className="annotate-input"
                            />
                        </Form.Group>
                        ))}
                    </Accordion.Body>
                    </Accordion.Item>
                ))}
                </Accordion>
            </Form>
            )}
        </Modal.Body>
        <Modal.Footer className="annotate-footer">
            <Button variant="secondary" onClick={onHide} className="annotate-close-btn">
            Close
            </Button>
            <Button variant="primary" onClick={handleSave} disabled={loading} className="annotate-save-btn">
            {loading ? 'Saving...' : 'Save Changes'}
            </Button>
        </Modal.Footer>
        </Modal>
    );
}

export default AnnotateSchemaModal;
