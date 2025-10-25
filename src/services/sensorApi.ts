// API service for fetching real sensor data
export interface SensorReading {
  ts: string;
  value: number;
}

export interface LatestMetrics {
  timestamp: string;
  pH: number;
  airTemp: number;
  waterTemp: number;
  tds: number;
  humidity: number;
  dissolved_oxygen_mg_l?: number;
  pump_status?: "on" | "off";
}

export interface Last30Data {
  pH: SensorReading[];
  airTemp: SensorReading[];
  waterTemp: SensorReading[];
  tds: SensorReading[];
  humidity: SensorReading[];
  dissolved_oxygen_mg_l?: SensorReading[];
}

const API_BASE_URL = 'https://iit-project.vercel.app';

class SensorApiService {
  private cache: {
    allData?: { data: any[]; timestamp: number };
  } = {};
  
  private readonly CACHE_DURATION = 5000; // 5 seconds cache

  async getAllData(): Promise<any[]> {
    try {
      // Check cache first
      const now = Date.now();
      if (this.cache.allData && (now - this.cache.allData.timestamp) < this.CACHE_DURATION) {
        console.log(`📋 Using cached data (${this.cache.allData.data.length} points)`);
        return this.cache.allData.data;
      }

      console.log(`🌐 Fetching fresh data from ${API_BASE_URL}/data`);
      const response = await fetch(`${API_BASE_URL}/data`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        // Add timeout to prevent hanging
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });
      
      console.log(`📡 API Response Status: ${response.status} ${response.statusText}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
      }
      
      const apiResponse = await response.json();
      console.log(`📦 Raw API Response:`, {
        hasData: !!apiResponse.data,
        dataLength: apiResponse.data?.length || 0,
        firstItem: apiResponse.data?.[0] || null
      });
      
      const rawData = apiResponse.data || [];
      
      if (rawData.length === 0) {
        console.warn('⚠️ API returned empty data array');
      } else {
        console.log(`✅ Successfully fetched ${rawData.length} data points from /data endpoint`);
        console.log(`📊 Latest data point:`, rawData[0]);
      }
      
      // Cache the result
      this.cache.allData = { data: rawData, timestamp: now };
      
      return rawData;
    } catch (error) {
      console.error('❌ Failed to fetch all sensor data:', error);
      throw error;
    }
  }

  async getLatestData(): Promise<LatestMetrics> {
    try {
      const allData = await this.getAllData();
      
      if (allData.length === 0) {
        throw new Error('No data available from API');
      }
      
      // Data is in descending order, so first item is the latest
      const rawData = allData[0];
      console.log(`🔍 Processing latest data point:`, rawData);
      
      // Improved pump status detection
      const pumpStatus = this.determinePumpStatus(allData);
      
      // Transform API response to match our interface
      const transformedData: LatestMetrics = {
        timestamp: rawData.timestamp,
        pH: rawData.pH,
        airTemp: rawData.airTemp,
        waterTemp: rawData.waterTemp,
        tds: rawData.tds,
        humidity: rawData.humidity,
        dissolved_oxygen_mg_l: 0, // Not provided by API
        pump_status: pumpStatus
      };
      
      console.log(`✅ Latest data processed:`, {
        timestamp: transformedData.timestamp,
        pH: transformedData.pH,
        pump: transformedData.pump_status
      });
      
      return transformedData;
    } catch (error) {
      console.error('❌ Failed to get latest sensor data:', error);
      throw error;
    }
  }

  private determinePumpStatus(allData: any[]): "on" | "off" {
    try {
      if (allData.length === 0) {
        console.log('🔧 Pump Status: OFF (no data available)');
        return "off";
      }

      // Method 1: Check if we have recent data (within last 2 minutes)
      const latestData = allData[0];
      const parseTimestamp = (timestamp: string) => {
        const parts = timestamp.split(' ');
        const datePart = parts[0].replace(/:/g, '-');
        const timePart = parts[1];
        return new Date(`${datePart}T${timePart}`).getTime();
      };

      const dataTimestamp = parseTimestamp(latestData.timestamp);
      const currentTime = Date.now();
      const timeDifferenceMinutes = (currentTime - dataTimestamp) / (1000 * 60);
      
      console.log(`🕐 Data age: ${timeDifferenceMinutes.toFixed(2)} minutes`);
      
      // If data is older than 2 minutes, pump is likely off
      if (timeDifferenceMinutes > 2) {
        console.log('🔧 Pump Status: OFF (data too old)');
        return "off";
      }

      // Method 2: Check if we have multiple recent data points (indicates active system)
      const recentDataCount = allData.filter(item => {
        const itemTimestamp = parseTimestamp(item.timestamp);
        const itemAge = (currentTime - itemTimestamp) / (1000 * 60);
        return itemAge <= 5; // Within last 5 minutes
      }).length;

      console.log(`📊 Recent data points (last 5 min): ${recentDataCount}`);

      // Method 3: Check for data variation (active system should have some variation)
      const hasDataVariation = this.checkDataVariation(allData.slice(0, 10));
      console.log(`📈 Data variation detected: ${hasDataVariation}`);

      // Determine pump status based on multiple factors
      const isPumpOn = timeDifferenceMinutes <= 2 && recentDataCount >= 3 && hasDataVariation;
      
      const status = isPumpOn ? "on" : "off";
      console.log(`🔧 Pump Status: ${status.toUpperCase()} (age: ${timeDifferenceMinutes.toFixed(1)}min, recent: ${recentDataCount}, variation: ${hasDataVariation})`);
      
      return status;
    } catch (error) {
      console.error('❌ Error determining pump status:', error);
      return "off";
    }
  }

  private checkDataVariation(recentData: any[]): boolean {
    if (recentData.length < 3) return false;

    try {
      // Check if pH values have some variation (not all identical)
      const phValues = recentData.map(item => item.pH).filter(val => val != null);
      const phVariation = Math.max(...phValues) - Math.min(...phValues);
      
      // Check if temperature values have some variation
      const tempValues = recentData.map(item => item.airTemp).filter(val => val != null);
      const tempVariation = Math.max(...tempValues) - Math.min(...tempValues);
      
      // If there's any meaningful variation, system is likely active
      const hasVariation = phVariation > 0.01 || tempVariation > 0.1;
      
      console.log(`📊 Data variation analysis: pH(${phVariation.toFixed(3)}), Temp(${tempVariation.toFixed(2)})`);
      
      return hasVariation;
    } catch (error) {
      console.error('Error checking data variation:', error);
      return false;
    }
  }

  async getLast30Data(): Promise<Last30Data> {
    try {
      const allData = await this.getAllData();
      
      if (allData.length === 0) {
        throw new Error('No data available');
      }
      
      // Take last 30 data points and reverse for ascending order (oldest to newest)
      const last30 = allData.slice(0, 30).reverse();
      
      // Helper function to parse API timestamp format
      const parseApiTimestamp = (timestamp: string) => {
        // Convert "2025:10:23 12:43:57" to proper ISO format
        const parts = timestamp.split(' ');
        const datePart = parts[0].replace(/:/g, '-'); // "2025-10-23"
        const timePart = parts[1]; // "12:43:57"
        const isoFormat = `${datePart}T${timePart}`;
        return isoFormat;
      };
      
      console.log(`📈 Processing ${last30.length} data points for charts (reversed for ascending trend)`);
      
      // Transform API response to match our interface
      const transformedData: Last30Data = {
        pH: last30.map((item: any) => ({
          ts: parseApiTimestamp(item.timestamp),
          value: item.pH
        })),
        airTemp: last30.map((item: any) => ({
          ts: parseApiTimestamp(item.timestamp),
          value: item.airTemp
        })),
        waterTemp: last30.map((item: any) => ({
          ts: parseApiTimestamp(item.timestamp),
          value: item.waterTemp
        })),
        tds: last30.map((item: any) => ({
          ts: parseApiTimestamp(item.timestamp),
          value: item.tds
        })),
        humidity: last30.map((item: any) => ({
          ts: parseApiTimestamp(item.timestamp),
          value: item.humidity
        })),
        dissolved_oxygen_mg_l: [] // Not provided by API
      };
      
      return transformedData;
    } catch (error) {
      console.error('Failed to get chart data:', error);
      throw error;
    }
  }

  async getEnhancedPumpStatus(): Promise<"on" | "off"> {
    try {
      const allData = await this.getAllData();
      
      if (allData.length === 0) {
        return "off";
      }
      
      // Helper function to parse API timestamp format
      const parseApiTimestamp = (timestamp: string) => {
        const parts = timestamp.split(' ');
        const datePart = parts[0].replace(/:/g, '-');
        const timePart = parts[1];
        return new Date(`${datePart}T${timePart}`).getTime();
      };
      
      // Get the latest data point (first item since data is in descending order)
      const latestData = allData[0];
      const dataTimestamp = parseApiTimestamp(latestData.timestamp);
      const currentTime = Date.now();
      const timeDifferenceSeconds = (currentTime - dataTimestamp) / 1000;
      
      const pumpStatus = timeDifferenceSeconds <= 15 ? "on" : "off";
      
      console.log(`🔧 Enhanced Pump Status: Latest data ${timeDifferenceSeconds.toFixed(1)}s old → Pump ${pumpStatus.toUpperCase()}`);
      
      return pumpStatus;
    } catch (error) {
      console.error('Failed to get enhanced pump status:', error);
      return "off";
    }
  }

  // Test API endpoint health
  async testApiHealth(): Promise<{ success: boolean; message: string; dataCount: number }> {
    try {
      console.log('🔍 Testing API endpoint health...');
      
      const response = await fetch(`${API_BASE_URL}/data`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });

      if (!response.ok) {
        return {
          success: false,
          message: `API returned ${response.status}: ${response.statusText}`,
          dataCount: 0
        };
      }

      const data = await response.json();
      const dataPoints = data.data?.length || 0;

      if (dataPoints === 0) {
        return {
          success: false,
          message: 'API is responding but no data available',
          dataCount: 0
        };
      }

      const latestTimestamp = data.data[0]?.timestamp;
      return {
        success: true,
        message: `API healthy - ${dataPoints} data points available. Latest: ${latestTimestamp}`,
        dataCount: dataPoints
      };

    } catch (error) {
      console.error('API health check failed:', error);
      return {
        success: false,
        message: `API connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        dataCount: 0
      };
    }
  }

  // Clear cache manually if needed
  clearCache(): void {
    this.cache = {};
  }
}

// Export singleton instance
export const sensorApi = new SensorApiService();