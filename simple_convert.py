#!/usr/bin/env python3
"""
Simple conversion script for the new plant health classifier
"""

import os
import sys

def convert_model():
    """Convert H5 model using command line"""
    
    input_model = "new_plant_health_classifier.h5"
    output_dir = "public/models/new_plant_health_model"
    
    if not os.path.exists(input_model):
        print(f"❌ Model file {input_model} not found!")
        return False
    
    # Create output directory
    os.makedirs(output_dir, exist_ok=True)
    
    # Try different conversion approaches
    commands = [
        f"tensorflowjs_converter --input_format=keras --output_format=tfjs_graph_model {input_model} {output_dir}",
        f"python -m tensorflowjs.converters.converter --input_format=keras --output_format=tfjs_graph_model {input_model} {output_dir}",
    ]
    
    for cmd in commands:
        print(f"🔄 Trying: {cmd}")
        result = os.system(cmd)
        if result == 0:
            print("✅ Conversion successful!")
            return True
        else:
            print(f"❌ Command failed with code {result}")
    
    print("💡 Manual conversion needed. For now, the system will use enhanced simulation.")
    return False

if __name__ == "__main__":
    print("🚀 Simple model conversion...")
    convert_model()