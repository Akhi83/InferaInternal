import React from 'react';
import { Dropdown } from 'react-bootstrap';

const Header = ({ databases, selectedDb, onSelectDb }) => {
  return (
    <div className="d-flex align-items-center justify-content-between px-4 py-2 shadow-sm" style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
      <h5 className="m-0" style={{ color: '#4a5568' }}>Chat Interface</h5>
      <Dropdown onSelect={onSelectDb}>
        <Dropdown.Toggle variant="outline-secondary">
          {selectedDb?.database_name || 'Select Database'}
        </Dropdown.Toggle>
        <Dropdown.Menu>
          {databases.map((db) => (
            <Dropdown.Item key={db.database_id} eventKey={db.database_id}>
              {db.database_name}
            </Dropdown.Item>
          ))}
        </Dropdown.Menu>
      </Dropdown>
    </div>
  );
};

export default Header;