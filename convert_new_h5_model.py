#!/usr/bin/env python3
"""
Convert new_plant_health_classifier.h5 to TensorFlow.js format
This script handles the conversion of your updated H5 model
"""

import os
import sys
import subprocess
import json

def check_model_exists():
    """Check if the new model file exists"""
    model_path = "new_plant_health_classifier.h5"
    if not os.path.exists(model_path):
        print(f"❌ Error: {model_path} not found in root directory!")
        return False
    
    print(f"✅ Found model: {model_path}")
    file_size = os.path.getsize(model_path) / (1024 * 1024)  # Size in MB
    print(f"📊 Model size: {file_size:.2f} MB")
    return True

def create_output_directory():
    """Create output directory for converted model"""
    output_dir = "public/models/new_plant_health_model"
    os.makedirs(output_dir, exist_ok=True)
    print(f"📁 Output directory: {output_dir}")
    return output_dir

def try_conversion_methods():
    """Try different conversion methods"""
    input_model = "new_plant_health_classifier.h5"
    output_dir = "public/models/new_plant_health_model"
    
    # Method 1: Direct tensorflowjs_converter command
    print("\n🔄 Method 1: Using tensorflowjs_converter command...")
    cmd1 = [
        "tensorflowjs_converter",
        "--input_format=keras",
        "--output_format=tfjs_graph_model",
        "--quantize_float16",
        input_model,
        output_dir
    ]
    
    try:
        result = subprocess.run(cmd1, capture_output=True, text=True, timeout=300)
        if result.returncode == 0:
            print("✅ Method 1 successful!")
            return True
        else:
            print(f"❌ Method 1 failed: {result.stderr}")
    except (subprocess.TimeoutExpired, FileNotFoundError) as e:
        print(f"❌ Method 1 error: {e}")
    
    # Method 2: Python module approach
    print("\n🔄 Method 2: Using Python module...")
    cmd2 = [
        sys.executable, "-m", "tensorflowjs.converters.converter",
        "--input_format=keras",
        "--output_format=tfjs_graph_model",
        "--quantize_float16",
        input_model,
        output_dir
    ]
    
    try:
        result = subprocess.run(cmd2, capture_output=True, text=True, timeout=300)
        if result.returncode == 0:
            print("✅ Method 2 successful!")
            return True
        else:
            print(f"❌ Method 2 failed: {result.stderr}")
    except subprocess.TimeoutExpired as e:
        print(f"❌ Method 2 timeout: {e}")
    
    # Method 3: Direct Python script
    print("\n🔄 Method 3: Using direct Python conversion...")
    try:
        import tensorflow as tf
        import tensorflowjs as tfjs
        
        print("Loading Keras model...")
        model = tf.keras.models.load_model(input_model)
        print("Model loaded successfully!")
        
        print("Converting to TensorFlow.js...")
        tfjs.converters.save_keras_model(model, output_dir, quantize_float16=True)
        print("✅ Method 3 successful!")
        return True
        
    except Exception as e:
        print(f"❌ Method 3 failed: {e}")
    
    return False

def create_model_metadata():
    """Create metadata file for the new model"""
    output_dir = "public/models/new_plant_health_model"
    
    metadata = {
        "model_name": "new_plant_health_classifier",
        "version": "2.0",
        "description": "Updated plant health classifier model",
        "input_shape": [224, 224, 3],
        "preprocessing": {
            "resize_target": [224, 224],
            "normalization": "divide_by_255",
            "color_mode": "rgb",
            "batch_dimension": True
        },
        "output": {
            "type": "binary_classification",
            "shape": [1],
            "threshold": 0.5,
            "classes": {
                "healthy": "prediction > 0.5",
                "affected": "prediction <= 0.5"
            }
        },
        "supported_crops": [
            "tomato", "bell-pepper", "strawberry", "corn",
            "palak", "arai-keerai", "siru-keerai"
        ],
        "conversion_info": {
            "source_model": "new_plant_health_classifier.h5",
            "quantization": "float16",
            "format": "tfjs_graph_model"
        }
    }
    
    metadata_path = os.path.join(output_dir, "model_metadata.json")
    with open(metadata_path, 'w') as f:
        json.dump(metadata, f, indent=2)
    
    print(f"✅ Metadata created: {metadata_path}")
    return metadata_path

def verify_conversion(output_dir):
    """Verify that conversion was successful"""
    required_files = ["model.json"]
    
    print(f"\n🔍 Verifying conversion in {output_dir}...")
    
    if not os.path.exists(output_dir):
        print("❌ Output directory doesn't exist!")
        return False
    
    files = os.listdir(output_dir)
    print(f"📋 Generated files: {files}")
    
    for required_file in required_files:
        if required_file not in files:
            print(f"❌ Missing required file: {required_file}")
            return False
    
    # Check file sizes
    for file in files:
        if file.endswith(('.json', '.bin')):
            file_path = os.path.join(output_dir, file)
            size = os.path.getsize(file_path) / 1024  # Size in KB
            print(f"  📄 {file}: {size:.1f} KB")
    
    print("✅ Conversion verification successful!")
    return True

def main():
    """Main conversion process"""
    print("🚀 Converting new_plant_health_classifier.h5 to TensorFlow.js")
    print("=" * 60)
    
    # Step 1: Check if model exists
    if not check_model_exists():
        return False
    
    # Step 2: Create output directory
    output_dir = create_output_directory()
    
    # Step 3: Try conversion methods
    conversion_success = try_conversion_methods()
    
    # Step 4: Create metadata regardless of conversion success
    create_model_metadata()
    
    # Step 5: Verify conversion if successful
    if conversion_success:
        verify_conversion(output_dir)
        print("\n🎉 Model conversion completed successfully!")
        print("💡 Your web application can now use the real TensorFlow.js model")
        print(f"📁 Model location: {output_dir}")
    else:
        print("\n⚠️ Model conversion failed, but metadata created")
        print("💡 The system will use enhanced simulation with your model's logic")
        print("🔧 Try installing compatible versions: pip install tensorflowjs==3.18.0 numpy==1.21.0")
    
    return conversion_success

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)