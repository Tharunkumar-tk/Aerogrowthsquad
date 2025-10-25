import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Scan, History, Sparkles, CheckCircle, Leaf } from "lucide-react";
import { CropCard } from "@/components/pest/CropCard";
import { shouldUseMobileLayout } from "@/utils/mobileDetection";
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

type ViewState = 'crops' | 'history';

const PestMonitoring = () => {
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState<ViewState>('crops');
  const [analysisHistory] = useState<(AnalysisResult & { cropName: string; timestamp: Date })[]>([]);
  const useMobileLayout = shouldUseMobileLayout();

  const handleCropSelect = (cropId: string) => {
    navigate(`/plant-analysis?crop=${cropId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <div className={`${useMobileLayout ? 'h-screen flex flex-col' : 'min-h-screen'}`}>
        
        {/* Header - Responsive */}
        <div className={`${useMobileLayout ? 'flex-shrink-0' : ''} p-4 bg-white/90 backdrop-blur-xl border-b border-gray-200/50`}>
          <div className={`${useMobileLayout ? '' : 'container mx-auto max-w-6xl'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`${useMobileLayout ? 'w-12 h-12' : 'w-16 h-16'} bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center shadow-lg`}>
                  <Leaf className={`${useMobileLayout ? 'h-6 w-6' : 'h-8 w-8'} text-white`} />
                </div>
                <div>
                  <h1 className={`${useMobileLayout ? 'text-xl' : 'text-3xl'} font-bold text-gray-900`}>Pest Monitoring</h1>
                  <p className={`${useMobileLayout ? 'text-sm' : 'text-lg'} text-primary font-medium`}>AI Plant Health Analysis</p>
                </div>
              </div>
            </div>
            
            {/* AI Status */}
            <div className={`bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200/50 rounded-2xl p-3 ${useMobileLayout ? 'mt-4' : 'mt-6'}`}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center shadow-sm">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1">
                  <p className={`font-semibold text-green-800 ${useMobileLayout ? 'text-sm' : 'text-base'}`}>Offline AI Ready</p>
                  <p className={`text-green-600 ${useMobileLayout ? 'text-xs' : 'text-sm'}`}>No internet connection required</p>
                </div>
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs - Responsive */}
        <div className={`${useMobileLayout ? 'flex-shrink-0' : ''} p-4 bg-white/50`}>
          <div className={`${useMobileLayout ? '' : 'container mx-auto max-w-6xl'}`}>
            <div className={`grid grid-cols-2 ${useMobileLayout ? 'h-12' : 'h-14'} bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-2xl p-1 shadow-sm ${useMobileLayout ? '' : 'max-w-md mx-auto'}`}>
              <button
                onClick={() => setCurrentView('crops')}
                className={`flex items-center justify-center gap-2 ${useMobileLayout ? 'text-sm' : 'text-base'} font-medium px-4 rounded-xl transition-all duration-200 ${useMobileLayout ? 'active:scale-95' : 'hover:scale-105'} ${
                  currentView === 'crops' 
                    ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-lg shadow-primary/25' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Scan className={`${useMobileLayout ? 'h-4 w-4' : 'h-5 w-5'}`} />
                <span>Crops</span>
              </button>
              <button
                onClick={() => setCurrentView('history')}
                className={`flex items-center justify-center gap-2 ${useMobileLayout ? 'text-sm' : 'text-base'} font-medium px-4 rounded-xl transition-all duration-200 ${useMobileLayout ? 'active:scale-95' : 'hover:scale-105'} ${
                  currentView === 'history' 
                    ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-lg shadow-primary/25' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <History className={`${useMobileLayout ? 'h-4 w-4' : 'h-5 w-5'}`} />
                <span>History</span>
              </button>
            </div>
          </div>
        </div>

        {/* Content Area - Responsive */}
        <div className={`${useMobileLayout ? 'flex-1 overflow-y-auto' : 'flex-1'}`}>
          
          {/* Crop Selection View */}
          {currentView === 'crops' && (
            <div className={`${useMobileLayout ? 'p-4' : 'container mx-auto px-4 py-8 max-w-6xl'} space-y-6`}>
              {/* Quick Guide */}
              <div className={`bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/50 rounded-2xl ${useMobileLayout ? 'p-4' : 'p-6'}`}>
                <div className="flex items-center gap-3 mb-3">
                  <div className={`${useMobileLayout ? 'w-8 h-8' : 'w-10 h-10'} bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl flex items-center justify-center shadow-sm`}>
                    <CheckCircle className={`${useMobileLayout ? 'h-4 w-4' : 'h-5 w-5'} text-white`} />
                  </div>
                  <h3 className={`font-semibold text-blue-900 ${useMobileLayout ? 'text-base' : 'text-lg'}`}>How It Works</h3>
                </div>
                <p className={`text-blue-700 ${useMobileLayout ? 'text-sm' : 'text-base'}`}>Select your crop → Take a photo → Get instant AI analysis</p>
              </div>

              {/* Crop Grid - Responsive */}
              <div className={`grid ${useMobileLayout ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'} gap-4`}>
                {cropData.map((crop) => (
                  <CropCard
                    key={crop.id}
                    {...crop}
                    isSelected={false}
                    onClick={() => handleCropSelect(crop.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* History View */}
          {currentView === 'history' && (
            <div className={`${useMobileLayout ? 'p-4' : 'container mx-auto px-4 py-8 max-w-4xl'}`}>
              {analysisHistory.length === 0 ? (
                <div className={`text-center ${useMobileLayout ? 'py-12' : 'py-20'} text-muted-foreground`}>
                  <History className={`${useMobileLayout ? 'h-16 w-16' : 'h-24 w-24'} mx-auto mb-4 opacity-50`} />
                  <p className={`${useMobileLayout ? 'text-lg' : 'text-2xl'} font-medium mb-2`}>No Analysis History</p>
                  <p className={`${useMobileLayout ? 'text-sm' : 'text-lg'}`}>Start analyzing crops to see your history here</p>
                </div>
              ) : (
                <div className={`${useMobileLayout ? 'space-y-3' : 'grid grid-cols-1 md:grid-cols-2 gap-4'}`}>
                  {analysisHistory.map((item, index) => (
                    <div key={index} className={`flex items-center gap-3 ${useMobileLayout ? 'p-3' : 'p-4'} bg-white rounded-2xl border border-gray-200/50 shadow-sm hover:shadow-md transition-shadow`}>
                      <img 
                        src={item.imageUrl} 
                        alt="Analysis" 
                        className={`${useMobileLayout ? 'w-12 h-12' : 'w-16 h-16'} rounded-xl object-cover flex-shrink-0`}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`font-medium ${useMobileLayout ? 'text-sm' : 'text-base'} truncate`}>{item.cropName}</span>
                          <Badge variant={item.is_healthy ? "default" : "destructive"} className={`${useMobileLayout ? 'text-xs' : 'text-sm'}`}>
                            {item.is_healthy ? "Healthy" : "Issue"}
                          </Badge>
                        </div>
                        <p className={`text-muted-foreground ${useMobileLayout ? 'text-xs' : 'text-sm'}`}>
                          {item.confidence}% • {item.timestamp.toLocaleDateString()}
                        </p>
                      </div>
                      <Button 
                        variant="outline" 
                        size={useMobileLayout ? "sm" : "default"}
                        className={`${useMobileLayout ? 'text-xs px-3' : 'text-sm px-4'} rounded-xl hover:scale-105 transition-transform`}
                        onClick={() => {
                          const crop = cropData.find(c => c.name === item.cropName);
                          if (crop) {
                            navigate(`/plant-analysis?crop=${crop.id}`);
                          }
                        }}
                      >
                        View
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PestMonitoring;