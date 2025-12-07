"""
This module takes care of starting the API Server, Loading the DB and Adding the endpoints
"""
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

from flask import Flask, request, jsonify, url_for, send_from_directory
from flask_migrate import Migrate
from flask_swagger import swagger
from flask_cors import CORS
from api.utils import APIException, generate_sitemap
from api.models import db
from api.routes import api
from api.admin import setup_admin
from api.commands import setup_commands
from flask_jwt_extended import JWTManager
from datetime import timedelta
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from api.mail.mail_config import mail

# from models import Person

ENV = "development" if os.getenv("FLASK_DEBUG") == "1" else "production"
static_file_dir = os.path.join(os.path.dirname(
    os.path.realpath(__file__)), '../public/')
app = Flask(__name__)
app.url_map.strict_slashes = False

# Configure CORS globally for all routes
# Allow both localhost and 127.0.0.1 for development (including port 5174 as fallback)
default_origins = 'http://localhost:5173,http://localhost:5174,http://localhost:3000,http://127.0.0.1:5173,http://127.0.0.1:5174,http://127.0.0.1:3000'
allowed_origins = os.getenv('CORS_ORIGINS', default_origins).split(',')
allowed_origins = [origin.strip() for origin in allowed_origins]  # Remove whitespace

# Configure CORS with more permissive settings for development
# Use a simpler, more direct configuration that applies to all routes
CORS(app, 
     origins=allowed_origins,
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
     allow_headers=["Content-Type", "Authorization", "X-Requested-With"],
     expose_headers=["Content-Type", "Authorization"],
     supports_credentials=True,
     automatic_options=True)  # Automatically handle OPTIONS requests


# Setup the Flask-JWT-Extended extension
jwt_secret_key = os.getenv('JWT_SECRET_KEY')
if not jwt_secret_key:
    raise RuntimeError("JWT_SECRET_KEY environment variable is required and must be set. Please configure it in your .env file.")
app.config['JWT_SECRET_KEY'] = jwt_secret_key
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24)
jwt = JWTManager(app)

# Allow OPTIONS requests to pass through without JWT validation
# Flask-CORS will handle OPTIONS automatically, so we don't need to intercept them

# Setup rate limiting
limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"],
    storage_uri="memory://"
)


# database condiguration
db_url = os.getenv("DATABASE_URL")
if db_url is not None:
    app.config['SQLALCHEMY_DATABASE_URI'] = db_url.replace(
        "postgres://", "postgresql://")
else:
    app.config['SQLALCHEMY_DATABASE_URI'] = "sqlite:////tmp/test.db"

app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
MIGRATE = Migrate(app, db, compare_type=True)
db.init_app(app)

# add the admin
setup_admin(app)

# add the admin
setup_commands(app)

# Import and register all blueprints
from api.auth import auth_bp
from api.users import users_bp
from api.profiles import profiles_bp
from api.games import games_bp
from api.reviews import reviews_bp
from api.matches import matches_bp
from api.chat import chat_bp
from api.settings import settings_bp

# Register main API blueprint
app.register_blueprint(api, url_prefix='/api')

# Register all sub-blueprints
app.register_blueprint(auth_bp, url_prefix='/api')
app.register_blueprint(users_bp, url_prefix='/api')
app.register_blueprint(profiles_bp, url_prefix='/api')
app.register_blueprint(games_bp, url_prefix='/api')
app.register_blueprint(reviews_bp, url_prefix='/api')
app.register_blueprint(matches_bp, url_prefix='/api')
app.register_blueprint(chat_bp, url_prefix='/api')
app.register_blueprint(settings_bp, url_prefix='/api')

# Make limiter available to rate_limiter module
from api.rate_limiter import set_limiter
set_limiter(limiter)

# Note: Rate limits are applied directly in route modules using decorators
# This is the recommended approach as it ensures functions are available

# Handle/serialize errors like a JSON object


@app.errorhandler(APIException)
def handle_invalid_usage(error):
    return jsonify(error.to_dict()), error.status_code

# generate sitemap with all your endpoints


app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 465
app.config['MAIL_USE_SSL'] = True
app.config['MAIL_USERNAME'] = os.getenv("MAIL_USERNAME")
app.config['MAIL_PASSWORD'] = os.getenv("MAIL_PASSWORD")
app.config['MAIL_DEFAULT_SENDER'] = os.getenv("MAIL_USERNAME")



mail.init_app(app)  # Inicializa mail con la aplicación


@app.route('/')
def sitemap():
    if ENV == "development":
        return generate_sitemap(app)
    return send_from_directory(static_file_dir, 'index.html')

# any other endpoint will try to serve it like a static file


@app.route('/<path:path>', methods=['GET'])
def serve_any_other_file(path):
    if not os.path.isfile(os.path.join(static_file_dir, path)):
        path = 'index.html'
    response = send_from_directory(static_file_dir, path)
    response.cache_control.max_age = 0  # avoid cache memory
    return response


# this only runs if `$ python src/main.py` is executed
if __name__ == '__main__':
    PORT = int(os.environ.get('PORT', 3001))
    # Only enable debug mode if explicitly set in environment
    debug_mode = os.getenv('FLASK_DEBUG') == '1'
    # Use 127.0.0.1 instead of 0.0.0.0 for better browser compatibility
    app.run(host='127.0.0.1', port=PORT, debug=debug_mode)
