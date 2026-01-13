"""
Flask API for ML-powered recommendations.
Provides a prediction endpoint that combines heuristic + ML predictions.
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from typing import Dict, List
from model import SenergyRecommendationModel

app = Flask(__name__)
CORS(app)

# Initialize model (will load existing model)
model = SenergyRecommendationModel(model_dir='models')
try:
    model.load()
    print("✅ ML model loaded successfully!")
except Exception as e:
    print(f"⚠️  No trained model found: {e}")
    print("   Run train.py to train the model first")

def heuristic_prediction(
    user_features: Dict,
    place_features: Dict,
    similar_users_ratings: List[Dict]
) -> float:
    """
    Original heuristic-based prediction algorithm.
    Uses collaborative filtering with personality similarity.
    """
    user_af = user_features.get('adjustmentFactor', 0)
    
    if not similar_users_ratings:
        # No similar users - use global average
        return place_features.get('avgScore', 5.0)
    
    # Find ratings from users with similar personality (within 0.3 AF range)
    similar_ratings = [
        r for r in similar_users_ratings
        if abs(r.get('userAdjustmentFactor', 0) - user_af) <= 0.3
    ]
    
    if not similar_ratings:
        # Use all ratings if no similar users
        similar_ratings = similar_users_ratings
    
    # Calculate weighted average based on personality similarity
    weighted_sum = 0
    total_weight = 0
    
    for rating in similar_ratings:
        af_distance = abs(rating.get('userAdjustmentFactor', 0) - user_af)
        similarity = 1 - (af_distance / 0.3) if af_distance <= 0.3 else 0.5
        weight = similarity * similarity  # Square for emphasis
        
        weighted_sum += rating['overallScore'] * weight
        total_weight += weight
    
    if total_weight == 0:
        return place_features.get('avgScore', 5.0)
    
    predicted_score = weighted_sum / total_weight
    return max(1.0, min(10.0, predicted_score))

def hybrid_prediction(
    user_id: str,
    place_id: str,
    user_features: Dict,
    place_features: Dict,
    similar_users_ratings: List[Dict],
    heuristic_weight: float = 0.7,
    ml_weight: float = 0.3
) -> Dict:
    """
    Combine heuristic and ML predictions with weighted average.
    
    Args:
        user_id: User ID
        place_id: Place ID
        user_features: User feature dictionary
        place_features: Place feature dictionary
        similar_users_ratings: List of ratings from similar users
        heuristic_weight: Weight for heuristic prediction (default 0.7)
        ml_weight: Weight for ML prediction (default 0.3)
        
    Returns:
        Dictionary with predictions and confidence metrics
    """
    # Get heuristic prediction
    heuristic_score = heuristic_prediction(
        user_features,
        place_features,
        similar_users_ratings
    )
    
    # Calculate heuristic confidence based on data availability
    n_similar = len(similar_users_ratings)
    heuristic_confidence = min(n_similar / 10, 1.0) if n_similar > 0 else 0.3
    
    # Get ML prediction if model is available
    ml_score = None
    ml_confidence = 0.0
    
    if model.interaction_model is not None:
        try:
            ml_score = model.predict(
                user_id,
                place_id,
                user_features,
                place_features
            )
            
            # ML confidence based on whether user/place are in training set
            user_known = user_id in model.user_id_map
            place_known = place_id in model.place_id_map
            
            if user_known and place_known:
                ml_confidence = 0.9
            elif user_known or place_known:
                ml_confidence = 0.6
            else:
                ml_confidence = 0.3  # Cold start
                
        except Exception as e:
            print(f"⚠️  ML prediction failed: {e}")
            ml_score = None
    
    # Combine predictions
    if ml_score is not None:
        # Weighted average
        final_score = (
            heuristic_score * heuristic_weight +
            ml_score * ml_weight
        )
        
        # Combined confidence
        final_confidence = (
            heuristic_confidence * heuristic_weight +
            ml_confidence * ml_weight
        )
        
        method = "hybrid"
    else:
        # Fall back to heuristic only
        final_score = heuristic_score
        final_confidence = heuristic_confidence
        method = "heuristic_only"
    
    return {
        'predictedScore': round(final_score, 2),
        'confidence': round(final_confidence, 2),
        'method': method,
        'breakdown': {
            'heuristic': {
                'score': round(heuristic_score, 2),
                'confidence': round(heuristic_confidence, 2),
                'weight': heuristic_weight,
                'n_similar_users': len(similar_users_ratings)
            },
            'ml': {
                'score': round(ml_score, 2) if ml_score is not None else None,
                'confidence': round(ml_confidence, 2) if ml_score is not None else None,
                'weight': ml_weight,
                'available': ml_score is not None
            }
        }
    }

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint."""
    return jsonify({
        'status': 'healthy',
        'model_loaded': model.interaction_model is not None,
        'model_stats': {
            'total_samples': model.training_history.get('total_samples', 0),
            'last_trained': model.training_history.get('last_trained'),
            'epochs': model.training_history.get('epochs_completed', 0)
        }
    })

@app.route('/predict', methods=['POST'])
def predict():
    """
    Predict rating for a user-place pair.
    
    Request body:
    {
        "userId": "user123",
        "placeId": "place456",
        "userFeatures": {
            "adjustmentFactor": 0.5,
            "personalityType": "Moderate Extrovert",
            "totalRatings": 10,
            "avgRating": 7.5
        },
        "placeFeatures": {
            "avgScore": 8.0,
            "avgCrowdSize": 7.0,
            "avgNoiseLevel": 6.0,
            "avgSocialEnergy": 8.0,
            "avgService": 7.5,
            "avgAtmosphere": 8.5,
            "totalRatings": 25
        },
        "similarUsersRatings": [
            {
                "userId": "user789",
                "userAdjustmentFactor": 0.4,
                "overallScore": 8.5
            }
        ]
    }
    """
    try:
        data = request.get_json()
        
        # Validate required fields
        required = ['userId', 'placeId', 'userFeatures', 'placeFeatures']
        missing = [f for f in required if f not in data]
        if missing:
            return jsonify({
                'success': False,
                'error': f'Missing required fields: {", ".join(missing)}'
            }), 400
        
        # Get prediction
        result = hybrid_prediction(
            user_id=data['userId'],
            place_id=data['placeId'],
            user_features=data['userFeatures'],
            place_features=data['placeFeatures'],
            similar_users_ratings=data.get('similarUsersRatings', []),
            heuristic_weight=data.get('heuristicWeight', 0.7),
            ml_weight=data.get('mlWeight', 0.3)
        )
        
        return jsonify({
            'success': True,
            'prediction': result
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/batch-predict', methods=['POST'])
def batch_predict():
    """
    Predict ratings for multiple user-place pairs.
    Useful for generating recommendations for a group.
    
    Request body:
    {
        "predictions": [
            {
                "userId": "user123",
                "placeId": "place456",
                "userFeatures": {...},
                "placeFeatures": {...},
                "similarUsersRatings": [...]
            },
            ...
        ]
    }
    """
    try:
        data = request.get_json()
        predictions_data = data.get('predictions', [])
        
        if not predictions_data:
            return jsonify({
                'success': False,
                'error': 'No predictions provided'
            }), 400
        
        results = []
        for pred_data in predictions_data:
            result = hybrid_prediction(
                user_id=pred_data['userId'],
                place_id=pred_data['placeId'],
                user_features=pred_data['userFeatures'],
                place_features=pred_data['placeFeatures'],
                similar_users_ratings=pred_data.get('similarUsersRatings', []),
                heuristic_weight=data.get('heuristicWeight', 0.7),
                ml_weight=data.get('mlWeight', 0.3)
            )
            
            results.append({
                'userId': pred_data['userId'],
                'placeId': pred_data['placeId'],
                'prediction': result
            })
        
        return jsonify({
            'success': True,
            'predictions': results,
            'count': len(results)
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/model/info', methods=['GET'])
def model_info():
    """Get information about the current model."""
    if model.interaction_model is None:
        return jsonify({
            'success': False,
            'error': 'No model loaded'
        }), 404
    
    return jsonify({
        'success': True,
        'model': {
            'trained': True,
            'total_samples': model.training_history['total_samples'],
            'last_trained': model.training_history['last_trained'],
            'epochs_completed': model.training_history['epochs_completed'],
            'users_in_training': len(model.user_id_map),
            'places_in_training': len(model.place_id_map),
            'architecture': {
                'embedding_dim': model.embedding_dim,
                'hidden_units': model.hidden_units,
                'dropout_rate': model.dropout_rate
            }
        }
    })

if __name__ == '__main__':
    port = int(os.getenv('ML_API_PORT', 5000))
    debug = os.getenv('FLASK_ENV') == 'development'
    
    print(f"🚀 Starting ML API on port {port}")
    app.run(host='0.0.0.0', port=port, debug=debug)