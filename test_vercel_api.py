#!/usr/bin/env python3
"""
Test script for Vercel ML API deployment
"""

import requests
import base64
import json
import os

def test_health_endpoint(base_url):
    """Test the health endpoint"""
    try:
        print(f"🔍 Testing health endpoint: {base_url}/api/health")
        response = requests.get(f"{base_url}/api/health", timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Health check passed!")
            print(f"   Status: {data.get('status')}")
            print(f"   Model Available: {data.get('model_available')}")
            print(f"   Platform: {data.get('platform')}")
            return True
        else:
            print(f"❌ Health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Health check error: {e}")
        return False

def test_prediction_endpoint(base_url, image_path=None):
    """Test the prediction endpoint"""
    try:
        print(f"🔍 Testing prediction endpoint: {base_url}/api/predict")
        
        # Create a simple test image if none provided
        if not image_path or not os.path.exists(image_path):
            print("📸 Creating test image...")
            from PIL import Image
            import io
            
            # Create a simple green image (simulating a leaf)
            img = Image.new('RGB', (224, 224), color=(50, 150, 50))
            buffer = io.BytesIO()
            img.save(buffer, format='JPEG')
            image_data = base64.b64encode(buffer.getvalue()).decode('utf-8')
            image_data = f"data:image/jpeg;base64,{image_data}"
        else:
            print(f"📸 Using image: {image_path}")
            with open(image_path, 'rb') as f:
                image_data = base64.b64encode(f.read()).decode('utf-8')
                image_data = f"data:image/jpeg;base64,{image_data}"
        
        # Test prediction
        payload = {
            "image": image_data,
            "cropType": "Palak (Spinach)"
        }
        
        response = requests.post(
            f"{base_url}/api/predict",
            json=payload,
            headers={'Content-Type': 'application/json'},
            timeout=30
        )
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Prediction successful!")
            print(f"   Prediction: {data.get('prediction')}")
            print(f"   Confidence: {data.get('confidence')}%")
            print(f"   Is Healthy: {data.get('is_healthy')}")
            print(f"   Model Type: {data.get('model_info', {}).get('model_type')}")
            return True
        else:
            print(f"❌ Prediction failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Prediction error: {e}")
        return False

def main():
    """Main test function"""
    print("🚀 Testing Vercel ML API Deployment")
    print("=" * 50)
    
    # Get base URL
    base_url = input("Enter your Vercel app URL (e.g., https://your-app.vercel.app): ").strip()
    if not base_url:
        base_url = "http://localhost:3000"  # Default for local testing
    
    # Remove trailing slash
    base_url = base_url.rstrip('/')
    
    print(f"🌐 Testing: {base_url}")
    print()
    
    # Test health endpoint
    health_ok = test_health_endpoint(base_url)
    print()
    
    # Test prediction endpoint
    prediction_ok = test_prediction_endpoint(base_url)
    print()
    
    # Summary
    print("📊 Test Summary:")
    print(f"   Health Endpoint: {'✅ PASS' if health_ok else '❌ FAIL'}")
    print(f"   Prediction Endpoint: {'✅ PASS' if prediction_ok else '❌ FAIL'}")
    
    if health_ok and prediction_ok:
        print("\n🎉 All tests passed! Your Vercel ML API is working correctly.")
    else:
        print("\n⚠️ Some tests failed. Check the logs above for details.")

if __name__ == "__main__":
    main()