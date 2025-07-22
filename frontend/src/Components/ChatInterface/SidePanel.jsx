import React from 'react';
import { FiMenu, FiX, FiPlus, FiTrash2 } from 'react-icons/fi';
import './SidePanel.css';
import DeleteModal from '../Modal/deleteModal';

const SidePanel = ({ chats, onSelectChat, onNewChat, onDeleteChat, activeChatId }) => {
  const [collapsed, setCollapsed] = React.useState(false);
  const [showDeleteModal, setShowDeleteModal] = React.useState(false);
  const [chatToDelete, setChatToDelete] = React.useState(null);

  React.useEffect(() => {
    if (chats.length === 0) {
      setCollapsed(true);
    }
  }, [chats]);

  const handleDeleteClick = (chat_id) => {
    setChatToDelete(chat_id);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    onDeleteChat(chatToDelete);
    setShowDeleteModal(false);
    setChatToDelete(null);
  };

  if (collapsed) {
    return (
      <div className="side-panel collapsed">
        {chats.length > 0 && (
          <button className="toggle-btn" onClick={() => setCollapsed(false)}>
            <FiMenu />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="side-panel">
      <div className="side-panel-header">
        <h5 className="panel-title">Chats</h5>
        <button className="toggle-btn" onClick={() => setCollapsed(true)}>
          <FiX />
        </button>
      </div>

      <button className="new-chat-btn" onClick={onNewChat}>
        <FiPlus className="btn-icon" />
        <span className="btn-text">New Chat</span>
      </button>

      <div className="chat-list">
        {chats.map((chat) => (
          <div
            key={chat.chat_id}
            className={`chat-item ${chat.chat_id === activeChatId ? 'active' : ''}`}
          >
            <div
              className="chat-info"
              onClick={() => onSelectChat(chat.chat_id)}
              title={chat.title}
            >
              <div className="chat-title">
                {chat.title || `Chat ${chat.chat_id.slice(0, 6)}`}
              </div>
            </div>
            <button
              className="delete-icon"
              onClick={() => handleDeleteClick(chat.chat_id)}
              title="Delete chat"
            >
              <FiTrash2 size={14} />
            </button>
          </div>
        ))}
      </div>

      <DeleteModal
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Chat"
        bodyText="Are you sure you want to delete this chat? This cannot be undone."
        confirmText="Delete Chat"
      />
    </div>
  );
};

export default SidePanel;
