"""
This module takes care of starting the API Server, Loading the DB and Adding the endpoints
"""
import logging
import os
from dotenv import load_dotenv

_app_logger = logging.getLogger(__name__)

# Cargar .env desde la raíz del repo (no depender del cwd de Flask / IDE).
_project_root = os.path.dirname(os.path.dirname(os.path.realpath(__file__)))
load_dotenv(os.path.join(_project_root, ".env"))
load_dotenv(os.path.join(_project_root, ".env.local"), override=True)

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
# Allow both localhost and 127.0.0.1 for development (including port 5174 as fallback).
# CORS_ORIGINS en .env se une a esta lista (no la sustituye), para no bloquear 127.0.0.1 si solo pusiste localhost.
default_origins = 'http://localhost:5173,http://localhost:5174,http://localhost:3000,http://127.0.0.1:5173,http://127.0.0.1:5174,http://127.0.0.1:3000'
_default_list = [o.strip() for o in default_origins.split(',') if o.strip()]
_env_extra = [o.strip() for o in (os.getenv('CORS_ORIGINS') or '').split(',') if o.strip()]
allowed_origins = list(dict.fromkeys(_default_list + _env_extra))

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
# En desarrollo, los límites globales (50/h) sumaban con todas las rutas y agotaban la cuota
# rápido (onboarding con autoguardado, reintentos de login, etc.) → 429 en /api/private.
# Los @limit por ruta (login, etc.) siguen activos; solo quitamos el tope global en dev.
limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    default_limits=[] if ENV == "development" else ["200 per day", "50 per hour"],
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
# Usuario SMTP: MAIL_USERNAME; si solo definiste MAIL_DEFAULT_SENDER (mismo buzón), úsalo aquí también.
_mail_user = (
    (os.getenv("MAIL_USERNAME") or os.getenv("MAIL_DEFAULT_SENDER") or "").strip() or None
)
_mail_pass = (os.getenv("MAIL_PASSWORD") or "").strip() or None
app.config['MAIL_USERNAME'] = _mail_user
app.config['MAIL_PASSWORD'] = _mail_pass
# Remitente "From": MAIL_DEFAULT_SENDER si existe; si no, la misma cuenta SMTP.
_default_sender = (
    (os.getenv("MAIL_DEFAULT_SENDER") or _mail_user or "").strip() or None
)
app.config['MAIL_DEFAULT_SENDER'] = _default_sender
if not _mail_user or not _mail_pass:
    _app_logger.warning(
        "Flask-Mail: faltan credenciales SMTP (MAIL_USERNAME o MAIL_DEFAULT_SENDER + MAIL_PASSWORD). "
        "Los correos no se enviarán. Gmail suele exigir contraseña de aplicación, no la contraseña de la cuenta."
    )



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
