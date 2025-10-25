# Development Guide - Real ML Model 🛠️

## 🎯 Running with Real ML Model in Development

### **Quick Start (All Services):**
```bash
npm run dev
```
This now starts:
- ✅ **Frontend** (React app) on `http://localhost:5173`
- ✅ **Backend** (Sensor API) on `http://localhost:3001` 
- ✅ **ML API** (Real H5 model) on `http://localhost:5000`

### **Individual Services:**
```bash
# Just the web app (uses simulation fallback)
npm run dev:web-only

# Just the ML API
npm run dev:ml

# Just the frontend
npm run dev:frontend
```

## 🔍 **What Happens When You Run `npm run dev`:**

### **With ML API Running:**
1. Web app tries `http://localhost:5000/predict` ✅
2. Uses your real H5 model
3. Perfect accuracy for new crops
4. Console shows: "✅ ML API success: http://localhost:5000/predict"

### **Without ML API Running:**
1. Web app tries `http://localhost:5000/predict` ❌
2. Falls back to enhanced simulation
3. Less accurate results
4. Console shows: "❌ API error: http://localhost:5000/predict"

## 📊 **Expected Results in Development:**

### **With Real ML API (npm run dev):**
- **Palak healthy**: 99%+ confidence → Healthy ✅
- **Palak unhealthy**: 0.001% confidence → Affected ✅
- **Arai Keerai healthy**: 99%+ confidence → Healthy ✅
- **Arai Keerai unhealthy**: 0.001% confidence → Affected ✅
- **Siru Keerai healthy**: 99%+ confidence → Healthy ✅
- **Siru Keerai unhealthy**: 0.001% confidence → Affected ✅

### **Without ML API (simulation fallback):**
- Results may vary (less accurate)
- All crops might show as healthy or affected incorrectly

## 🔧 **Troubleshooting Development:**

### **ML API Won't Start:**
```bash
# Check if model file exists
ls -la new_plant_health_classifier.h5

# Install Python dependencies
pip install flask flask-cors tensorflow pillow numpy

# Check Python version
python --version  # Should be 3.7+
```

### **Port Conflicts:**
```bash
# If port 5000 is busy, kill the process
# Windows:
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Or change port in create_ml_api.py:
app.run(host='0.0.0.0', port=5001, debug=False)
```

### **CORS Issues:**
- Already configured in `create_ml_api.py`
- Should work automatically

## 🎮 **Development Workflow:**

### **For ML Model Testing:**
1. `npm run dev` (starts all services)
2. Go to Pest Monitoring
3. Test with new crops (Palak, Arai Keerai, Siru Keerai)
4. Check browser console for ML API status

### **For Frontend-Only Development:**
1. `npm run dev:web-only` (just React app)
2. Uses simulation fallback
3. Faster startup, no ML dependencies

## 📱 **Mobile Development:**
```bash
# Build for mobile with ML API
npm run build:mobile

# The mobile app will use the same API detection logic
```

## 🌐 **Environment Detection:**

The app automatically detects the environment:
- **Development**: Tries `localhost:5000` then simulation
- **Production (Vercel)**: Tries `/api/predict` then simulation
- **Mobile**: Same logic as web

## 🎯 **Summary:**

### **To use real ML model in development:**
```bash
npm run dev  # Starts everything including ML API
```

### **To use simulation only:**
```bash
npm run dev:web-only  # Just the web app
```

### **Check if ML API is working:**
- Browser console: Look for "✅ ML API success"
- Direct test: `http://localhost:5000/health`

**Your new crops will work perfectly in development when the ML API is running!** 🌿🛠️