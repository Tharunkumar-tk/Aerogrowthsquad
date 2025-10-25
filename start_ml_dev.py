#!/usr/bin/env python3
"""
Robust ML API startup script for development
"""

import os
import sys
import subprocess
import time

def check_dependencies():
    """Check if required Python packages are installed"""
    required_packages = [
        'flask',
        'flask_cors', 
        'tensorflow',
        'PIL',
        'numpy'
    ]
    
    missing_packages = []
    
    for package in required_packages:
        try:
            if package == 'PIL':
                import PIL
            elif package == 'flask_cors':
                import flask_cors
            else:
                __import__(package)
        except ImportError:
            missing_packages.append(package)
    
    if missing_packages:
        print(f"❌ Missing packages: {', '.join(missing_packages)}")
        print("💡 Installing missing packages...")
        
        # Map package names to pip install names
        pip_names = {
            'PIL': 'Pillow',
            'flask_cors': 'flask-cors'
        }
        
        for package in missing_packages:
            pip_name = pip_names.get(package, package)
            try:
                subprocess.check_call([sys.executable, '-m', 'pip', 'install', pip_name])
                print(f"✅ Installed {pip_name}")
            except subprocess.CalledProcessError:
                print(f"❌ Failed to install {pip_name}")
                return False
    
    return True

def check_model_file():
    """Check if the model file exists"""
    model_path = "new_plant_health_classifier.h5"
    
    if not os.path.exists(model_path):
        print(f"❌ Model file not found: {model_path}")
        print("💡 Make sure the model file is in the root directory")
        return False
    
    file_size = os.path.getsize(model_path) / (1024 * 1024)  # Size in MB
    print(f"✅ Model file found: {model_path} ({file_size:.1f} MB)")
    return True

def start_ml_api():
    """Start the ML API with error handling"""
    try:
        print("🚀 Starting ML API for development...")
        
        # Import and run the ML API
        from create_ml_api import app, load_model
        
        # Load model first
        print("🔄 Loading ML model...")
        if load_model():
            print("✅ ML model loaded successfully!")
            print("🌐 Starting Flask server on http://localhost:5000")
            print("🔗 Health check: http://localhost:5000/health")
            print("🤖 Prediction endpoint: http://localhost:5000/predict")
            print("=" * 60)
            
            # Start the server
            app.run(host='0.0.0.0', port=5000, debug=False)
        else:
            print("❌ Failed to load ML model")
            return False
            
    except ImportError as e:
        print(f"❌ Import error: {e}")
        print("💡 Make sure create_ml_api.py exists")
        return False
    except Exception as e:
        print(f"❌ Error starting ML API: {e}")
        return False

def main():
    """Main function"""
    print("🔍 ML API Development Startup")
    print("=" * 40)
    
    # Check dependencies
    if not check_dependencies():
        print("❌ Dependency check failed")
        sys.exit(1)
    
    # Check model file
    if not check_model_file():
        print("❌ Model file check failed")
        sys.exit(1)
    
    # Start ML API
    start_ml_api()

if __name__ == "__main__":
    main()