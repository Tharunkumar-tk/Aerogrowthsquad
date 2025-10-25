"""
Vercel serverless function for plant health prediction using the real H5 model
"""

import json
import base64
import io
import os
import numpy as np
from PIL import Image
import tensorflow as tf
from http.server import BaseHTTPRequestHandler

# Global model variable (loaded once per cold start)
model = None

def load_model():
    """Load the H5 model"""
    global model
    if model is not None:
        return model
    
    # Try different possible paths for the model
    possible_paths = [
        "new_plant_health_classifier.h5",
        "../new_plant_health_classifier.h5",
        "./new_plant_health_classifier.h5",
        "/var/task/new_plant_health_classifier.h5"
    ]
    
    model_path = None
    for path in possible_paths:
        if os.path.exists(path):
            model_path = path
            break
    
    if not model_path:
        raise Exception("Model file new_plant_health_classifier.h5 not found")
    
    try:
        model = tf.keras.models.load_model(model_path)
        print(f"✅ Model loaded from: {model_path}")
        return model
    except Exception as e:
        raise Exception(f"Failed to load model: {str(e)}")

def preprocess_image(image_data):
    """Preprocess image exactly like the training data"""
    try:
        # Handle data URL format
        if image_data.startswith('data:image'):
            image_data = image_data.split(',')[1]
        
        # Decode base64
        image_bytes = base64.b64decode(image_data)
        
        # Load and process image
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
        raise Exception(f"Image preprocessing failed: {str(e)}")

def get_crop_recommendations(is_healthy, crop_type):
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

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            # Parse request
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            
            # Validate input
            if 'image' not in data:
                self.send_error_response(400, "No image data provided")
                return
            
            image_data = data['image']
            crop_type = data.get('cropType', 'Unknown Crop')
            
            # Load model (cached after first load)
            model = load_model()
            
            # Preprocess image
            img_array = preprocess_image(image_data)
            
            # Make prediction
            prediction = model.predict(img_array, verbose=0)[0][0]
            
            # Process results
            is_healthy = prediction > 0.5
            confidence = int((prediction if is_healthy else (1 - prediction)) * 100)
            
            # Get recommendations
            recommendations = get_crop_recommendations(is_healthy, crop_type)
            
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
                    'model_type': 'Real H5 Model (Vercel Serverless)',
                    'crop_type': crop_type
                }
            }
            
            # Send response
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type')
            self.end_headers()
            
            self.wfile.write(json.dumps(result).encode('utf-8'))
            
        except Exception as e:
            self.send_error_response(500, str(e))
    
    def do_OPTIONS(self):
        # Handle CORS preflight
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
    
    def send_error_response(self, code, message):
        self.send_response(code)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        
        error_response = {
            'error': message,
            'code': code
        }
        self.wfile.write(json.dumps(error_response).encode('utf-8'))