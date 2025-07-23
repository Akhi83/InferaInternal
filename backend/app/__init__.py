from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from config import Config
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

db = SQLAlchemy()
limiter = Limiter(key_func=get_remote_address) 

def create_app():
    app = Flask(__name__)
    app.config['SQLALCHEMY_DATABASE_URI'] = Config.DATABASE_URL
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    db.init_app(app)
    limiter.init_app(app)  
    CORS(app)


    from app.routes.databases import database_bp
    from app.routes.prompt_response import llm_bp
    from app.routes.handle_chats import chat_bp
    from app.routes.api_keys import api_key_bp

    app.register_blueprint(database_bp)
    app.register_blueprint(llm_bp)
    app.register_blueprint(chat_bp)
    app.register_blueprint(api_key_bp)

    return app
