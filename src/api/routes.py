"""
Main routes module - provides sitemap and error handling
Note: Individual route blueprints are registered in app.py
"""
from flask import Blueprint
from api.utils import generate_sitemap, APIException

api = Blueprint('api', __name__)

# Note: CORS is configured globally in app.py


@api.route('/', methods=['GET'])
def sitemap():
    return generate_sitemap(api)


@api.errorhandler(APIException)
def handle_invalid_usage(error):
    return error.to_dict(), error.status_code
