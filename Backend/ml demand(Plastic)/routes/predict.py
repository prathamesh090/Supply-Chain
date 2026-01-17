from flask import Blueprint, request, jsonify
from services.prediction_service import PredictionService
import traceback
import uuid
from datetime import datetime
from services.database_service import db_service

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
        return jsonify({"error": str(e), "trace": traceback.format_exc()}), 500

@predict_bp.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.json
        predictions = prediction_service.predict(data)
        return jsonify(predictions)
    except Exception as e:
        return jsonify({"error": str(e), "trace": traceback.format_exc()}), 500

@predict_bp.route('/explain', methods=['POST'])
def explain_prediction():
    try:
        data = request.json
        explanation = prediction_service.explain_prediction(data)
        return jsonify(explanation)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@predict_bp.route('/batch-predict', methods=['POST'])
def batch_predict():
    try:
        data = request.json
        results = prediction_service.batch_predict(data)
        return jsonify(results)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@predict_bp.route('/save-analysis', methods=['POST'])
def save_analysis():
    try:
        data = request.json
        session_id = data.get('session_id', str(uuid.uuid4()))
        file_name = data.get('file_name', 'unknown.csv')
        predictions = data.get('predictions', [])
        explanations = data.get('explanations', [])
        
        print(f"🔄 Saving analysis to database: {file_name}")
        
        success = prediction_service.save_analysis_to_db(
            session_id, file_name, predictions, explanations
        )
        
        if success:
            return jsonify({
                'success': True,
                'session_id': session_id,
                'message': 'Analysis saved successfully'
            })
        else:
            return jsonify({'error': 'Failed to save analysis'}), 500
    
    except Exception as e:
        print(f"❌ Save analysis failed: {str(e)}")
        return jsonify({'error': f'Save failed: {str(e)}'}), 500

@predict_bp.route('/recent-sessions', methods=['GET'])
def get_recent_sessions():
    """Get recent analysis sessions"""
    try:
        limit = request.args.get('limit', 10, type=int)
        
        print(f"Fetching recent sessions (limit: {limit})")
        
        sessions = db_service.get_recent_sessions(limit)
        
        print(f"✅ Found {len(sessions)} recent sessions")
        
        return jsonify({
            "sessions": sessions,
            "success": True,
            "count": len(sessions)
        })
        
    except Exception as e:
        print(f"❌ Error fetching recent sessions: {e}")
        traceback.print_exc()
        return jsonify({
            "sessions": [],
            "error": str(e)
        }), 500

@predict_bp.route('/session/<session_id>', methods=['GET'])
def get_session(session_id):
    """Get saved analysis session"""
    try:
        print(f"Fetching session: {session_id}")
        
        session_data = db_service.get_session(session_id)
        
        if not session_data:
            return jsonify({
                "error": f"Session {session_id} not found",
                "session": None
            }), 404
        
        print(f"✅ Session found with {len(session_data.get('predictions', []))} predictions")
        
        return jsonify({
            "session": session_data,
            "success": True
        })
        
    except Exception as e:
        print(f"❌ Error fetching session {session_id}: {e}")
        traceback.print_exc()
        return jsonify({
            "error": str(e),
            "session": None
        }), 500

@predict_bp.route('/session/<session_id>', methods=['DELETE'])
def delete_session(session_id):
    try:
        from services.database_service import db_service
        
        # Get database connection
        conn = db_service.get_connection()
        cursor = conn.cursor()
        
        # Delete session and related data (cascade delete should handle predictions and explanations)
        cursor.execute('DELETE FROM analysis_sessions WHERE session_id = %s', (session_id,))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        print(f"✅ Session deleted: {session_id}")
        return jsonify({
            'success': True,
            'message': 'Session deleted successfully'
        })
    
    except Exception as e:
        print(f"❌ Delete session failed: {str(e)}")
        return jsonify({'error': f'Failed to delete session: {str(e)}'}), 500

@predict_bp.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "service": "ml-backend",
        "models_loaded": len(prediction_service.models)
    })
