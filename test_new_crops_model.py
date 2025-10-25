#!/usr/bin/env python3
"""
Test the new crops model with labeled images and adjust parameters accordingly
"""

import os
import sys
import json
from pathlib import Path
import numpy as np
from PIL import Image
import tensorflow as tf

def load_and_preprocess_image(image_path):
    """Load and preprocess image exactly like the web app does"""
    try:
        # Load image
        img = Image.open(image_path)
        
        # Convert to RGB if needed
        if img.mode != 'RGB':
            img = img.convert('RGB')
        
        # Resize to 224x224
        img = img.resize((224, 224))
        
        # Convert to numpy array and normalize
        img_array = np.array(img) / 255.0
        
        # Add batch dimension
        img_array = np.expand_dims(img_array, axis=0)
        
        return img_array
    except Exception as e:
        print(f"Error loading {image_path}: {e}")
        return None

def analyze_image_features(img_array):
    """Analyze image features like the web app does"""
    if img_array is None:
        return None
    
    # Remove batch dimension for analysis
    img = img_array[0]
    
    # Calculate basic statistics
    brightness = np.mean(img)
    variance = np.var(img)
    contrast = np.sqrt(variance)
    
    # Analyze color channels
    r_mean = np.mean(img[:, :, 0])
    g_mean = np.mean(img[:, :, 1])
    b_mean = np.mean(img[:, :, 2])
    
    # Calculate green dominance
    total_color = r_mean + g_mean + b_mean + 0.001
    green_dominance = g_mean / total_color
    
    # Calculate color balance
    color_balance = abs(r_mean - b_mean)
    
    # Simple edge detection for texture
    gray = np.mean(img, axis=2)
    edges_x = np.abs(np.diff(gray, axis=1))
    edges_y = np.abs(np.diff(gray, axis=0))
    texture_complexity = np.mean(edges_x) + np.mean(edges_y)
    
    return {
        'brightness': brightness,
        'contrast': contrast,
        'green_dominance': green_dominance,
        'color_balance': color_balance,
        'texture_complexity': texture_complexity,
        'r_mean': r_mean,
        'g_mean': g_mean,
        'b_mean': b_mean
    }

def simulate_web_model_prediction(features, crop_type):
    """Simulate the simplified web model prediction logic"""
    if features is None:
        return 0.0
    
    # Simplified health score calculation (matching web app)
    health_score = 0.5  # Start neutral
    
    # Primary health indicators
    if (features['brightness'] > 0.6 and 
        features['green_dominance'] > 0.35 and 
        features['texture_complexity'] > 0.02):
        health_score = 0.95  # Strong healthy signal
    elif (features['brightness'] > 0.4 and 
          features['green_dominance'] > 0.3):
        health_score = 0.75  # Moderate healthy signal
    elif (features['brightness'] < 0.3 or 
          features['green_dominance'] < 0.25):
        health_score = 0.15  # Strong affected signal
    else:
        health_score = 0.45  # Borderline/unclear
    
    # Fine-tune based on additional factors
    if 0.2 < features['contrast'] < 0.4:
        health_score += 0.05  # Good contrast
    if features['color_balance'] > 0.3:
        health_score -= 0.1  # Unnatural colors
    
    # Apply small crop-specific adjustments
    crop_adjustment = get_crop_adjustment(crop_type)
    health_score += crop_adjustment * 0.1  # Much smaller impact
    
    # Add controlled randomness
    health_score += np.random.normal(0, 0.01)
    
    # Ensure realistic range
    final_prediction = max(0.001, min(0.999, health_score))
    
    return final_prediction

def get_crop_adjustment(crop_type):
    """Get crop-specific adjustment (matching web app logic)"""
    if not crop_type:
        return 0.0
    
    crop = crop_type.lower()
    
    if 'palak' in crop or 'keerai' in crop or 'spinach' in crop:
        return 0.1
    elif 'arai' in crop or 'siru' in crop:
        return 0.1
    elif 'tomato' in crop:
        return -0.5
    elif 'pepper' in crop:
        return -0.3
    elif 'strawberry' in crop:
        return -0.8
    elif 'corn' in crop or 'maize' in crop:
        return 0.3
    
    return 0.0

def test_model_with_real_h5():
    """Test with the actual H5 model if available"""
    model_path = "new_plant_health_classifier.h5"
    
    if not os.path.exists(model_path):
        print("❌ H5 model not found, using simulation only")
        return None
    
    try:
        model = tf.keras.models.load_model(model_path)
        print("✅ H5 model loaded successfully")
        return model
    except Exception as e:
        print(f"❌ Failed to load H5 model: {e}")
        return None

def parse_filename(filename):
    """Parse filename to extract crop type and expected result"""
    filename = filename.lower()
    
    # Determine crop type
    if 'arai' in filename:
        crop_type = 'arai keerai'
    elif 'palak' in filename:
        crop_type = 'palak'
    elif 'siru' in filename:
        crop_type = 'siru keerai'
    else:
        crop_type = 'unknown'
    
    # Determine expected result
    if 'unhealthy' in filename:
        expected_healthy = False
    elif 'healthy' in filename:
        expected_healthy = True
    else:
        expected_healthy = True  # Default to healthy if unclear
    
    return crop_type, expected_healthy

def test_all_images():
    """Test all images in the test folder"""
    test_folder = "new crops test"
    
    if not os.path.exists(test_folder):
        print(f"❌ Test folder '{test_folder}' not found!")
        return
    
    # Load H5 model if available
    h5_model = test_model_with_real_h5()
    
    results = []
    correct_predictions = 0
    total_predictions = 0
    
    print("\n🧪 Testing New Crops Model Performance")
    print("=" * 60)
    
    # Get all image files
    image_files = [f for f in os.listdir(test_folder) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
    image_files.sort()
    
    for filename in image_files:
        image_path = os.path.join(test_folder, filename)
        crop_type, expected_healthy = parse_filename(filename)
        
        print(f"\n📸 Testing: {filename}")
        print(f"   Crop: {crop_type}")
        print(f"   Expected: {'Healthy' if expected_healthy else 'Affected'}")
        
        # Load and preprocess image
        img_array = load_and_preprocess_image(image_path)
        if img_array is None:
            continue
        
        # Analyze features
        features = analyze_image_features(img_array)
        
        # Test with simulation
        sim_prediction = simulate_web_model_prediction(features, crop_type)
        sim_healthy = sim_prediction > 0.5
        sim_correct = sim_healthy == expected_healthy
        
        print(f"   🎭 Simulation: {sim_prediction:.6f} → {'Healthy' if sim_healthy else 'Affected'} {'✅' if sim_correct else '❌'}")
        
        # Test with H5 model if available
        h5_prediction = None
        h5_correct = None
        if h5_model is not None:
            try:
                h5_pred_raw = h5_model.predict(img_array, verbose=0)[0][0]
                h5_healthy = h5_pred_raw > 0.5
                h5_correct = h5_healthy == expected_healthy
                print(f"   🤖 H5 Model: {h5_pred_raw:.6f} → {'Healthy' if h5_healthy else 'Affected'} {'✅' if h5_correct else '❌'}")
                h5_prediction = h5_pred_raw
            except Exception as e:
                print(f"   ❌ H5 Model error: {e}")
        
        # Store results
        result = {
            'filename': filename,
            'crop_type': crop_type,
            'expected_healthy': expected_healthy,
            'features': features,
            'simulation_prediction': sim_prediction,
            'simulation_correct': sim_correct,
            'h5_prediction': h5_prediction,
            'h5_correct': h5_correct
        }
        results.append(result)
        
        if sim_correct:
            correct_predictions += 1
        total_predictions += 1
    
    # Calculate accuracy
    accuracy = (correct_predictions / total_predictions) * 100 if total_predictions > 0 else 0
    
    print(f"\n📊 Overall Results:")
    print(f"   Accuracy: {correct_predictions}/{total_predictions} ({accuracy:.1f}%)")
    
    # Analyze by crop type
    crop_results = {}
    for result in results:
        crop = result['crop_type']
        if crop not in crop_results:
            crop_results[crop] = {'correct': 0, 'total': 0}
        
        if result['simulation_correct']:
            crop_results[crop]['correct'] += 1
        crop_results[crop]['total'] += 1
    
    print(f"\n📈 Results by Crop:")
    for crop, stats in crop_results.items():
        crop_accuracy = (stats['correct'] / stats['total']) * 100
        print(f"   {crop}: {stats['correct']}/{stats['total']} ({crop_accuracy:.1f}%)")
    
    # Save detailed results
    output_file = "test_results.json"
    with open(output_file, 'w') as f:
        json.dump(results, f, indent=2, default=str)
    
    print(f"\n💾 Detailed results saved to: {output_file}")
    
    # Suggest adjustments if accuracy is low
    if accuracy < 80:
        print(f"\n🔧 Suggested Adjustments:")
        suggest_adjustments(results)
    
    return results

def suggest_adjustments(results):
    """Suggest parameter adjustments based on test results"""
    
    # Analyze incorrect predictions
    incorrect_results = [r for r in results if not r['simulation_correct']]
    
    crop_issues = {}
    for result in incorrect_results:
        crop = result['crop_type']
        expected = result['expected_healthy']
        predicted = result['simulation_prediction'] > 0.5
        
        if crop not in crop_issues:
            crop_issues[crop] = {'false_positive': 0, 'false_negative': 0}
        
        if expected and not predicted:
            crop_issues[crop]['false_negative'] += 1
        elif not expected and predicted:
            crop_issues[crop]['false_positive'] += 1
    
    for crop, issues in crop_issues.items():
        current_adjustment = get_crop_adjustment(crop)
        
        if issues['false_negative'] > issues['false_positive']:
            # Too many healthy images classified as affected - increase boost
            suggested_adjustment = current_adjustment + 0.5
            print(f"   {crop}: Increase adjustment to {suggested_adjustment} (currently {current_adjustment})")
        elif issues['false_positive'] > issues['false_negative']:
            # Too many affected images classified as healthy - decrease boost
            suggested_adjustment = current_adjustment - 0.3
            print(f"   {crop}: Decrease adjustment to {suggested_adjustment} (currently {current_adjustment})")

if __name__ == "__main__":
    print("🚀 Testing New Crops Model with Labeled Images")
    print("=" * 60)
    
    # Set random seed for reproducible results
    np.random.seed(42)
    
    results = test_all_images()
    
    print("\n🎉 Testing completed!")
    print("💡 Check the console output and test_results.json for detailed analysis")