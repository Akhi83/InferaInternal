import React from 'react';
import './DBHeader.css';

const Header = ({ selectedDbName, chatName }) => {
  return (
    <div className="app-header d-flex justify-content-between align-items-center px-3 py-2">
      <h5 className="chat-title m-0">
        {chatName || 'Infera'}
      </h5>
      <div className="connected-db px-3 py-2">
        {selectedDbName}
      </div>
    </div>
  );
};

export default Header;