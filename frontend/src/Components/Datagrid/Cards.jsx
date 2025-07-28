import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import './DataCard.css';
import { Plus } from 'lucide-react';

function DataCard({ database_id, database_type, database_name, database_status, created_at, onDelete, onEdit, onAnnotate }) {

  const handleEditCard = () => onEdit(database_id);
  const handleDeleteCard = () => onDelete(database_id);
  const handleAnnotateCard = () => onAnnotate(database_id);


  // const getDBIcon = (database) => {
  //   const icons = {
  //     'MongoDB': '🍃',
  //     'PostgreSQL': '🐘', 
  //     'MySQL': '🐬',
  //     'Redis': '⚡',
  //     'Firebase': '🔥',
  //     'SQLite': '💾',
  //     'Oracle': '🏛️',
  //     'Cassandra': '🗄️'
  //   };
  //   return icons[database] || '💽';
  // };

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

  // const dbIcon = getDBIcon(database_type);
  const syncTime = formatSyncTime(created_at);

  return (
    <div className="data-card-wrapper">
      <Card className="data-card h-100">
        
        {/* Card Header */}
        <div className="card-header-custom justify-space-between">
{/*           
          <div className="db-icon-wrapper">
            <div className="db-icon">
              <span className="icon-emoji">{dbIcon}</span>
            </div>
          </div> */}

          <div className="status-badge-wrapper align-start">
            <div className={`status-badge ${database_status.toLowerCase()}`}>
              <span className="status-text">{database_status}</span>
            </div>
          </div>

          <button className="expandable-button" onClick={handleAnnotateCard}>
            <Plus className='btn-icon-annotate' />
            <span className="btn-text-annotate">Add Description</span>
          </button>
        </div>

        <Card.Body className="card-body-custom">
          <div className="db-info">
            <Card.Title className="db-title">
              <span className="db-name">{database_name}</span>
              <div className="title-underline"></div>
            </Card.Title>

            <Card.Subtitle className="db-subtitle">{database_type}</Card.Subtitle>
          </div>

          <div className="sync-info">
            <div className="sync-item">
              <div className="sync-details">
                <span className="sync-label">Last Synced</span>
                <span className="sync-time">{syncTime}</span>
              </div>
            </div>

            <div className="full-timestamp">{new Date(created_at).toLocaleString()}</div>
          </div>

          <div className="card-actions">
            <Button 
              variant="outline-primary" 
              size="sm" 
              className="action-btn edit-btn"
              onClick={handleEditCard}
            >
              <span className="btn-text">Edit</span>
              <div className="btn-ripple"></div>
            </Button>

            <Button 
              variant="outline-danger" 
              size="sm" 
              className="action-btn remove-btn"
              onClick={handleDeleteCard}
            >
              <span className="btn-text">Remove</span>
              <div className="btn-ripple"></div>
            </Button>
          </div>
        </Card.Body>

        <div className="card-glow-effect"></div>
      </Card>
    </div>
  );
}

export default DataCard;
