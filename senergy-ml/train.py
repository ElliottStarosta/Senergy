"""
Training script for Senergy ML recommendation model.
Fetches data from Firestore and trains the model.
"""

import os
import sys
import json
from datetime import datetime
import firebase_admin
from firebase_admin import credentials, firestore
from dotenv import load_dotenv
from model import SenergyRecommendationModel

# Load environment variables
load_dotenv()

def initialize_firebase():
    """Initialize Firebase Admin SDK."""
    if not firebase_admin._apps:
        # Load credentials from environment
        cred_dict = {
            "type": "service_account",
            "project_id": os.getenv("FIREBASE_PROJECT_ID"),
            "private_key_id": os.getenv("FIREBASE_PRIVATE_KEY_ID"),
            "private_key": os.getenv("FIREBASE_PRIVATE_KEY").replace("\\n", "\n"),
            "client_email": os.getenv("FIREBASE_CLIENT_EMAIL"),
            "client_id": os.getenv("FIREBASE_CLIENT_ID"),
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
            "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
            "client_x509_cert_url": os.getenv("FIREBASE_CERT_URL")
        }
        
        cred = credentials.Certificate(cred_dict)
        firebase_admin.initialize_app(cred)
    
    return firestore.client()

def fetch_ratings_data(db):
    """
    Fetch all ratings from Firestore.
    
    Returns:
        List of rating dictionaries
    """
    print("📊 Fetching ratings from Firestore...")
    
    ratings_ref = db.collection('ratings')
    ratings_docs = ratings_ref.stream()
    
    ratings_data = []
    for doc in ratings_docs:
        rating = doc.to_dict()
        rating['id'] = doc.id
        ratings_data.append(rating)
    
    print(f"✅ Fetched {len(ratings_data)} ratings")
    return ratings_data

def should_retrain(model: SenergyRecommendationModel, new_ratings_count: int) -> bool:
    """
    Determine if model should be retrained based on new data.
    
    Retrain if:
    - Model doesn't exist
    - More than 50 new ratings since last training
    - More than 7 days since last training
    """
    if model.interaction_model is None:
        print("🆕 No existing model found - initial training required")
        return True
    
    last_trained = model.training_history.get('last_trained')
    if last_trained is None:
        return True
    
    # Check new ratings threshold
    prev_samples = model.training_history.get('total_samples', 0)
    new_samples = new_ratings_count - prev_samples
    
    if new_samples >= 50:
        print(f"📈 {new_samples} new ratings since last training - retraining")
        return True
    
    # Check time threshold
    last_trained_dt = datetime.fromisoformat(last_trained)
    days_since = (datetime.now() - last_trained_dt).days
    
    if days_since >= 7:
        print(f"📅 {days_since} days since last training - retraining")
        return True
    
    print(f"ℹ️  Only {new_samples} new ratings in {days_since} days - skipping training")
    return False

def main():
    """Main training pipeline."""
    print("=" * 60)
    print("🤖 Senergy ML Recommendation Model - Training Pipeline")
    print("=" * 60)
    
    # Initialize Firebase
    db = initialize_firebase()
    
    # Initialize model
    model = SenergyRecommendationModel(model_dir='models')
    
    # Try to load existing model
    try:
        model.load()
        print("📂 Loaded existing model")
    except Exception as e:
        print(f"ℹ️  No existing model found: {e}")
    
    # Fetch data
    ratings_data = fetch_ratings_data(db)
    
    if len(ratings_data) < 10:
        print("⚠️  Not enough data to train (minimum 10 ratings required)")
        print(f"   Current: {len(ratings_data)} ratings")
        return
    
    # Check if retraining is needed
    if not should_retrain(model, len(ratings_data)):
        print("✅ Model is up to date - no training needed")
        return
    
    # Train model
    print("\n" + "=" * 60)
    print("🏋️  Starting model training...")
    print("=" * 60)
    
    try:
        history = model.train(
            ratings_data=ratings_data,
            epochs=100,  # Max epochs (early stopping will reduce this)
            batch_size=32,
            validation_split=0.2
        )
        
        print("\n" + "=" * 60)
        print("✅ Training Complete!")
        print("=" * 60)
        print(f"📊 Training Statistics:")
        print(f"   - Total ratings: {len(ratings_data)}")
        print(f"   - Epochs completed: {len(history.history['loss'])}")
        print(f"   - Final loss: {history.history['loss'][-1]:.4f}")
        print(f"   - Final MAE: {history.history['mae'][-1]:.4f}")
        print(f"   - Final RMSE: {history.history['rmse'][-1]:.4f}")
        
        # Test prediction
        if len(ratings_data) > 0:
            test_rating = ratings_data[0]
            user_features = {
                'adjustmentFactor': test_rating.get('userAdjustmentFactor', 0),
                'personalityType': test_rating.get('userPersonalityType', 'Unknown'),
                'totalRatings': 1,
                'avgRating': test_rating['overallScore']
            }
            place_features = {
                'avgScore': test_rating['overallScore'],
                'avgCrowdSize': test_rating['categories'].get('crowdSize', 5),
                'avgNoiseLevel': test_rating['categories'].get('noiseLevel', 5),
                'avgSocialEnergy': test_rating['categories'].get('socialEnergy', 5),
                'avgService': test_rating['categories'].get('service', 5),
                'avgAtmosphere': test_rating['categories'].get('atmosphere', 5),
                'totalRatings': 1
            }
            
            prediction = model.predict(
                test_rating['userId'],
                test_rating['placeId'],
                user_features,
                place_features
            )
            
            print(f"\n🧪 Test Prediction:")
            print(f"   - Actual rating: {test_rating['overallScore']:.2f}")
            print(f"   - Predicted: {prediction:.2f}")
            print(f"   - Error: {abs(prediction - test_rating['overallScore']):.2f}")
        
    except Exception as e:
        print(f"❌ Training failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    
    print("\n✅ All done!")

if __name__ == "__main__":
    main()