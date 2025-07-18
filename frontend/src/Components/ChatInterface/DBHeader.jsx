import React from 'react';
import { Dropdown } from 'react-bootstrap';

const Header = ({ databases, selectedDb, onSelectDb, chatName }) => {
  return (
    <div className="app-header">
      <h5 className="chat-title m-0">
        {chatName || 'Infera'}
      </h5>
      <Dropdown onSelect={onSelectDb}>
        <Dropdown.Toggle className="db-dropdown-toggle">
          {selectedDb?.database_name || 'Select Database'}
        </Dropdown.Toggle>
        <Dropdown.Menu className="db-dropdown-menu">
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
