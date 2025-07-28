import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import DataCard from './Cards';
import './DBGrid.css';
import DatabaseModal from "../Modal/DatabaseModal";
import AnnotateSchemaModal from "../Modal/DescriptionModal";
import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from "@clerk/clerk-react";
import DeleteModal from '../Modal/deleteModal';


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
  const { getToken } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [cardData, setCardData] = useState([]);
  const [editData, setEditData] = useState(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [databaseToDelete, setDatabaseToDelete] = useState(null);

  // State for the new annotation modal
  const [showAnnotateModal, setShowAnnotateModal] = useState(false);
  const [selectedDatabaseId, setSelectedDatabaseId] = useState(null);

  const fetchDatabases = async () => {
    try {
      const token = await getToken(); 
      const res = await axios.get('/api/databases', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setCardData(res.data);
    } catch (error) {
      console.error("Error fetching databases:", error);
    }
  };

  useEffect(() => {
    fetchDatabases();
  }, []);

  const handleAddDatabase = () => {
    setEditData(null);
    setShowModal(true);
  };

  const handleEditCard = (database_id) => {
    const dbToEdit = cardData.find(db => db.database_id === database_id);
    if (dbToEdit) {
      setEditData(dbToEdit);
      setShowModal(true);
    }
  };

  // Handler to open the new annotation modal
  const handleAnnotateCard = (database_id) => {
    setSelectedDatabaseId(database_id);
    setShowAnnotateModal(true);
  };

  const confirmDeleteCard = (database_id) => {
    setDatabaseToDelete(database_id);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      const token = await getToken();
      await axios.delete(`/api/databases/${databaseToDelete}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setShowDeleteModal(false);
      setDatabaseToDelete(null);
      fetchDatabases();
    } catch (error) {
      console.error("Failed to delete database:", error);
      alert("Failed to delete database. Please try again.");
    }
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
            onDatabaseAdd={fetchDatabases}
            onDatabaseEdit={fetchDatabases}
            mode={editData ? "edit" : "add"}
            initialData={editData}
          />
        )}

        {/* Delete Confirmation Modal */}
        <DeleteModal
          show={showDeleteModal}
          onHide={() => setShowDeleteModal(false)}
          onConfirm={handleDeleteConfirm}
        />

        {/* Render the new Annotate Schema Modal */}
        {selectedDatabaseId && (
            <AnnotateSchemaModal
                show={showAnnotateModal}
                onHide={() => setShowAnnotateModal(false)}
                databaseId={selectedDatabaseId}
            />
        )}


        {/* Header Section */}
        <div className="grid-header">
          <div className="header-content">
            <h2 className="grid-title">Database Connections</h2>
            <p className="grid-subtitle">
              Monitor and manage your database connections in real-time
            </p>
          </div>
          <div className="header-stats">
            <div className="stat-item">
              <span className="stat-number">
                {cardData.filter(db => db.database_status === 'Active').length}
              </span>
              <span className="stat-label">Active</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <span className="stat-number">{cardData.length}</span>
              <span className="stat-label">Total</span>
            </div>
          </div>
        </div>

        {/* Grid Section */}
        <Row xs={1} sm={2} md={2} lg={3} xl={4} className="db-grid g-4">
          {cardData.map((card, index) => (
            <Col key={index} className="grid-col">
              <div className="card-wrapper">
                <DataCard 
                  {...card} 
                  onDelete={() => confirmDeleteCard(card.database_id)} 
                  onEdit={() => handleEditCard(card.database_id)}
                  onAnnotate={() => handleAnnotateCard(card.database_id)} // Pass the handler to the card
                />
              </div>
            </Col>
          ))}
          
          {/* Add Database Card */}
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
