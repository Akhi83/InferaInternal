// DBGrid.js
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import DataCard from './Cards';
import './DBGrid.css';
import DatabaseModal from "../Modal/DatabaseModal";
import DeleteModal from '../Modal/deleteModal';
import { useEffect } from 'react';
import { useAuth } from "@clerk/clerk-react";
import useDatabaseStore from '../../store/useDatabaseStore';

function AddDatabaseCard({ onAddDatabase }) {
  return (
    <div className="add-database-card h-100" onClick={onAddDatabase}>
      <div className="add-card-content">
        <div className="add-icon-wrapper">
          <div className="add-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 8v8"/>
              <path d="M8 12h8"/>
            </svg>
          </div>
        </div>
        <h5 className="add-title">Add New Database</h5>
        <p className="add-description">
          Connect a new database to your dashboard and start monitoring its performance.
        </p>
        <button className="add-database-btn" aria-label="Add new database connection">
          <span className="btn-text">Connect Database</span>
          <div className="btn-shine"></div>
        </button>
      </div>
      <div className="card-glow"></div>
    </div>
  );
}

function DBGrid() {
  const { isLoaded, getToken } = useAuth();

  const {
    databases,
    showModal,
    showDeleteModal,
    editData,
    fetchDatabases,
    setShowModal,
    setEditData,
    setShowDeleteModal,
    setDatabaseToDelete,
    deleteDatabase,
  } = useDatabaseStore();

  useEffect(() => {
    if (!isLoaded) return;
    (async () => {
      const token = await getToken();
      fetchDatabases(token);
    })();
  }, []);

  const handleAddDatabase = () => {
    setEditData(null);
    setShowModal(true);
  };

  const handleEditCard = (database_id) => {
    const dbToEdit = databases.find(db => db.database_id === database_id);
    if (dbToEdit) {
      setEditData(dbToEdit);
      setShowModal(true);
    }
  };

  const confirmDeleteCard = (database_id) => {
    setDatabaseToDelete(database_id);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    const token = await getToken();
    deleteDatabase(token);
  };

  return (
    <div className="db-grid-wrapper">
      <Container className="db-grid-container">
        {showModal && (
          <DatabaseModal
            show={showModal}
            onHide={() => {
              setShowModal(false);
              setEditData(null);
            }}
            onDatabaseAdd={async () => {
              const token = await getToken();
              fetchDatabases(token);
            }}
            onDatabaseEdit={async () => {
              const token = await getToken();
              fetchDatabases(token);
            }}
            mode={editData ? "edit" : "add"}
            initialData={editData}
          />
        )}

        <DeleteModal
          show={showDeleteModal}
          onHide={() => setShowDeleteModal(false)}
          onConfirm={handleDeleteConfirm}
        />

        {/* Header */}
        <div className="grid-header">
          <div className="header-content">
            <h2 className="grid-title">Database Connections</h2>
            <p className="grid-subtitle">Monitor and manage your database connections in real-time</p>
          </div>
          <div className="header-stats">
            <div className="stat-item">
              <span className="stat-number">
                {databases.filter(db => db.database_status === 'Active').length}
              </span>
              <span className="stat-label">Active</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <span className="stat-number">{databases.length}</span>
              <span className="stat-label">Total</span>
            </div>
          </div>
        </div>

        {/* Grid */}
        <Row xs={1} sm={2} md={2} lg={3} xl={4} className="db-grid g-4">
          {databases.map((card, index) => (
            <Col key={index} className="grid-col">
              <div className="card-wrapper">
                <DataCard
                  {...card}
                  onDelete={() => confirmDeleteCard(card.database_id)}
                  onEdit={() => handleEditCard(card.database_id)}
                />
              </div>
            </Col>
          ))}
          <Col className="grid-col">
            <div className="card-wrapper add-card-wrapper">
              <AddDatabaseCard onAddDatabase={handleAddDatabase} />
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
}

export default DBGrid;
