#!/usr/bin/env python3
"""
Analyze the new_plant_health_classifier.h5 model structure
"""

import os
import sys
import numpy as np

def analyze_model():
    """Analyze the model structure and create detailed info"""
    
    model_path = "new_plant_health_classifier.h5"
    
    if not os.path.exists(model_path):
        print(f"❌ Model file {model_path} not found!")
        return False
    
    try:
        import tensorflow as tf
        print("🔄 Loading model for analysis...")
        
        # Load the model
        model = tf.keras.models.load_model(model_path)
        
        print("✅ Model loaded successfully!")
        print("\n📊 Model Architecture:")
        print("=" * 50)
        
        # Print model summary
        model.summary()
        
        print("\n📋 Model Details:")
        print("=" * 50)
        print(f"Input shape: {model.input_shape}")
        print(f"Output shape: {model.output_shape}")
        print(f"Total parameters: {model.count_params():,}")
        print(f"Trainable parameters: {sum([tf.keras.backend.count_params(w) for w in model.trainable_weights]):,}")
        
        # Analyze layers
        print(f"\n🏗️ Layer Structure:")
        print("=" * 50)
        for i, layer in enumerate(model.layers):
            print(f"Layer {i+1}: {layer.name} ({layer.__class__.__name__})")
            if hasattr(layer, 'output_shape'):
                print(f"  Output shape: {layer.output_shape}")
            if hasattr(layer, 'activation') and layer.activation:
                print(f"  Activation: {layer.activation.__name__}")
        
        # Test with dummy input
        print(f"\n🧪 Testing Model Prediction:")
        print("=" * 50)
        
        # Create dummy input (224x224x3 image)
        dummy_input = np.random.rand(1, 224, 224, 3).astype(np.float32)
        print(f"Dummy input shape: {dummy_input.shape}")
        
        # Make prediction
        prediction = model.predict(dummy_input, verbose=0)
        print(f"Prediction shape: {prediction.shape}")
        print(f"Prediction value: {prediction[0][0]:.6f}")
        print(f"Classification: {'Healthy' if prediction[0][0] > 0.5 else 'Affected'}")
        
        # Create comprehensive model info
        model_info = {
            "model_name": "new_plant_health_classifier",
            "version": "2.0",
            "file_size_mb": round(os.path.getsize(model_path) / (1024 * 1024), 2),
            "architecture": {
                "input_shape": list(model.input_shape[1:]),  # Remove batch dimension
                "output_shape": list(model.output_shape[1:]),  # Remove batch dimension
                "total_parameters": int(model.count_params()),
                "total_layers": len(model.layers)
            },
            "preprocessing": {
                "target_size": [224, 224],
                "normalization": "divide_by_255",
                "color_mode": "rgb",
                "batch_dimension": True
            },
            "prediction": {
                "type": "binary_classification",
                "threshold": 0.5,
                "output_range": [0.0, 1.0],
                "healthy_condition": "prediction > 0.5",
                "affected_condition": "prediction <= 0.5"
            },
            "supported_crops": [
                "tomato", "bell-pepper", "strawberry", "corn",
                "palak", "arai-keerai", "siru-keerai"
            ],
            "usage_example": {
                "load": "model = tf.keras.models.load_model('new_plant_health_classifier.h5')",
                "preprocess": "img = image.load_img(path, target_size=(224, 224)); img_array = image.img_to_array(img) / 255.0; img_array = np.expand_dims(img_array, axis=0)",
                "predict": "prediction = model.predict(img_array)[0][0]",
                "classify": "result = 'Healthy Plant' if prediction > 0.5 else 'Affected Plant (Pest/Disease detected)'"
            }
        }
        
        # Save model info
        import json
        output_dir = "public/models/new_plant_health_model"
        os.makedirs(output_dir, exist_ok=True)
        
        info_path = os.path.join(output_dir, "model_analysis.json")
        with open(info_path, 'w') as f:
            json.dump(model_info, f, indent=2)
        
        print(f"\n✅ Model analysis saved to: {info_path}")
        
        # Test multiple predictions for consistency
        print(f"\n🔬 Consistency Test (5 random inputs):")
        print("=" * 50)
        for i in range(5):
            test_input = np.random.rand(1, 224, 224, 3).astype(np.float32)
            test_pred = model.predict(test_input, verbose=0)[0][0]
            result = "Healthy" if test_pred > 0.5 else "Affected"
            print(f"Test {i+1}: {test_pred:.6f} → {result}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error analyzing model: {e}")
        return False

if __name__ == "__main__":
    print("🔍 Analyzing new_plant_health_classifier.h5")
    print("=" * 60)
    
    success = analyze_model()
    
    if success:
        print("\n🎉 Model analysis completed!")
        print("💡 The web application will use this analysis for enhanced simulation")
    else:
        print("\n💥 Model analysis failed!")
    
    sys.exit(0 if success else 1)