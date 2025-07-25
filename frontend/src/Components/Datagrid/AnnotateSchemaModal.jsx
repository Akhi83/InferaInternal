import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Accordion, Spinner } from 'react-bootstrap';
import { useAuth } from "@clerk/clerk-react";

function AnnotateSchemaModal({ show, onHide, databaseId }) {
    const [schema, setSchema] = useState({});
    const [loading, setLoading] = useState(false);
    const { getToken } = useAuth();

    // Fetch schema when the modal is shown for a specific database
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

    // Handle input changes and update the state
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

    // Save the updated schema with descriptions
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
            onHide(); // Close modal on success
        } catch (error) {
            console.error("Error saving schema:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal show={show} onHide={onHide} size="lg">
            <Modal.Header closeButton>
                <Modal.Title>Annotate Schema</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {loading ? (
                    <div className="text-center">
                        <Spinner animation="border" />
                        <p>Loading Schema...</p>
                    </div>
                ) : (
                    <Form>
                        <Accordion defaultActiveKey="0">
                            {Object.entries(schema).map(([tableName, tableDetails]) => (
                                <Accordion.Item eventKey={tableName} key={tableName}>
                                    <Accordion.Header>{tableName}</Accordion.Header>
                                    <Accordion.Body>
                                        <Form.Group className="mb-3">
                                            <Form.Label><strong>Table Description</strong></Form.Label>
                                            <Form.Control
                                                type="text"
                                                placeholder={`What is the ${tableName} table about?`}
                                                value={tableDetails.description || ''}
                                                onChange={(e) => handleDescriptionChange(tableName, null, e.target.value)}
                                            />
                                        </Form.Group>
                                        <hr />
                                        <h5>Column Descriptions</h5>
                                        {tableDetails.columns && tableDetails.columns.map(col => (
                                            <Form.Group className="mb-2" key={col.name}>
                                                <Form.Label>{col.name} <small className="text-muted">({col.type})</small></Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    placeholder={`Describe the ${col.name} column...`}
                                                    value={col.description || ''}
                                                    onChange={(e) => handleDescriptionChange(tableName, col.name, e.target.value)}
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
            <Modal.Footer>
                <Button variant="secondary" onClick={onHide}>
                    Close
                </Button>
                <Button variant="primary" onClick={handleSave} disabled={loading}>
                    {loading ? 'Saving...' : 'Save Changes'}
                </Button>
            </Modal.Footer>
        </Modal>
    );
}

export default AnnotateSchemaModal;
