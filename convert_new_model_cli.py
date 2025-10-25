#!/usr/bin/env python3
"""
Convert the new plant health classifier H5 model to TensorFlow.js format using CLI
"""

import os
import subprocess
import sys

def convert_h5_to_tfjs():
    """Convert H5 model to TensorFlow.js format using CLI"""
    
    # Input and output paths
    h5_model_path = "new_plant_health_classifier.h5"
    output_dir = "public/models/new_plant_health_model"
    
    # Check if input model exists
    if not os.path.exists(h5_model_path):
        print(f"❌ Error: Model file '{h5_model_path}' not found!")
        return False
    
    try:
        # Create output directory
        os.makedirs(output_dir, exist_ok=True)
        
        print("🔄 Converting H5 model to TensorFlow.js format...")
        print(f"📁 Input: {h5_model_path}")
        print(f"📁 Output: {output_dir}")
        
        # Use tensorflowjs_converter command line tool
        cmd = [
            "tensorflowjs_converter",
            "--input_format=keras",
            "--output_format=tfjs_graph_model",
            "--quantize_float16",
            h5_model_path,
            output_dir
        ]
        
        print(f"🚀 Running command: {' '.join(cmd)}")
        
        # Run the conversion
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        if result.returncode == 0:
            print("✅ Model conversion completed successfully!")
            print(f"📁 Model saved to: {output_dir}")
            
            # List generated files
            if os.path.exists(output_dir):
                print("\n📋 Generated files:")
                for file in os.listdir(output_dir):
                    file_path = os.path.join(output_dir, file)
                    if os.path.isfile(file_path):
                        size = os.path.getsize(file_path) / 1024  # Size in KB
                        print(f"  - {file} ({size:.1f} KB)")
            
            return True
        else:
            print(f"❌ Conversion failed!")
            print(f"Error: {result.stderr}")
            return False
            
    except FileNotFoundError:
        print("❌ Error: tensorflowjs_converter not found!")
        print("💡 Install it with: pip install tensorflowjs")
        return False
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