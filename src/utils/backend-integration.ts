
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
      throw new Error(`Backend API error: ${response.status} - ${errorText}`);
    }
    
    const data: AQIDataPoint[] = await response.json();
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
    const response = await fetch(`${settings.url}/api/predict`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        historical_data: historicalData,
        model_name: modelName
      } as PredictionRequest),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Backend API error: ${response.status} - ${errorText}`);
    }
    
    const predictions: AQIDataPoint[] = await response.json();
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
