from app import db
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime

class DatabaseConnection(db.Model):
    __tablename__ = 'Databases' 

    database_id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = db.Column(db.String, nullable=False)
    database_name = db.Column(db.String, nullable=False)
    database_string = db.Column(db.String)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    database_type = db.Column(db.String)
    database_status = db.Column(db.String)
    database_schema_json = db.Column(db.String)

    def to_dict(self, include_string=False):
        data =  {
            "database_id": str(self.database_id),
            "database_name": self.database_name,
            "database_type": self.database_type,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "database_status": self.database_status
        }
    
        if include_string:
            data["database_string"] = self.database_string

        return data
    

