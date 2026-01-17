# from flask import Flask, request, jsonify
# from flask_cors import CORS
# from routes.predict import predict_bp
# import os
# import logging

# # Set up logging
# logging.basicConfig(level=logging.DEBUG)
# logger = logging.getLogger(__name__)

# app = Flask(__name__)
# CORS(app)  # Enable CORS for frontend communication

# # Register blueprints
# try:
#     app.register_blueprint(predict_bp, url_prefix='/api/ml')
#     logger.info("Blueprints registered successfully")
# except Exception as e:
#     logger.error(f"Failed to register blueprints: {e}")

# @app.route('/health')
# def health_check():
#     return jsonify({"status": "healthy", "service": "ml-backend"})

# if __name__ == '__main__':
#     port = int(os.environ.get('PORT', 5001))
#     logger.info(f"Starting server on port {port}")
#     try:
#         app.run(host='0.0.0.0', port=port, debug=True)
#     except Exception as e:
#         logger.error(f"Server failed to start: {e}")

from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import logging
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Set up logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Enhanced CORS configuration
CORS(app, resources={
    r"/api/*": {
        "origins": ["http://localhost:8080", "http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:8080"],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization", "X-Requested-With"]
    }
})

# Add CORS headers for all routes
@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    response.headers.add('Access-Control-Allow-Credentials', 'true')
    return response

# Import and register blueprints
try:
    from routes.predict import predict_bp
    app.register_blueprint(predict_bp, url_prefix='/api/ml')
    logger.info("✅ Blueprints registered successfully")
except ImportError as e:
    logger.error(f"❌ Failed to import blueprints: {e}")
    # Create a dummy blueprint for testing
    from flask import Blueprint
    predict_bp = Blueprint('predict', __name__)
    
    @predict_bp.route('/health')
    def ml_health():
        return jsonify({"status": "ml-module-not-loaded", "error": "Prediction module not available"})
    
    app.register_blueprint(predict_bp, url_prefix='/api/ml')
    logger.warning("⚠️  Using fallback blueprint - ML module may not be properly loaded")

# Health check endpoints
@app.route('/health')
def health_check():
    return jsonify({
        "status": "healthy", 
        "service": "ml-backend",
        "timestamp": "2024-01-01T00:00:00Z"  # You might want to use actual timestamp
    })

@app.route('/api/health')
def api_health_check():
    return jsonify({
        "status": "healthy", 
        "service": "Manufacturing Demand Forecasting API",
        "version": "1.0.0",
        "timestamp": "2024-01-01T00:00:00Z"
    })

@app.route('/api/test')
def api_test():
    """Test endpoint to verify basic functionality"""
    return jsonify({
        "message": "API is working!",
        "endpoint": "/api/test",
        "success": True
    })

@app.route('/api/ml/test-connection')
def ml_test_connection():
    """Test ML module connection"""
    return jsonify({
        "message": "ML module is accessible",
        "status": "connected",
        "endpoint": "/api/ml/test-connection"
    })

# Root endpoint
@app.route('/')
def home():
    return jsonify({
        'message': 'Manufacturing Demand Forecasting API',
        'version': '1.0.0',
        'status': 'operational',
        'endpoints': {
            'root': '/',
            'health': '/health',
            'api_health': '/api/health',
            'api_test': '/api/test',
            'ml_endpoints': {
                'test_sample': '/api/ml/test-sample (GET)',
                'batch_predict': '/api/ml/batch-predict (POST)',
                'explain': '/api/ml/explain (POST)',
                'save_analysis': '/api/ml/save-analysis (POST)',
                'recent_sessions': '/api/ml/recent-sessions (GET)',
                'session': '/api/ml/session/<session_id> (GET)',
                'health': '/api/ml/health (GET)'
            }
        },
        'documentation': 'See / endpoint for available endpoints'
    })

# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({
        "error": "Endpoint not found",
        "message": "The requested endpoint does not exist",
        "status_code": 404
    }), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({
        "error": "Internal server error",
        "message": "An unexpected error occurred",
        "status_code": 500
    }), 500

@app.errorhandler(405)
def method_not_allowed(error):
    return jsonify({
        "error": "Method not allowed",
        "message": "The HTTP method is not supported for this endpoint",
        "status_code": 405
    }), 405

if __name__ == '__main__':
    # Use PORT from environment or default to 5000
    port = int(os.environ.get('PORT_ml', 5001))
    
    logger.info("=" * 60)
    logger.info("🚀 Starting Manufacturing Demand Forecasting API")
    logger.info("=" * 60)
    logger.info(f"📍 Port: {port}")
    logger.info(f"🌐 Local URL: http://localhost:{port}")
    logger.info(f"🌐 Network URL: http://0.0.0.0:{port}")
    logger.info(f"✅ Health check: http://localhost:{port}/api/health")
    logger.info(f"🔧 Debug mode: {True}")
    logger.info("=" * 60)
    
    try:
        app.run(
            host='0.0.0.0', 
            port=port, 
            debug=True,
            threaded=True  # Enable threading for better performance
        )
    except Exception as e:
        logger.error(f"❌ Server failed to start: {e}")
        logger.error("💡 Possible solutions:")
        logger.error("1. Check if port %s is already in use", port)
        logger.error("2. Try using a different port: PORT=5001 python app.py")
        logger.error("3. Check firewall settings")
        raise
