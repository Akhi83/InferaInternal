/*

import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';

function DataCard({ database_type, database_name, Status, created_at }) {
  return (
    <Card style={{ width: '18rem' }} className="mb-3 shadow-sm">
      <Card.Body>
        <Card.Title>
          {database_type}
        </Card.Title>
        <Card.Subtitle className="mb-2 text-muted">{database_name}</Card.Subtitle>
        <Card.Text>Status: {Status}</Card.Text>
        <Card.Text>Last Synced: {created_at}</Card.Text>
        <div className="d-flex gap-2">
          <Button variant="primary" size="sm">Edit</Button>
          <Button variant="danger" size="sm">Remove</Button>
        </div>
      </Card.Body>
    </Card>
  );
}

export default DataCard;

*/

import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import './DataCard.css'; // Custom CSS file

function DataCard({ database_id, database_type, database_name, created_at, onDelete, onEdit }) {

  const handleEditCard = () => {
    onEdit(database_id);
  }

  const handleDeleteCard = () => {
    onDelete(database_id);
  }


  // Default icons and colors if not provided
  const getDBIcon = (database) => {
    const icons = {
      'MongoDB': '🍃',
      'PostgreSQL': '🐘', 
      'MySQL': '🐬',
      'Redis': '⚡',
      'Firebase': '🔥',
      'SQLite': '💾',
      'Oracle': '🏛️',
      'Cassandra': '🗄️'
    };
    return icons[database] || '💽';
  };

  const getDBColor = (database) => {
    const colors = {
      'MongoDB': '#47A248',
      'PostgreSQL': '#336791',
      'MySQL': '#00758F', 
      'Redis': '#DC382D',
      'Firebase': '#FFCA28',
      'SQLite': '#003B57',
      'Oracle': '#F80000',
      'Cassandra': '#1287B1'
    };
    return colors[database] || '#667eea';
  };

  const getStatusColor = () => {
    return '#10b981';
  };

  const formatSyncTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const dbIcon = getDBIcon(database_type);
  const dbColor = getDBColor(database_type);
  const statusColor = getStatusColor();
  const syncTime = formatSyncTime(created_at);

  return (
    <div className="data-card-wrapper">
      <Card className="data-card h-100">
        {/* Card Header with Icon and Status */}
        <div className="card-header-custom">
          <div className="db-icon-wrapper">
            <div 
              className="db-icon"
              style={{ backgroundColor: dbColor }}
            >
              <span className="icon-emoji">{dbIcon}</span>
            </div>
            <div className="connection-pulse" style={{ borderColor: dbColor }}></div>
          </div>
          
          <div className="status-badge-wrapper">
            <div 
              className={`status-badge ${"active"}`}
              style={{ backgroundColor: statusColor }}
            >
              <div className="status-dot"></div>
              <span className="status-text">{"Active"}</span>
            </div>
          </div>
        </div>

        <Card.Body className="card-body-custom">
          {/* database_type Info */}
          <div className="db-info">
            <Card.Title className="db-title">
              <span className="db-name">{database_type}</span>
              <div className="title-underline" style={{ backgroundColor: dbColor }}></div>
            </Card.Title>
            
            <Card.Subtitle className="db-subtitle">
              <span className="db-instance-icon">🗂️</span>
              {database_name}
            </Card.Subtitle>
          </div>

          {/* Sync Information */}
          <div className="sync-info">
            <div className="sync-item">
              <span className="sync-icon">🔄</span>
              <div className="sync-details">
                <span className="sync-label">Last Synced</span>
                <span className="sync-time">{syncTime}</span>
              </div>
            </div>
            
            <div className="full-timestamp">
              {new Date(created_at).toLocaleString()}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="card-actions">
            <Button 
              variant="outline-primary" 
              size="sm" 
              className="action-btn edit-btn"
              onClick={handleEditCard}
            >
              <span className="btn-icon">✏️</span>
              <span className="btn-text">Edit</span>
              <div className="btn-ripple"></div>
            </Button>
            
            <Button 
              variant="outline-danger" 
              size="sm" 
              className="action-btn remove-btn"
              onClick={handleDeleteCard}
            >
              <span className="btn-icon">🗑️</span>
              <span className="btn-text">Remove</span>
              <div className="btn-ripple"></div>
            </Button>
          </div>
        </Card.Body>

        {/* Hover Glow Effect */}
        <div className="card-glow-effect" style={{ backgroundColor: dbColor }}></div>
      </Card>
    </div>
  );
}

export default DataCard;
