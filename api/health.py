"""
Vercel serverless function for health check
"""

import json
import os
from http.server import BaseHTTPRequestHandler

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        try:
            # Check if model file exists
            model_exists = any(os.path.exists(path) for path in [
                "new_plant_health_classifier.h5",
                "../new_plant_health_classifier.h5",
                "./new_plant_health_classifier.h5",
                "/var/task/new_plant_health_classifier.h5"
            ])
            
            result = {
                'status': 'healthy',
                'model_available': model_exists,
                'message': 'Plant Health ML API is running on Vercel',
                'platform': 'Vercel Serverless',
                'supported_crops': [
                    'tomato', 'bell-pepper', 'strawberry', 'corn',
                    'palak', 'arai-keerai', 'siru-keerai'
                ]
            }
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            self.wfile.write(json.dumps(result).encode('utf-8'))
            
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            error_response = {
                'error': str(e),
                'status': 'error'
            }
            self.wfile.write(json.dumps(error_response).encode('utf-8'))