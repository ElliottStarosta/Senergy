"""
Senergy ML Recommendation Model
Uses collaborative filtering with a two-tower neural network to predict place ratings
based on user personality and historical ratings.
"""

import numpy as np
import tensorflow as tf
from tensorflow import keras
from sklearn.preprocessing import StandardScaler
import joblib
import json
import os
from datetime import datetime
from typing import Dict, List, Tuple, Optional

class SenergyRecommendationModel:
    def __init__(self, model_dir: str = 'models'):
        """
        Initialize the recommendation model.
        
        Args:
            model_dir: Directory to save/load models and scalers
        """
        self.model_dir = model_dir
        os.makedirs(model_dir, exist_ok=True)
        
        # Model components
        self.user_model = None
        self.place_model = None
        self.interaction_model = None
        
        # Scalers for feature normalization
        self.user_scaler = StandardScaler()
        self.place_scaler = StandardScaler()
        
        # Feature mappings
        self.user_id_map = {}
        self.place_id_map = {}
        
        # Training metadata
        self.training_history = {
            'total_samples': 0,
            'last_trained': None,
            'epochs_completed': 0,
            'loss_history': [],
            'val_loss_history': []
        }
        
        # Model hyperparameters
        self.embedding_dim = 32
        self.hidden_units = [128, 64, 32]
        self.dropout_rate = 0.3
        self.learning_rate = 0.001
        
    def build_model(self, n_users: int, n_places: int, user_features_dim: int, place_features_dim: int):
        """
        Build the neural network architecture for recommendations.
        Uses a two-tower approach with user and place embeddings + features.
        
        Architecture:
        - User Tower: User embedding + personality features
        - Place Tower: Place embedding + aggregated rating features
        - Interaction Tower: Combines both towers with deep layers
        """
        
        # ===== User Tower =====
        user_id_input = keras.Input(shape=(1,), name='user_id')
        user_features_input = keras.Input(shape=(user_features_dim,), name='user_features')
        
        # User embedding
        user_embedding = keras.layers.Embedding(
            input_dim=n_users,
            output_dim=self.embedding_dim,
            embeddings_regularizer=keras.regularizers.l2(1e-6),
            name='user_embedding'
        )(user_id_input)
        user_embedding = keras.layers.Flatten()(user_embedding)
        
        # Combine user embedding with features
        user_concat = keras.layers.Concatenate()([user_embedding, user_features_input])
        
        # User tower deep layers
        user_dense = keras.layers.Dense(64, activation='relu')(user_concat)
        user_dense = keras.layers.BatchNormalization()(user_dense)
        user_dense = keras.layers.Dropout(self.dropout_rate)(user_dense)
        user_output = keras.layers.Dense(32, activation='relu', name='user_tower')(user_dense)
        
        # ===== Place Tower =====
        place_id_input = keras.Input(shape=(1,), name='place_id')
        place_features_input = keras.Input(shape=(place_features_dim,), name='place_features')
        
        # Place embedding
        place_embedding = keras.layers.Embedding(
            input_dim=n_places,
            output_dim=self.embedding_dim,
            embeddings_regularizer=keras.regularizers.l2(1e-6),
            name='place_embedding'
        )(place_id_input)
        place_embedding = keras.layers.Flatten()(place_embedding)
        
        # Combine place embedding with features
        place_concat = keras.layers.Concatenate()([place_embedding, place_features_input])
        
        # Place tower deep layers
        place_dense = keras.layers.Dense(64, activation='relu')(place_concat)
        place_dense = keras.layers.BatchNormalization()(place_dense)
        place_dense = keras.layers.Dropout(self.dropout_rate)(place_dense)
        place_output = keras.layers.Dense(32, activation='relu', name='place_tower')(place_dense)
        
        # ===== Interaction Tower =====
        # Combine user and place representations
        combined = keras.layers.Concatenate()([user_output, place_output])
        
        # Deep interaction layers
        x = combined
        for units in self.hidden_units:
            x = keras.layers.Dense(units, activation='relu')(x)
            x = keras.layers.BatchNormalization()(x)
            x = keras.layers.Dropout(self.dropout_rate)(x)
        
        # Output layer - predict rating (1-10)
        output = keras.layers.Dense(1, activation='linear', name='rating_prediction')(x)
        
        # Create model
        model = keras.Model(
            inputs=[user_id_input, user_features_input, place_id_input, place_features_input],
            outputs=output,
            name='senergy_recommendation_model'
        )
        
        # Compile with custom loss and metrics
        model.compile(
            optimizer=keras.optimizers.Adam(learning_rate=self.learning_rate),
            loss='mse',  # Mean Squared Error for rating prediction
            metrics=[
                'mae',  # Mean Absolute Error
                keras.metrics.RootMeanSquaredError(name='rmse')
            ]
        )
        
        return model
    
    def prepare_features(self, ratings_data: List[Dict]) -> Tuple[Dict, Dict]:
        """
        Prepare features from raw rating data.
        
        Args:
            ratings_data: List of rating dictionaries with user and place info
            
        Returns:
            Tuple of (user_features_dict, place_features_dict)
        """
        user_features = {}
        place_features = {}
        
        # Extract user features
        for rating in ratings_data:
            user_id = rating['userId']
            if user_id not in user_features:
                user_features[user_id] = {
                    'adjustmentFactor': rating.get('userAdjustmentFactor', 0),
                    'personalityType': rating.get('userPersonalityType', 'Unknown'),
                    'totalRatings': 0,
                    'avgRating': 0,
                    'ratings_sum': 0
                }
            
            user_features[user_id]['totalRatings'] += 1
            user_features[user_id]['ratings_sum'] += rating['overallScore']
        
        # Calculate average ratings
        for user_id in user_features:
            total = user_features[user_id]['totalRatings']
            user_features[user_id]['avgRating'] = user_features[user_id]['ratings_sum'] / total
        
        # Extract place features
        for rating in ratings_data:
            place_id = rating['placeId']
            if place_id not in place_features:
                place_features[place_id] = {
                    'totalRatings': 0,
                    'avgScore': 0,
                    'avgCrowdSize': 0,
                    'avgNoiseLevel': 0,
                    'avgSocialEnergy': 0,
                    'avgService': 0,
                    'avgAtmosphere': 0,
                    'ratings_sum': 0,
                    'crowd_sum': 0,
                    'noise_sum': 0,
                    'social_sum': 0,
                    'service_sum': 0,
                    'atmosphere_sum': 0
                }
            
            pf = place_features[place_id]
            pf['totalRatings'] += 1
            pf['ratings_sum'] += rating['overallScore']
            
            categories = rating.get('categories', {})
            pf['crowd_sum'] += categories.get('crowdSize', 5)
            pf['noise_sum'] += categories.get('noiseLevel', 5)
            pf['social_sum'] += categories.get('socialEnergy', 5)
            pf['service_sum'] += categories.get('service', 5)
            pf['atmosphere_sum'] += categories.get('atmosphere', 5)
        
        # Calculate averages for places
        for place_id in place_features:
            pf = place_features[place_id]
            total = pf['totalRatings']
            pf['avgScore'] = pf['ratings_sum'] / total
            pf['avgCrowdSize'] = pf['crowd_sum'] / total
            pf['avgNoiseLevel'] = pf['noise_sum'] / total
            pf['avgSocialEnergy'] = pf['social_sum'] / total
            pf['avgService'] = pf['service_sum'] / total
            pf['avgAtmosphere'] = pf['atmosphere_sum'] / total
        
        return user_features, place_features
    
    def encode_features(self, user_features: Dict, place_features: Dict) -> Tuple[np.ndarray, np.ndarray]:
        """
        Convert feature dictionaries to numerical arrays.
        
        Returns:
            Tuple of (user_feature_array, place_feature_array)
        """
        # Personality type encoding
        personality_map = {
            'Strong Introvert': -1.0,
            'Moderate Introvert': -0.5,
            'Ambivert': 0.0,
            'Moderate Extrovert': 0.5,
            'Strong Extrovert': 1.0,
            'Unknown': 0.0
        }
        
        # User features: [adjustmentFactor, personality_encoded, totalRatings, avgRating]
        user_array = np.array([
            [
                uf['adjustmentFactor'],
                personality_map.get(uf['personalityType'], 0.0),
                np.log1p(uf['totalRatings']),  # Log transform for count
                uf['avgRating'] / 10.0  # Normalize to 0-1
            ]
            for uf in user_features.values()
        ])
        
        # Place features: [avgScore, avgCrowdSize, avgNoiseLevel, avgSocialEnergy, avgService, avgAtmosphere, totalRatings]
        place_array = np.array([
            [
                pf['avgScore'] / 10.0,
                pf['avgCrowdSize'] / 10.0,
                pf['avgNoiseLevel'] / 10.0,
                pf['avgSocialEnergy'] / 10.0,
                pf['avgService'] / 10.0,
                pf['avgAtmosphere'] / 10.0,
                np.log1p(pf['totalRatings'])
            ]
            for pf in place_features.values()
        ])
        
        return user_array, place_array
    
    def train(self, ratings_data: List[Dict], epochs: int = 50, batch_size: int = 32, validation_split: float = 0.2):
        """
        Train the model on rating data.
        
        Args:
            ratings_data: List of rating dictionaries
            epochs: Number of training epochs
            batch_size: Batch size for training
            validation_split: Fraction of data to use for validation
        """
        print(f"🤖 Training model on {len(ratings_data)} ratings...")
        
        # Prepare features
        user_features_dict, place_features_dict = self.prepare_features(ratings_data)
        
        # Create ID mappings
        self.user_id_map = {uid: idx for idx, uid in enumerate(user_features_dict.keys())}
        self.place_id_map = {pid: idx for idx, pid in enumerate(place_features_dict.keys())}
        
        # Encode features
        user_features_array, place_features_array = self.encode_features(
            user_features_dict, place_features_dict
        )
        
        # Fit scalers
        self.user_scaler.fit(user_features_array)
        self.place_scaler.fit(place_features_array)
        
        # Transform features
        user_features_scaled = self.user_scaler.transform(user_features_array)
        place_features_scaled = self.place_scaler.transform(place_features_array)
        
        # Prepare training data
        user_ids = []
        user_features_list = []
        place_ids = []
        place_features_list = []
        ratings = []
        
        for rating in ratings_data:
            user_id = rating['userId']
            place_id = rating['placeId']
            
            if user_id in self.user_id_map and place_id in self.place_id_map:
                user_idx = self.user_id_map[user_id]
                place_idx = self.place_id_map[place_id]
                
                user_ids.append(user_idx)
                user_features_list.append(user_features_scaled[user_idx])
                place_ids.append(place_idx)
                place_features_list.append(place_features_scaled[place_idx])
                ratings.append(rating['overallScore'])
        
        # Convert to numpy arrays
        X = {
            'user_id': np.array(user_ids),
            'user_features': np.array(user_features_list),
            'place_id': np.array(place_ids),
            'place_features': np.array(place_features_list)
        }
        y = np.array(ratings)
        
        # Build model if not exists
        if self.interaction_model is None:
            self.interaction_model = self.build_model(
                n_users=len(self.user_id_map),
                n_places=len(self.place_id_map),
                user_features_dim=user_features_scaled.shape[1],
                place_features_dim=place_features_scaled.shape[1]
            )
        
        print(f"📊 Model architecture:")
        self.interaction_model.summary()
        
        # Callbacks
        callbacks = [
            keras.callbacks.EarlyStopping(
                monitor='val_loss',
                patience=10,
                restore_best_weights=True,
                verbose=1
            ),
            keras.callbacks.ReduceLROnPlateau(
                monitor='val_loss',
                factor=0.5,
                patience=5,
                min_lr=1e-7,
                verbose=1
            )
        ]
        
        # Train model
        history = self.interaction_model.fit(
            X, y,
            epochs=epochs,
            batch_size=batch_size,
            validation_split=validation_split,
            callbacks=callbacks,
            verbose=1
        )
        
        # Update training metadata
        self.training_history['total_samples'] += len(ratings_data)
        self.training_history['last_trained'] = datetime.now().isoformat()
        self.training_history['epochs_completed'] += len(history.history['loss'])
        self.training_history['loss_history'].extend(history.history['loss'])
        self.training_history['val_loss_history'].extend(history.history.get('val_loss', []))
        
        print(f"✅ Training complete!")
        print(f"   Final loss: {history.history['loss'][-1]:.4f}")
        print(f"   Final MAE: {history.history['mae'][-1]:.4f}")
        
        # Save model
        self.save()
        
        return history
    
    def predict(self, user_id: str, place_id: str, user_features: Dict, place_features: Dict) -> float:
        """
        Predict a rating for a user-place pair.
        
        Args:
            user_id: User ID
            place_id: Place ID
            user_features: User feature dictionary
            place_features: Place feature dictionary
            
        Returns:
            Predicted rating (1-10)
        """
        if self.interaction_model is None:
            raise ValueError("Model not trained yet!")
        
        # Check if user/place are in training set
        if user_id not in self.user_id_map:
            # Cold start for new user - use personality-based features only
            user_idx = 0  # Use a default embedding
        else:
            user_idx = self.user_id_map[user_id]
        
        if place_id not in self.place_id_map:
            # Cold start for new place - use average features
            place_idx = 0
        else:
            place_idx = self.place_id_map[place_id]
        
        # Prepare user features
        personality_map = {
            'Strong Introvert': -1.0,
            'Moderate Introvert': -0.5,
            'Ambivert': 0.0,
            'Moderate Extrovert': 0.5,
            'Strong Extrovert': 1.0,
            'Unknown': 0.0
        }
        
        user_feat_array = np.array([[
            user_features.get('adjustmentFactor', 0),
            personality_map.get(user_features.get('personalityType', 'Unknown'), 0.0),
            np.log1p(user_features.get('totalRatings', 1)),
            user_features.get('avgRating', 5.0) / 10.0
        ]])
        user_feat_scaled = self.user_scaler.transform(user_feat_array)
        
        # Prepare place features
        place_feat_array = np.array([[
            place_features.get('avgScore', 5.0) / 10.0,
            place_features.get('avgCrowdSize', 5.0) / 10.0,
            place_features.get('avgNoiseLevel', 5.0) / 10.0,
            place_features.get('avgSocialEnergy', 5.0) / 10.0,
            place_features.get('avgService', 5.0) / 10.0,
            place_features.get('avgAtmosphere', 5.0) / 10.0,
            np.log1p(place_features.get('totalRatings', 1))
        ]])
        place_feat_scaled = self.place_scaler.transform(place_feat_array)
        
        # Predict
        X = {
            'user_id': np.array([user_idx]),
            'user_features': user_feat_scaled,
            'place_id': np.array([place_idx]),
            'place_features': place_feat_scaled
        }
        
        prediction = self.interaction_model.predict(X, verbose=0)[0][0]
        
        # Clip to valid range
        return np.clip(prediction, 1.0, 10.0)
    
    def save(self):
        """Save model, scalers, and metadata to disk."""
        print(f"💾 Saving model to {self.model_dir}...")
        
        # Save Keras model
        if self.interaction_model is not None:
            model_path = os.path.join(self.model_dir, 'recommendation_model.keras')
            self.interaction_model.save(model_path)
        
        # Save scalers
        joblib.dump(self.user_scaler, os.path.join(self.model_dir, 'user_scaler.pkl'))
        joblib.dump(self.place_scaler, os.path.join(self.model_dir, 'place_scaler.pkl'))
        
        # Save ID mappings
        with open(os.path.join(self.model_dir, 'user_id_map.json'), 'w') as f:
            json.dump(self.user_id_map, f)
        
        with open(os.path.join(self.model_dir, 'place_id_map.json'), 'w') as f:
            json.dump(self.place_id_map, f)
        
        # Save training metadata
        with open(os.path.join(self.model_dir, 'training_history.json'), 'w') as f:
            json.dump(self.training_history, f, indent=2)
        
        print("✅ Model saved successfully!")
    
    def load(self):
        """Load model, scalers, and metadata from disk."""
        print(f"📂 Loading model from {self.model_dir}...")
        
        # Load Keras model
        model_path = os.path.join(self.model_dir, 'recommendation_model.keras')
        if os.path.exists(model_path):
            self.interaction_model = keras.models.load_model(model_path)
        
        # Load scalers
        user_scaler_path = os.path.join(self.model_dir, 'user_scaler.pkl')
        if os.path.exists(user_scaler_path):
            self.user_scaler = joblib.load(user_scaler_path)
        
        place_scaler_path = os.path.join(self.model_dir, 'place_scaler.pkl')
        if os.path.exists(place_scaler_path):
            self.place_scaler = joblib.load(place_scaler_path)
        
        # Load ID mappings
        user_map_path = os.path.join(self.model_dir, 'user_id_map.json')
        if os.path.exists(user_map_path):
            with open(user_map_path, 'r') as f:
                self.user_id_map = json.load(f)
        
        place_map_path = os.path.join(self.model_dir, 'place_id_map.json')
        if os.path.exists(place_map_path):
            with open(place_map_path, 'r') as f:
                self.place_id_map = json.load(f)
        
        # Load training metadata
        history_path = os.path.join(self.model_dir, 'training_history.json')
        if os.path.exists(history_path):
            with open(history_path, 'r') as f:
                self.training_history = json.load(f)
        
        print("✅ Model loaded successfully!")
        print(f"   Total samples trained: {self.training_history['total_samples']}")
        print(f"   Last trained: {self.training_history['last_trained']}")