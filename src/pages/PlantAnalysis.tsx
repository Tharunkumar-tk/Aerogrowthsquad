import { useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Upload, Camera, X, CheckCircle, Image as ImageIcon, Sparkles, Leaf, AlertTriangle, ArrowLeft } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { isMobile, takePicture, selectFromGallery } from "@/utils/mobile";
import { shouldUseMobileLayout } from "@/utils/mobileDetection";
import { MOBILE_CONFIG } from "@/config/mobile";
import { realPlantHealthModel } from "@/services/realPlantHealthModel";
import { cropData } from "@/lib/mockData";

export interface AnalysisResult {
  prediction: string;
  confidence: number;
  is_healthy: boolean;
  recommendations: string;
  imageUrl: string;
  model_info?: {
    raw_prediction_value: number;
    model_threshold: number;
    interpretation: string;
  };
  correlatedMetrics?: {
    pH: number;
    humidity: number;
    tds: number;
  };
}

const PlantAnalysis = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const cropId = searchParams.get('crop');
  
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const cropData_item = cropData.find(c => c.id === cropId);
  const cropName = cropData_item?.name || "Unknown Crop";

  const handleFileSelect = (file: File) => {
    if (file.size > MOBILE_CONFIG.mlConfig.maxImageSize) {
      return;
    }

    if (!MOBILE_CONFIG.mlConfig.supportedFormats.includes(file.type)) {
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleTakePicture = async () => {
    try {
      const imageData = await takePicture();
      if (imageData) {
        setPreview(imageData);
      }
    } catch (error) {
      console.log('Camera access failed');
    }
  };

  const handleSelectFromGallery = async () => {
    try {
      const imageData = await selectFromGallery();
      if (imageData) {
        setPreview(imageData);
      }
    } catch (error) {
      console.log('Gallery access failed');
    }
  };

  const analyzeImage = async () => {
    if (!preview) return;

    setUploading(true);
    setProgress(0);

    try {
      // Progress simulation
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 80) {
            clearInterval(progressInterval);
            return 80;
          }
          return prev + 20;
        });
      }, 300);

      // Use real plant health model with crop type
      const result = await realPlantHealthModel.classifyImage(preview, cropName);
      
      clearInterval(progressInterval);
      setProgress(100);
      
      // Create analysis result
      const analysisResult: AnalysisResult = {
        prediction: result.prediction,
        confidence: result.confidence,
        is_healthy: result.is_healthy,
        recommendations: result.recommendations,
        imageUrl: preview,
        model_info: result.model_info,
        correlatedMetrics: {
          pH: 6.1 + (Math.random() - 0.5) * 0.4,
          humidity: 78 + (Math.random() - 0.5) * 10,
          tds: 420 + (Math.random() - 0.5) * 40,
        }
      };

      setTimeout(() => {
        setUploading(false);
        setResult(analysisResult);
      }, 500);

    } catch (error) {
      console.error('Analysis failed:', error);
      setUploading(false);
      setProgress(0);
    }
  };

  const handleBack = () => {
    navigate('/pest-monitoring');
  };

  const handleNewAnalysis = () => {
    setPreview(null);
    setProgress(0);
    setUploading(false);
    setResult(null);
  };

  const useMobileLayout = shouldUseMobileLayout();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <div className={`${useMobileLayout ? 'h-screen flex flex-col' : 'min-h-screen'}`}>
        
        {/* Header - Fixed */}
        <div className="flex-shrink-0 p-4 bg-white/90 backdrop-blur-xl border-b border-gray-200/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={handleBack}
                className="h-10 w-10 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </Button>
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center shadow-lg">
                <Leaf className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">AI Plant Analysis</h1>
                <p className="text-xs text-primary font-medium">{cropName}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content - Responsive */}
        <div className={`${useMobileLayout ? 'flex-1 overflow-y-auto p-4' : 'container mx-auto px-4 py-8 max-w-4xl'}`}>
          {result ? (
            /* Analysis Results - Responsive Layout */
            <div className={`${useMobileLayout ? 'space-y-6' : 'grid grid-cols-1 lg:grid-cols-2 gap-8'}`}>
              {/* Image Section */}
              <div className={`${useMobileLayout ? '' : 'lg:col-span-1'}`}>
                <div className="relative">
                  <img 
                    src={result.imageUrl} 
                    alt="Analyzed" 
                    className={`w-full ${useMobileLayout ? 'h-64' : 'h-96'} object-cover rounded-2xl border border-gray-200 shadow-sm`} 
                  />
                </div>
              </div>
              
              {/* Results Section */}
              <div className={`${useMobileLayout ? '' : 'lg:col-span-1'} space-y-6`}>
                {/* Health Status */}
                <div className={`p-6 rounded-2xl border-2 ${
                  result.is_healthy 
                    ? "bg-green-50 border-green-200" 
                    : "bg-orange-50 border-orange-200"
                }`}>
                  <div className="flex items-center gap-4 mb-4">
                    {result.is_healthy ? (
                      <CheckCircle className="h-8 w-8 text-green-600 flex-shrink-0" />
                    ) : (
                      <AlertTriangle className="h-8 w-8 text-orange-600 flex-shrink-0" />
                    )}
                    <div>
                      <p className="font-bold text-xl mb-1">{result.prediction}</p>
                      <p className="text-sm opacity-80">{result.confidence}% confidence</p>
                    </div>
                  </div>
                  <p className="text-base font-medium">
                    Status: {result.is_healthy ? "Healthy Plant" : "Requires Attention"}
                  </p>
                </div>

                {/* Recommendations */}
                <div className="bg-gray-50 border-2 border-gray-200 rounded-2xl p-6">
                  <h4 className="font-bold mb-3 text-base">Recommendations</h4>
                  <p className="text-base text-gray-700 leading-relaxed">{result.recommendations}</p>
                </div>

                {/* Sensor Metrics */}
                {result.correlatedMetrics && (
                  <div className="bg-white border-2 border-gray-200 rounded-2xl p-6">
                    <h4 className="font-bold mb-4 text-base">Current Conditions</h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-gray-50 rounded-xl">
                        <p className="text-xs text-gray-500 mb-2">pH Level</p>
                        <p className="font-bold text-lg">{result.correlatedMetrics.pH.toFixed(1)}</p>
                      </div>
                      <div className="text-center p-4 bg-gray-50 rounded-xl">
                        <p className="text-xs text-gray-500 mb-2">Humidity</p>
                        <p className="font-bold text-lg">{result.correlatedMetrics.humidity.toFixed(0)}%</p>
                      </div>
                      <div className="text-center p-4 bg-gray-50 rounded-xl">
                        <p className="text-xs text-gray-500 mb-2">TDS</p>
                        <p className="font-bold text-lg">{result.correlatedMetrics.tds.toFixed(0)}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : uploading ? (
            /* Analysis Progress - Mobile Optimized */
            <div className="text-center space-y-8 py-16">
              <div className="w-32 h-32 bg-gradient-to-br from-primary to-secondary rounded-3xl flex items-center justify-center mx-auto shadow-xl">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-white border-t-transparent"></div>
              </div>
              <div>
                <p className="font-bold text-gray-900 text-3xl mb-4">Analyzing...</p>
                <p className="text-gray-600 text-xl mb-8">Detecting plant health</p>
                <Progress value={progress} className="h-4 bg-gray-200 rounded-full max-w-sm mx-auto" />
                <p className="text-base text-gray-500 mt-4 font-medium">{progress}% complete</p>
              </div>
            </div>
          ) : preview ? (
            /* Image Preview & Analysis - Responsive Layout */
            <div className={`${useMobileLayout ? 'space-y-6' : 'grid grid-cols-1 lg:grid-cols-2 gap-8 items-start'}`}>
              <div className="relative">
                <img 
                  src={preview} 
                  alt="Preview" 
                  className={`w-full ${useMobileLayout ? 'h-80' : 'h-96'} object-cover rounded-2xl border-2 border-gray-200 shadow-sm`} 
                />
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute top-4 right-4 h-12 w-12 rounded-full bg-white/95 hover:bg-white shadow-lg border border-gray-200"
                  onClick={() => setPreview(null)}
                >
                  <X className="h-6 w-6" />
                </Button>
              </div>
              
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-6">
                  <div className="flex items-center gap-4">
                    <CheckCircle className="h-8 w-8 text-green-600 flex-shrink-0" />
                    <div>
                      <p className="font-bold text-green-800 text-lg">Ready for Analysis</p>
                      <p className="text-base text-green-600">{useMobileLayout ? 'Tap' : 'Click'} analyze to get AI results</p>
                    </div>
                  </div>
                </div>
                
                {/* PC Analyze Button */}
                {!useMobileLayout && (
                  <Button
                    className="w-full h-16 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white font-bold shadow-lg hover:shadow-xl transition-all duration-200 rounded-2xl"
                    onClick={analyzeImage}
                  >
                    <Sparkles className="h-6 w-6 mr-3" />
                    <span className="text-xl">Analyze with AI</span>
                  </Button>
                )}
              </div>
            </div>
          ) : (
            /* Upload Interface - Responsive Layout */
            <div className={`${useMobileLayout ? 'space-y-8' : 'max-w-2xl mx-auto space-y-8'}`}>
              
              {/* Upload Zone */}
              <div
                className={`border-3 border-dashed border-primary/40 rounded-2xl ${useMobileLayout ? 'p-12' : 'p-16'} text-center cursor-pointer hover:border-primary/60 hover:bg-primary/5 transition-all duration-200 ${useMobileLayout ? 'active:scale-[0.98]' : 'hover:scale-[1.02]'}`}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className={`${useMobileLayout ? 'w-20 h-20' : 'w-24 h-24'} bg-gradient-to-br from-primary/20 to-secondary/20 rounded-2xl flex items-center justify-center mx-auto mb-6`}>
                  <Upload className={`${useMobileLayout ? 'h-10 w-10' : 'h-12 w-12'} text-primary`} />
                </div>
                <p className={`font-bold text-gray-900 ${useMobileLayout ? 'text-xl' : 'text-2xl'} mb-3`}>Upload Plant Image</p>
                <p className={`text-gray-600 ${useMobileLayout ? 'text-lg' : 'text-xl'} mb-4`}>Select from device storage</p>
                <p className={`text-gray-500 ${useMobileLayout ? 'text-base' : 'text-lg'}`}>JPG, PNG, WebP • Max 8MB</p>
              </div>

              {/* Camera & Gallery Buttons - Mobile Only */}
              {isMobile() && useMobileLayout && (
                <div className="grid grid-cols-2 gap-6">
                  <Button
                    variant="outline"
                    className="h-20 border-2 border-gray-200 hover:border-primary hover:bg-primary/5 transition-all duration-200 rounded-2xl active:scale-[0.98]"
                    onClick={handleTakePicture}
                  >
                    <div className="flex flex-col items-center gap-3">
                      <Camera className="h-8 w-8 text-primary" />
                      <span className="font-bold text-lg">Camera</span>
                    </div>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-20 border-2 border-gray-200 hover:border-primary hover:bg-primary/5 transition-all duration-200 rounded-2xl active:scale-[0.98]"
                    onClick={handleSelectFromGallery}
                  >
                    <div className="flex flex-col items-center gap-3">
                      <ImageIcon className="h-8 w-8 text-primary" />
                      <span className="font-bold text-lg">Gallery</span>
                    </div>
                  </Button>
                </div>
              )}

              {/* Tips */}
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-2xl p-6">
                <div className="flex items-center gap-4">
                  <AlertTriangle className="h-8 w-8 text-amber-600 flex-shrink-0" />
                  <div>
                    <p className="font-bold text-amber-800 text-lg">Best Results</p>
                    <p className="text-base text-amber-700">Clear, well-lit leaf photos work best</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Action Bar - Mobile Only */}
        {useMobileLayout && (preview && !uploading && !result) && (
          <div className="flex-shrink-0 p-4 bg-white border-t border-gray-100">
            <Button
              className="w-full h-16 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white font-bold shadow-lg hover:shadow-xl transition-all duration-200 rounded-2xl active:scale-[0.98]"
              onClick={analyzeImage}
            >
              <Sparkles className="h-6 w-6 mr-3" />
              <span className="text-xl">Analyze with AI</span>
            </Button>
          </div>
        )}

        {/* Bottom Action Bar for Results - Mobile Only */}
        {useMobileLayout && result && (
          <div className="flex-shrink-0 p-4 bg-white border-t border-gray-100">
            <div className="grid grid-cols-2 gap-4">
              <Button 
                variant="outline" 
                onClick={handleNewAnalysis}
                className="h-16 rounded-2xl border-2 font-bold text-lg active:scale-[0.98]"
              >
                Analyze Another
              </Button>
              <Button 
                onClick={handleBack}
                className="h-16 rounded-2xl bg-gradient-to-r from-primary to-secondary font-bold text-lg active:scale-[0.98]"
              >
                Done
              </Button>
            </div>
          </div>
        )}

        {/* PC Action Buttons */}
        {!useMobileLayout && result && (
          <div className="container mx-auto px-4 pb-8 max-w-4xl">
            <div className="flex justify-center gap-4">
              <Button 
                variant="outline" 
                onClick={handleNewAnalysis}
                className="px-8 py-4 rounded-2xl border-2 font-bold text-lg hover:scale-105 transition-all"
              >
                Analyze Another
              </Button>
              <Button 
                onClick={handleBack}
                className="px-8 py-4 rounded-2xl bg-gradient-to-r from-primary to-secondary font-bold text-lg hover:scale-105 transition-all"
              >
                Done
              </Button>
            </div>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileSelect(file);
          }}
        />
      </div>
    </div>
  );
};

export default PlantAnalysis;