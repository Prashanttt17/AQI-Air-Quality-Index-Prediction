
import { AQIDataPoint, ApiPlatform } from '@/utils/api-service';
import { toast } from '@/components/ui/use-toast';

/**
 * Interface for backend API settings
 */
interface BackendSettings {
  enabled: boolean;
  url: string;
}

/**
 * Get the backend settings from local storage
 */
export const getBackendSettings = (): BackendSettings => {
  const settingsStr = localStorage.getItem('aqi_backend_settings');
  if (settingsStr) {
    try {
      return JSON.parse(settingsStr);
    } catch (e) {
      console.error('Error parsing backend settings', e);
    }
  }
  
  // Default settings (disabled)
  return {
    enabled: false,
    url: ''
  };
};

/**
 * Save the backend settings to local storage
 */
export const saveBackendSettings = (settings: BackendSettings): void => {
  localStorage.setItem('aqi_backend_settings', JSON.stringify(settings));
};

/**
 * Interface for AQI data request to backend
 */
interface AQIRequest {
  city: string;
  state?: string;
  country?: string;
  api_key: string;
  platform: ApiPlatform;
}

/**
 * Interface for prediction request to backend
 */
interface PredictionRequest {
  historical_data: AQIDataPoint[];
  model_name: string;
}

/**
 * Fetch AQI data from the backend API
 */
export const fetchAQIDataFromBackend = async (
  city: string, 
  state: string, 
  apiKey: string, 
  platform: ApiPlatform = 'airvisual'
): Promise<AQIDataPoint[]> => {
  const settings = getBackendSettings();
  
  if (!settings.enabled || !settings.url) {
    throw new Error('Backend integration is not enabled');
  }
  
  try {
    console.log(`Fetching AQI data from backend for city: ${city}, state: ${state}`);
    const response = await fetch(`${settings.url}/api/fetch-aqi`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        city,
        state: state !== 'All States' ? state : undefined,
        country: 'India',
        api_key: apiKey,
        platform
      } as AQIRequest),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Backend API error: ${response.status} - ${errorText}`);
      throw new Error(`Backend API error: ${response.status} - ${errorText}`);
    }
    
    const data: AQIDataPoint[] = await response.json();
    console.log(`Received ${data.length} data points from backend`);
    return data;
  } catch (error) {
    console.error('Error fetching data from backend:', error);
    toast({
      title: "Backend Error",
      description: error instanceof Error ? error.message : "Failed to fetch data from backend",
      variant: "destructive"
    });
    throw error;
  }
};

/**
 * Get predictions from the backend API
 */
export const getPredictionsFromBackend = async (
  historicalData: AQIDataPoint[], 
  modelName: string
): Promise<AQIDataPoint[]> => {
  const settings = getBackendSettings();
  
  if (!settings.enabled || !settings.url) {
    throw new Error('Backend integration is not enabled');
  }
  
  try {
    console.log(`Sending prediction request to backend with model: ${modelName}`);
    console.log(`Backend URL: ${settings.url}/api/predict`);
    
    // Clean historical data to ensure it can be properly JSON serialized
    const cleanedData = historicalData.map(item => {
      const { date, city, location, aqi, pollutants } = item;
      return { 
        date, 
        city, 
        location, 
        aqi,
        pollutants: pollutants ? {
          pm25: pollutants.pm25 || 0,
          pm10: pollutants.pm10 || 0,
          no2: pollutants.no2 || 0,
          o3: pollutants.o3 || 0,
          co: pollutants.co || 0,
          so2: pollutants.so2 || 0,
          nh3: pollutants.nh3 || 0
        } : undefined
      };
    });
    
    const response = await fetch(`${settings.url}/api/predict`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        historical_data: cleanedData,
        model_name: modelName
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Backend API error: ${response.status} - ${errorText}`);
      throw new Error(`Backend API error: ${response.status} - ${errorText}`);
    }
    
    const predictions: AQIDataPoint[] = await response.json();
    console.log(`Received ${predictions.length} prediction points from backend`);
    return predictions;
  } catch (error) {
    console.error('Error getting predictions from backend:', error);
    toast({
      title: "Backend Error",
      description: error instanceof Error ? error.message : "Failed to get predictions from backend",
      variant: "destructive"
    });
    throw error;
  }
};
