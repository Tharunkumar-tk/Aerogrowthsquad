import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Thermometer, Droplets, Activity, Gauge } from "lucide-react";
import { exportCSVMobile } from "@/utils/mobile";

import { PHChartMetrics } from "@/components/charts/PHChartMetrics";
import { sensorApi, type Last30Data, type LatestMetrics } from "@/services/sensorApi";
import { phHistory, airTempHistory, tdsHistory, humidityHistory, getLatestMetrics, waterTempHistory } from "@/lib/mockData";
import { toast } from "sonner";

type MetricType = "pH" | "airTemp" | "waterTemp" | "tds" | "humidity";

const Metrics = () => {
  const [isExporting, setIsExporting] = useState<{ [key: string]: boolean }>({});
  // Initialize with mock data to prevent white screen
  const [chartData, setChartData] = useState<Last30Data | null>({
    pH: phHistory,
    airTemp: airTempHistory,
    waterTemp: waterTempHistory,
    tds: tdsHistory,
    humidity: humidityHistory,
    dissolved_oxygen_mg_l: []
  });
  const [latestData, setLatestData] = useState<LatestMetrics | null>(getLatestMetrics());

  const [error, setError] = useState<string | null>(null);

  const fetchLatestData = async () => {
    try {
      const data = await sensorApi.getLatestData();
      setLatestData(data);
      console.log('✅ Successfully fetched latest data from API:', data);
    } catch (err) {
      console.error('❌ Failed to fetch latest data:', err);
      // Fallback to mock data for latest values
      if (!latestData) {
        const { getLatestMetrics } = await import('@/lib/mockData');
        const mockData = getLatestMetrics();
        setLatestData(mockData);
        console.log('🔄 Using mock data for latest values:', mockData);
      }
    }
  };

  const fetchChartData = async () => {
    try {
      const data = await sensorApi.getLast30Data();
      setChartData(data);
      console.log('✅ Successfully fetched chart data from API:', {
        pH: data.pH?.length || 0,
        airTemp: data.airTemp?.length || 0,
        waterTemp: data.waterTemp?.length || 0,
        tds: data.tds?.length || 0,
        humidity: data.humidity?.length || 0,
      });
    } catch (err) {
      console.error('❌ Failed to fetch chart data:', err);
      // Fallback to mock data if no chart data exists
      if (!chartData) {
        const { phHistory, airTempHistory, waterTempHistory, tdsHistory, humidityHistory } = await import('@/lib/mockData');
        const mockChartData = {
          pH: phHistory,
          airTemp: airTempHistory,
          waterTemp: waterTempHistory,
          tds: tdsHistory,
          humidity: humidityHistory,
          dissolved_oxygen_mg_l: []
        };
        setChartData(mockChartData);
        console.log('🔄 Using mock data for charts:', {
          pH: mockChartData.pH.length,
          airTemp: mockChartData.airTemp.length,
          waterTemp: mockChartData.waterTemp.length,
          tds: mockChartData.tds.length,
          humidity: mockChartData.humidity.length,
        });
      }
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Try to fetch real data in the background
        await Promise.all([fetchLatestData(), fetchChartData()]);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch metrics data:', err);
        setError('Failed to fetch metrics data');
      }
    };

    // Fetch data without blocking the UI
    fetchData();

    // Set up intervals for real-time updates
    const latestDataInterval = setInterval(() => {
      fetchLatestData().catch(console.error);
    }, 10000); // Every 10 seconds

    const chartDataInterval = setInterval(() => {
      fetchChartData().catch(console.error);
    }, 10000); // Every 10 seconds

    return () => {
      clearInterval(latestDataInterval);
      clearInterval(chartDataInterval);
    };
  }, []);

  const getMetricsConfig = () => ({
    pH: {
      data: chartData?.pH && chartData.pH.length > 0 ? chartData.pH : phHistory,
      label: "pH Level",
      unit: "pH",
      optimal: 6.5,
      icon: Activity,
      color: "hsl(var(--chart-1))",
      description: "Acidity/alkalinity level of the nutrient solution",
      isRealData: chartData?.pH && chartData.pH.length > 0
    },
    airTemp: {
      data: chartData?.airTemp && chartData.airTemp.length > 0 ? chartData.airTemp : airTempHistory,
      label: "Air Temperature",
      unit: "°C",
      optimal: 26,
      icon: Thermometer,
      color: "hsl(var(--chart-2))",
      description: "Ambient air temperature in the growing environment",
      isRealData: chartData?.airTemp && chartData.airTemp.length > 0
    },
    waterTemp: {
      data: chartData?.waterTemp && chartData.waterTemp.length > 0 ? chartData.waterTemp : waterTempHistory,
      label: "Water Temperature",
      unit: "°C",
      optimal: 21,
      icon: Thermometer,
      color: "hsl(var(--chart-3))",
      description: "Temperature of the nutrient solution",
      isRealData: chartData?.waterTemp && chartData.waterTemp.length > 0
    },
    tds: {
      data: chartData?.tds && chartData.tds.length > 0 ? chartData.tds : tdsHistory,
      label: "TDS",
      unit: "ppm",
      optimal: 400,
      icon: Gauge,
      color: "hsl(var(--chart-4))",
      description: "Total dissolved solids in the nutrient solution",
      isRealData: chartData?.tds && chartData.tds.length > 0
    },
    humidity: {
      data: chartData?.humidity && chartData.humidity.length > 0 ? chartData.humidity : humidityHistory,
      label: "Humidity",
      unit: "%",
      optimal: 75,
      icon: Droplets,
      color: "hsl(var(--chart-5))",
      description: "Relative humidity in the growing environment",
      isRealData: chartData?.humidity && chartData.humidity.length > 0
    },
  });

  // Helper function to get stats for a metric
  const getStatsForMetric = (metricKey: MetricType) => {
    const metricsConfig = getMetricsConfig();
    const config = metricsConfig[metricKey];
    const data = config.data; // Use all available data from last30

    // Log data source for debugging
    console.log(`📊 ${metricKey}: Using ${config.isRealData ? 'REAL' : 'MOCK'} data (${data.length} points)`);

    // Get current value from latest API data (always use latest for current value)
    const getCurrentValue = () => {
      if (latestData) {
        switch (metricKey) {
          case 'pH': return latestData.pH ?? 0;
          case 'airTemp': return latestData.airTemp ?? 0;
          case 'waterTemp': return latestData.waterTemp ?? 0;
          case 'tds': return latestData.tds ?? 0;
          case 'humidity': return latestData.humidity ?? 0;
          default: return data[data.length - 1]?.value ?? 0;
        }
      }
      return data[data.length - 1]?.value ?? 0;
    };

    if (data.length === 0) {
      return {
        current: getCurrentValue(),
        min: 0,
        max: 0,
        avg: 0,
        chartData: [],
      };
    }

    const values = data.map((d) => d.value);
    const safeValues = values.filter(v => v !== null && v !== undefined && !isNaN(v));

    return {
      current: getCurrentValue(), // Latest data for current value
      min: safeValues.length > 0 ? Math.min(...safeValues) : 0, // Min from last30 data
      max: safeValues.length > 0 ? Math.max(...safeValues) : 0, // Max from last30 data
      avg: safeValues.length > 0 ? safeValues.reduce((sum, val) => sum + val, 0) / safeValues.length : 0, // Avg from last30 data
      chartData: data.map((d) => ({
        time: new Date(d.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        value: d.value ?? 0,
      })),
    };
  };



  // Enhanced mobile detection
  const isMobileDevice = () => {
    const userAgent = navigator.userAgent.toLowerCase();
    const mobileKeywords = ['android', 'webos', 'iphone', 'ipad', 'ipod', 'blackberry', 'iemobile', 'opera mini'];
    return mobileKeywords.some(keyword => userAgent.includes(keyword)) ||
      ('ontouchstart' in window) ||
      (navigator.maxTouchPoints > 0);
  };

  const handleExport = async (metricKey: MetricType) => {
    console.log(`Starting CSV export for ${metricKey}`);
    setIsExporting(prev => ({ ...prev, [metricKey]: true }));

    // Add a small delay to ensure UI updates properly on mobile
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
      // Fetch fresh data directly from /data endpoint for export
      let dataToExport: { ts: string; value: number }[] = [];
      let isRealData = false;

      try {
        const allData = await sensorApi.getAllData();
        if (allData.length > 0) {
          // Take last 30 entries and reverse for chronological order
          const last30 = allData.slice(0, 30).reverse();

          // Parse timestamp and extract the metric value
          dataToExport = last30.map((item: any) => {
            const parts = item.timestamp.split(' ');
            const datePart = parts[0].replace(/:/g, '-');
            const timePart = parts[1];
            const isoTimestamp = `${datePart}T${timePart}`;

            let value = 0;
            switch (metricKey) {
              case 'pH': value = item.pH; break;
              case 'airTemp': value = item.airTemp; break;
              case 'waterTemp': value = item.waterTemp; break;
              case 'tds': value = item.tds; break;
              case 'humidity': value = item.humidity; break;
            }

            return {
              ts: isoTimestamp,
              value: value
            };
          });
          isRealData = true;
        }
      } catch (apiError) {
        console.error('Failed to fetch fresh data for export, using cached data:', apiError);
        // Fallback to cached data
        const metricsConfig = getMetricsConfig();
        const config = metricsConfig[metricKey];
        dataToExport = config.data.slice(-30);
        isRealData = config.isRealData;
      }

      console.log(`📤 Exporting ${dataToExport.length} data points for ${metricKey} (${isRealData ? 'REAL' : 'MOCK'} data)`);

      // Get metric label and unit
      const getMetricInfo = (key: MetricType) => {
        const labels = {
          pH: { label: 'pH Level', unit: 'pH' },
          airTemp: { label: 'Air Temperature', unit: '°C' },
          waterTemp: { label: 'Water Temperature', unit: '°C' },
          tds: { label: 'TDS', unit: 'ppm' },
          humidity: { label: 'Humidity', unit: '%' }
        };
        return labels[key];
      };

      const metricInfo = getMetricInfo(metricKey);

      // Generate CSV content with proper formatting and BOM for Excel compatibility
      const dataSource = isRealData ? 'Real-time API Data' : 'Mock Data (API Unavailable)';
      const headers = ["Timestamp", "Time", "Metric", "Value", "Unit"];
      const csvRows = [
        `# AeroGrowth Metrics Export - ${dataSource}`,
        `# Generated: ${new Date().toLocaleString()}`,
        `# Metric: ${metricInfo.label}`,
        `# Data Points: ${dataToExport.length}`,
        `# Source: /data endpoint (last 30 entries)`,
        "",
        headers.join(",")
      ];

      dataToExport.forEach((item) => {
        const fullTimestamp = new Date(item.ts).toLocaleString();
        const timeOnly = new Date(item.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        const row = [
          `"${fullTimestamp}"`, // Full timestamp
          `"${timeOnly}"`, // Time in HH:MM format
          `"${metricInfo.label}"`, // Metric name
          (item.value ?? 0).toFixed(2), // Value
          `"${metricInfo.unit}"` // Unit
        ];
        csvRows.push(row.join(","));
      });

      // Add BOM for proper Excel UTF-8 handling
      const csvContent = '\uFEFF' + csvRows.join("\n");
      const filename = `AeroGrowth_${metricKey}_AllData_${new Date().toISOString().split("T")[0]}.csv`;
      const title = 'AeroGrowth Metrics Export';
      const description = `${metricKey} complete metrics dataset (${dataToExport.length} data points) - AeroGrowth Vertical Farming`;

      console.log(`Exporting CSV: ${filename} with ${dataToExport.length} records`);

      // Use the improved mobile CSV export function
      const result = await exportCSVMobile(csvContent, filename, title, description);

      if (result.success) {
        console.log('CSV export successful:', result.message);
        // Use a more subtle success message for mobile
        if (isMobileDevice()) {
          const metricsConfig = getMetricsConfig();
          const config = metricsConfig[metricKey];
          toast.success(`${config.label} CSV exported! ${dataToExport.length} records ready`);
        } else {
          toast.success(result.message);
        }
      } else {
        console.error('CSV export failed:', result.message);
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Export failed:', error);
      const errorMessage = 'Failed to export CSV. Please try again.';
      toast.error(errorMessage);
    } finally {
      // Add a small delay before re-enabling the button to prevent double-clicks
      setTimeout(() => {
        console.log('CSV export process completed');
        setIsExporting(prev => ({ ...prev, [metricKey]: false }));
      }, 500);
    }
  };

  // Wrapper function to handle CSV export with navigation bypass
  const handleCSVExportClick = (metricKey: MetricType) => {
    console.log(`Direct CSV export clicked for ${metricKey}`);

    // Temporarily disable navigation prevention for this action
    const body = document.body;
    body.classList.add('csv-export-active');

    // Execute the export
    handleExport(metricKey).finally(() => {
      // Re-enable navigation prevention after a delay
      setTimeout(() => {
        body.classList.remove('csv-export-active');
      }, 1000);
    });
  };



  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container py-8 space-y-8">
        <div className="text-center mb-8">
          <h1 className="mb-2">Performance Metrics</h1>
          <p className="text-muted-foreground">
            Complete analytics and historical trends for all parameters
            {error && (
              <span className="block text-yellow-600 text-sm mt-1">
                ⚠️ Using fallback data - {error}
              </span>
            )}
          </p>
          {latestData && (
            <div className="mt-4 text-sm text-muted-foreground">
              Last updated: {(() => {
                try {
                  // Parse API timestamp format "2025:10:23 12:43:57"
                  const parts = latestData.timestamp.split(' ');
                  const datePart = parts[0].replace(/:/g, '-');
                  const timePart = parts[1];
                  return new Date(`${datePart}T${timePart}`).toLocaleString();
                } catch (e) {
                  return latestData.timestamp;
                }
              })()}
            </div>
          )}
        </div>

        {/* Overall System Status */}
        {latestData && (
          <Card className="card-hover mb-8">
            <CardHeader>
              <CardTitle className="text-xl">System Overview</CardTitle>
              <p className="text-sm text-muted-foreground">Current system status and key metrics</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-chart-1">{(latestData.pH ?? 0).toFixed(2)}</div>
                  <div className="text-sm text-muted-foreground">pH Level</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-chart-2">{(latestData.airTemp ?? 0).toFixed(1)}°C</div>
                  <div className="text-sm text-muted-foreground">Air Temp</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-chart-3">{(latestData.waterTemp ?? 0).toFixed(1)}°C</div>
                  <div className="text-sm text-muted-foreground">Water Temp</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-chart-4">{(latestData.tds ?? 0).toFixed(0)}</div>
                  <div className="text-sm text-muted-foreground">TDS (ppm)</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-chart-5">{(latestData.humidity ?? 0).toFixed(1)}%</div>
                  <div className="text-sm text-muted-foreground">Humidity</div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t">
                <div className="flex items-center justify-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${(latestData.pump_status ?? 'off') === 'on' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span>Pump: {(latestData.pump_status ?? 'off').toUpperCase()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span>DO: {(latestData.dissolved_oxygen_mg_l ?? 0).toFixed(1)} mg/L</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Overall Performance Summary */}
        {chartData && (
          <Card className="card-hover mb-8">
            <CardHeader>
              <CardTitle className="text-xl">Performance Summary</CardTitle>
              <p className="text-sm text-muted-foreground">
                Overall statistics from historical data
                {chartData && (
                  <span className="block mt-1">
                    Data Sources: {Object.entries(getMetricsConfig()).map(([key, config]) =>
                      `${config.label}: ${config.isRealData ? '🟢 Live' : '🟡 Mock'}`
                    ).join(' • ')}
                  </span>
                )}
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Data Points Summary */}
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">
                    {Math.max(
                      chartData.pH?.length || 0,
                      chartData.airTemp?.length || 0,
                      chartData.waterTemp?.length || 0,
                      chartData.tds?.length || 0,
                      chartData.humidity?.length || 0
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Data Points</div>
                </div>

                {/* Time Range */}
                <div className="text-center">
                  <div className="text-lg font-bold text-primary">
                    {chartData.pH && chartData.pH.length > 0 ? (
                      <>
                        {Math.round((new Date(chartData.pH[chartData.pH.length - 1].ts).getTime() -
                          new Date(chartData.pH[0].ts).getTime()) / (1000 * 60 * 60))}h
                      </>
                    ) : '0h'}
                  </div>
                  <div className="text-sm text-muted-foreground">Data Time Span</div>
                </div>

                {/* System Health Score */}
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">
                    {latestData ? (
                      Math.round(
                        ((latestData.pH >= 6.0 && latestData.pH <= 6.8 ? 25 : 0) +
                          (latestData.airTemp >= 23 && latestData.airTemp <= 29 ? 25 : 0) +
                          (latestData.waterTemp >= 19 && latestData.waterTemp <= 23 ? 25 : 0) +
                          (latestData.tds >= 350 && latestData.tds <= 450 ? 25 : 0))
                      )
                    ) : 0}%
                  </div>
                  <div className="text-sm text-muted-foreground">System Health</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* All Metrics Sections */}
        {Object.entries(getMetricsConfig()).map(([metricKey, config]) => {
          const stats = getStatsForMetric(metricKey as MetricType);
          const Icon = config.icon;

          return (
            <div key={metricKey} className="space-y-6">
              {/* Metric Header */}
              <Card className="card-hover">
                <CardHeader>
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="p-3 rounded-lg"
                        style={{ backgroundColor: `${config.color}20`, color: config.color }}
                      >
                        <Icon className="h-6 w-6" />
                      </div>
                      <div>
                        <CardTitle className="text-xl flex items-center gap-2">
                          {config.label}
                          <span className={`text-xs px-2 py-1 rounded-full ${config.isRealData ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                            {config.isRealData ? 'Live Data' : 'Mock Data'}
                          </span>
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">{config.description}</p>
                      </div>
                    </div>
                    <Button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleCSVExportClick(metricKey as MetricType);
                      }}
                      disabled={isExporting[metricKey]}
                      className="min-h-[44px] min-w-[120px] touch-manipulation self-start md:self-center"
                      style={{ WebkitTapHighlightColor: 'transparent' }}
                      data-csv-export="true"
                      data-interactive="true"
                    >
                      <Download className={`h-4 w-4 mr-2 ${isExporting[metricKey] ? 'animate-spin' : ''}`} />
                      {isExporting[metricKey] ? 'Exporting...' : 'Export CSV'}
                    </Button>
                  </div>
                </CardHeader>
              </Card>

              {/* Stats Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="card-hover">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Current</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold" style={{ color: config.color }}>
                      {(stats.current ?? 0).toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground">{config.unit}</p>
                  </CardContent>
                </Card>

                <Card className="card-hover">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Average</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{(stats.avg ?? 0).toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">{config.unit}</p>
                  </CardContent>
                </Card>

                <Card className="card-hover">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Min</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{(stats.min ?? 0).toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">{config.unit}</p>
                  </CardContent>
                </Card>

                <Card className="card-hover">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Max</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{(stats.max ?? 0).toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">{config.unit}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Chart */}
              <Card className="card-hover">
                <CardHeader>
                  <CardTitle>{config.label} Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <PHChartMetrics
                    data={stats.chartData}
                    label={config.label}
                    unit={config.unit}
                  />
                </CardContent>
              </Card>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Metrics;
