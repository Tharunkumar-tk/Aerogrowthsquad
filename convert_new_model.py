#!/usr/bin/env python3
"""
Convert the new plant health classifier H5 model to TensorFlow.js format
"""

import os
import sys
import tensorflow as tf
import tensorflowjs as tfjs

def convert_h5_to_tfjs():
    """Convert H5 model to TensorFlow.js format"""
    
    # Input and output paths
    h5_model_path = "new_plant_health_classifier.h5"
    output_dir = "public/models/new_plant_health_model"
    
    # Check if input model exists
    if not os.path.exists(h5_model_path):
        print(f"❌ Error: Model file '{h5_model_path}' not found!")
        return False
    
    try:
        print("🔄 Loading H5 model...")
        model = tf.keras.models.load_model(h5_model_path)
        
        print("📊 Model Summary:")
        model.summary()
        
        # Create output directory
        os.makedirs(output_dir, exist_ok=True)
        
        print(f"🔄 Converting to TensorFlow.js format...")
        print(f"📁 Output directory: {output_dir}")
        
        # Convert model to TensorFlow.js format
        tfjs.converters.save_keras_model(
            model, 
            output_dir,
            quantize_float16=True  # Optimize for mobile/web
        )
        
        print("✅ Model conversion completed successfully!")
        print(f"📁 Model saved to: {output_dir}")
        
        # List generated files
        print("\n📋 Generated files:")
        for file in os.listdir(output_dir):
            file_path = os.path.join(output_dir, file)
            size = os.path.getsize(file_path) / 1024  # Size in KB
            print(f"  - {file} ({size:.1f} KB)")
        
        return True
        
    except Exception as e:
        print(f"❌ Error during conversion: {str(e)}")
        return False

if __name__ == "__main__":
    print("🚀 Starting new plant health model conversion...")
    success = convert_h5_to_tfjs()
    
    if success:
        print("\n🎉 Conversion completed successfully!")
        print("💡 You can now use the converted model in your web application.")
    else:
        print("\n💥 Conversion failed!")
        sys.exit(1)