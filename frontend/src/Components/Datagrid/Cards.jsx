import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import './DataCard.css'; // Custom CSS file

function DataCard({ database_id, database_type, database_name, database_status, created_at, onDelete, onEdit }) {

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

const getStatusColor = (status) => {
  if (status === "Active") return "#10b981";    // Green
  if (status === "Inactive") return "#ef4444";  // Red
  return "#d1d5db"; // Gray for unknown
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
  const statusColor = getStatusColor(database_status);
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
            <div  style={{ borderColor: dbColor }}></div>
          </div>
          
          <div className="status-badge-wrapper">
            <div 
              className={`status-badge ${database_status.toLowerCase()}`}
              style={{ backgroundColor: statusColor }}
            >
              <div className="status-dot"></div>
              <span className="status-text">{database_status}</span>
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
              {/* <span className="db-instance-icon">🗂️</span> */}
              {database_name}
            </Card.Subtitle>
          </div>

          {/* Sync Information */}
          <div className="sync-info">
            <div className="sync-item">
              {/* <span className="sync-icon">🔄</span> */}
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
              {/* <span className="btn-icon">✏️</span> */}
              <span className="btn-text">Edit</span>
              <div className="btn-ripple"></div>
            </Button>
            
            <Button 
              variant="outline-danger" 
              size="sm" 
              className="action-btn remove-btn"
              onClick={handleDeleteCard}
            >
              {/* <span className="btn-icon">🗑️</span> */}
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
