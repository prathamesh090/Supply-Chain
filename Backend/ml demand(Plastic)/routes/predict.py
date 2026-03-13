from flask import Blueprint, request, jsonify
from services.prediction_service import PredictionService
import traceback
import uuid
from datetime import datetime
from services.database_service import db_service
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

predict_bp = Blueprint('predict', __name__)
prediction_service = PredictionService()

@predict_bp.route('/test-sample', methods=['GET'])
def test_sample():
    """Test endpoint with sample data"""
    try:
        sample_data = [
            {
                "product_id": "P001",
                "dt": "01-04-2023",
                "sale_amount": 100.0,
                "discount": 0.1,
                "holiday_flag": 0,
                "precpt": 0.5,
                "Plastic_Type": "PET",
                "quantity": 500,
                "year": 2023,
                "month": 4,
                "day": 1,
                "week_of_year": 13,
                "is_weekend": 0,
                "product_type": "Bottle",
                "application_segment": "Packaging"
            },
            {
                "product_id": "P002", 
                "dt": "01-04-2023",
                "sale_amount": 150.0,
                "discount": 0.2,
                "holiday_flag": 0,
                "precpt": 0.3,
                "Plastic_Type": "HDPE",
                "quantity": 300,
                "year": 2023,
                "month": 4,
                "day": 1,
                "week_of_year": 13,
                "is_weekend": 0,
                "product_type": "Container",
                "application_segment": "Packaging"
            }
        ]
        
        results = prediction_service.batch_predict(sample_data)
        return jsonify({
            "status": "success",
            "predictions": results,
            "message": "Sample prediction successful"
        })
    except Exception as e:
        logger.error(f"❌ Test sample failed: {str(e)}")
        return jsonify({"error": str(e), "trace": traceback.format_exc()}), 500

@predict_bp.route('/test-product-ids', methods=['GET'])
def test_product_ids():
    """Test endpoint to verify product ID handling"""
    try:
        sample_data = [
            {
                "product_id": "P001",
                "sale_amount": 100.0,
                "discount": 0.1,
                "Plastic_Type": "PET"
            },
            {
                "product_id": "P002", 
                "sale_amount": 150.0,
                "discount": 0.2,
                "Plastic_Type": "HDPE"
            },
            {
                "product_id": "P003",
                "sale_amount": 80.0,
                "discount": 0.15,
                "Plastic_Type": "PP"
            }
        ]
        
        results = prediction_service.batch_predict(sample_data)
        return jsonify({
            "status": "success",
            "predictions": results,
            "message": "Product ID test successful"
        })
    except Exception as e:
        logger.error(f"❌ Product ID test failed: {str(e)}")
        return jsonify({"error": str(e), "trace": traceback.format_exc()}), 500

@predict_bp.route('/predict', methods=['POST'])
def predict():
    """Single prediction endpoint"""
    try:
        data = request.json
        predictions = prediction_service.predict(data)
        return jsonify(predictions)
    except Exception as e:
        logger.error(f"❌ Prediction failed: {str(e)}")
        return jsonify({"error": str(e), "trace": traceback.format_exc()}), 500

@predict_bp.route('/explain', methods=['POST'])
def explain_prediction():
    """Explain prediction endpoint"""
    try:
        data = request.json
        explanation = prediction_service.explain_prediction(data)
        return jsonify(explanation)
    except Exception as e:
        logger.error(f"❌ Explanation failed: {str(e)}")
        return jsonify({"error": str(e)}), 500

@predict_bp.route('/batch-predict', methods=['POST'])
def batch_predict():
    """Batch prediction endpoint"""
    try:
        data = request.json
        results = prediction_service.batch_predict(data)
        return jsonify(results)
    except Exception as e:
        logger.error(f"❌ Batch prediction failed: {str(e)}")
        return jsonify({"error": str(e)}), 500

@predict_bp.route('/save-analysis', methods=['POST'])
def save_analysis():
    """Save analysis to database"""
    try:
        data = request.json
        session_id = data.get('session_id', str(uuid.uuid4()))
        file_name = data.get('file_name', 'unknown.csv')
        predictions = data.get('predictions', [])
        explanations = data.get('explanations', [])
        
        logger.info(f"🔄 Saving analysis to database: {file_name} (Session: {session_id})")
        
        # Validate data
        if not predictions:
            return jsonify({'error': 'No predictions provided'}), 400
        
        success = prediction_service.save_analysis_to_db(
            session_id, file_name, predictions, explanations
        )
        
        if success:
            logger.info(f"✅ Analysis saved successfully: {session_id}")
            return jsonify({
                'success': True,
                'session_id': session_id,
                'message': 'Analysis saved successfully',
                'timestamp': datetime.utcnow().isoformat()
            })
        else:
            logger.error(f"❌ Failed to save analysis: {session_id}")
            return jsonify({'error': 'Failed to save analysis'}), 500
    
    except Exception as e:
        logger.error(f"❌ Save analysis failed: {str(e)}")
        traceback.print_exc()
        return jsonify({'error': f'Save failed: {str(e)}'}), 500

@predict_bp.route('/recent-sessions', methods=['GET'])
def get_recent_sessions():
    """Get recent analysis sessions"""
    try:
        limit = request.args.get('limit', 10, type=int)
        
        logger.info(f"🔍 Fetching recent sessions (limit: {limit})")
        
        sessions = db_service.get_recent_sessions(limit)
        
        logger.info(f"✅ Found {len(sessions)} recent sessions")
        
        return jsonify({
            "sessions": sessions,
            "success": True,
            "count": len(sessions)
        })
        
    except Exception as e:
        logger.error(f"❌ Error fetching recent sessions: {e}")
        traceback.print_exc()
        return jsonify({
            "sessions": [],
            "error": str(e)
        }), 500

@predict_bp.route('/session/<session_id>', methods=['GET'])
def get_session(session_id):
    """Get saved analysis session"""
    try:
        logger.info(f"🔍 Fetching session: {session_id}")
        
        session_data = db_service.get_session(session_id)
        
        if not session_data:
            logger.warning(f"⚠️ Session not found: {session_id}")
            return jsonify({
                "error": f"Session {session_id} not found",
                "session": None
            }), 404
        
        predictions = session_data.get('predictions', [])
        explanations = session_data.get('explanations', [])
        logger.info(f"✅ Session found with {len(predictions)} predictions and {len(explanations)} explanations")
        
        return jsonify({
            "session": session_data,
            "success": True
        })
        
    except Exception as e:
        logger.error(f"❌ Error fetching session {session_id}: {e}")
        traceback.print_exc()
        return jsonify({
            "error": str(e),
            "session": None
        }), 500

@predict_bp.route('/session/<session_id>', methods=['DELETE'])
def delete_session(session_id):
    """Delete analysis session"""
    try:
        logger.info(f"🗑️ Deleting session: {session_id}")
        
        success = db_service.delete_session(session_id)
        
        if success:
            logger.info(f"✅ Session deleted: {session_id}")
            return jsonify({
                'success': True,
                'message': 'Session deleted successfully'
            })
        else:
            return jsonify({'error': 'Failed to delete session'}), 500
    
    except Exception as e:
        logger.error(f"❌ Delete session failed: {str(e)}")
        return jsonify({'error': f'Failed to delete session: {str(e)}'}), 500

@predict_bp.route('/latest-forecast/<product_id>', methods=['GET'])
def get_latest_forecast(product_id):
    """
    Get the latest forecast for a specific product
    This endpoint displays the most recent demand prediction with metadata
    """
    try:
        logger.info(f"🔍 Fetching latest forecast for product: {product_id}")
        
        forecast = db_service.get_latest_session_for_product(product_id)
        
        if not forecast:
            logger.info(f"ℹ️ No forecast found for product: {product_id}")
            return jsonify({
                "success": False,
                "forecast": None,
                "message": f"No forecast available for product {product_id}"
            }), 404
        
        # Format response with human-readable dates
        forecast_data = {
            "success": True,
            "forecast": {
                "product_id": forecast.get('product_id'),
                "product_type": forecast.get('product_type'),
                "plastic_type": forecast.get('plastic_type'),
                "predicted_demand": float(forecast.get('predicted_demand', 0)),
                "confidence": float(forecast.get('confidence', 0)),
                "forecast_date": forecast.get('created_at'),
                "session_id": forecast.get('session_id'),
                "source_file": forecast.get('file_name'),
                "session_date": forecast.get('session_created_at')
            }
        }
        
        logger.info(f"✅ Latest forecast retrieved for product {product_id}: {forecast_data['forecast']['predicted_demand']:.2f} units")
        
        return jsonify(forecast_data)
        
    except Exception as e:
        logger.error(f"❌ Error fetching latest forecast: {e}")
        traceback.print_exc()
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@predict_bp.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    try:
        db_status = "connected" if db_service.get_connection() else "disconnected"
    except:
        db_status = "disconnected"
    
    return jsonify({
        "status": "healthy",
        "service": "ml-backend",
        "models_loaded": len(prediction_service.models) if hasattr(prediction_service, 'models') else 0,
        "database": db_status,
        "timestamp": datetime.utcnow().isoformat()
    })
