#!/usr/bin/env python3
"""
Create a Flask API that uses the real H5 model for plant health classification
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import tensorflow as tf
import numpy as np
from PIL import Image
import io
import base64
import os

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend access

# Global model variable
model = None

def load_model():
    """Load the H5 model"""
    global model
    model_path = "new_plant_health_classifier.h5"
    
    if not os.path.exists(model_path):
        print(f"❌ Model file {model_path} not found!")
        return False
    
    try:
        model = tf.keras.models.load_model(model_path)
        print("✅ H5 model loaded successfully!")
        print(f"📊 Model input shape: {model.input_shape}")
        print(f"📊 Model output shape: {model.output_shape}")
        return True
    except Exception as e:
        print(f"❌ Failed to load model: {e}")
        return False

def preprocess_image(image_data):
    """Preprocess image exactly like the training data"""
    try:
        # Decode base64 image
        if image_data.startswith('data:image'):
            # Remove data URL prefix
            image_data = image_data.split(',')[1]
        
        # Decode base64
        image_bytes = base64.b64decode(image_data)
        
        # Load image
        img = Image.open(io.BytesIO(image_bytes))
        
        # Convert to RGB if needed
        if img.mode != 'RGB':
            img = img.convert('RGB')
        
        # Resize to 224x224 (matching training)
        img = img.resize((224, 224))
        
        # Convert to numpy array and normalize
        img_array = np.array(img) / 255.0
        
        # Add batch dimension
        img_array = np.expand_dims(img_array, axis=0)
        
        return img_array
    except Exception as e:
        print(f"Error preprocessing image: {e}")
        return None

def get_crop_specific_recommendations(is_healthy, crop_type):
    """Get crop-specific recommendations"""
    crop = crop_type.lower() if crop_type else 'plant'
    
    if is_healthy:
        recommendations = f"Your {crop_type or 'plant'} appears healthy! Continue with current care routine. "
        
        if 'palak' in crop or 'keerai' in crop or 'spinach' in crop:
            recommendations += "Leafy greens benefit from regular harvesting to encourage new growth. Maintain pH 6.0-6.5 and ensure adequate nitrogen. "
        elif 'tomato' in crop:
            recommendations += "Monitor for early blight and ensure good air circulation. Support heavy fruit branches. "
        elif 'strawberry' in crop:
            recommendations += "Watch for powdery mildew and ensure good drainage. Remove runners for better fruit production. "
        elif 'pepper' in crop:
            recommendations += "Maintain consistent moisture and watch for bacterial spot. Ensure adequate calcium. "
        
        recommendations += "Monitor regularly for any changes in leaf color or texture. Check for pests weekly as prevention."
        return recommendations
    else:
        recommendations = f"{crop_type or 'Plant'} shows signs of pest or disease. Immediate actions: "
        recommendations += "1) Isolate the plant to prevent spread, 2) Carefully inspect leaves and stems for pests, "
        
        if 'palak' in crop or 'keerai' in crop or 'spinach' in crop:
            recommendations += "3) Check for aphids and leaf miners (common in leafy greens), 4) Ensure proper air circulation to prevent downy mildew, "
        elif 'tomato' in crop:
            recommendations += "3) Check for whiteflies, aphids, and early blight, 4) Remove affected leaves immediately, "
        elif 'strawberry' in crop:
            recommendations += "3) Look for spider mites and powdery mildew, 4) Improve air circulation and reduce humidity, "
        elif 'pepper' in crop:
            recommendations += "3) Check for thrips and bacterial spot, 4) Ensure good drainage and avoid overhead watering, "
        else:
            recommendations += "3) Check root system for rot or discoloration, 4) Adjust nutrient solution pH and concentration, "
        
        recommendations += "5) Consider applying organic treatment like neem oil, 6) Monitor closely for 48-72 hours and adjust care as needed."
        return recommendations

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'model_loaded': model is not None,
        'message': 'Plant Health ML API is running'
    })

@app.route('/predict', methods=['POST'])
def predict():
    """Predict plant health using the real H5 model"""
    try:
        if model is None:
            return jsonify({
                'error': 'Model not loaded',
                'message': 'H5 model failed to load'
            }), 500
        
        # Get request data
        data = request.get_json()
        
        if not data or 'image' not in data:
            return jsonify({
                'error': 'No image data provided',
                'message': 'Please provide image data in base64 format'
            }), 400
        
        image_data = data['image']
        crop_type = data.get('cropType', 'Unknown Crop')
        
        # Preprocess image
        img_array = preprocess_image(image_data)
        if img_array is None:
            return jsonify({
                'error': 'Image preprocessing failed',
                'message': 'Could not process the provided image'
            }), 400
        
        # Make prediction using real model
        prediction = model.predict(img_array, verbose=0)[0][0]
        
        # Apply threshold (same as training)
        is_healthy = prediction > 0.5
        confidence = int((prediction if is_healthy else (1 - prediction)) * 100)
        
        # Get recommendations
        recommendations = get_crop_specific_recommendations(is_healthy, crop_type)
        
        # Prepare response
        result = {
            'prediction': 'Healthy Plant' if is_healthy else 'Affected Plant (Pest/Disease detected)',
            'confidence': confidence,
            'is_healthy': is_healthy,
            'recommendations': recommendations,
            'model_info': {
                'raw_prediction_value': float(prediction),
                'model_threshold': 0.5,
                'interpretation': f'Model output: {prediction:.6f} {">" if is_healthy else "<="} threshold 0.5',
                'model_type': 'Real H5 Model (new_plant_health_classifier)',
                'crop_type': crop_type
            }
        }
        
        print(f"🤖 Real Model Prediction: {prediction:.6f} → {'Healthy' if is_healthy else 'Affected'} ({confidence}% confidence) for {crop_type}")
        
        return jsonify(result)
        
    except Exception as e:
        print(f"❌ Prediction error: {e}")
        return jsonify({
            'error': 'Prediction failed',
            'message': str(e)
        }), 500

@app.route('/model-info', methods=['GET'])
def model_info():
    """Get model information"""
    if model is None:
        return jsonify({
            'error': 'Model not loaded'
        }), 500
    
    return jsonify({
        'model_name': 'new_plant_health_classifier',
        'input_shape': list(model.input_shape),
        'output_shape': list(model.output_shape),
        'total_parameters': int(model.count_params()),
        'model_type': 'Keras Sequential CNN',
        'classification_threshold': 0.5,
        'supported_crops': [
            'tomato', 'bell-pepper', 'strawberry', 'corn',
            'palak', 'arai-keerai', 'siru-keerai'
        ]
    })

if __name__ == '__main__':
    print("🚀 Starting Plant Health ML API...")
    
    # Load the model
    if load_model():
        print("✅ Model loaded successfully!")
        print("🌐 Starting Flask server...")
        print("📡 API will be available at: http://localhost:5000")
        print("🔗 Health check: http://localhost:5000/health")
        print("🤖 Prediction endpoint: POST http://localhost:5000/predict")
        
        # Start the server
        app.run(host='0.0.0.0', port=5000, debug=False)
    else:
        print("❌ Failed to load model. Exiting...")
        exit(1)