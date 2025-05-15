
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
  console.log('Backend settings saved:', settings);
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
    console.log(`Using backend URL: ${settings.url}/api/fetch-aqi`);
    
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
 * Format a date value to YYYY-MM-DD string format
 */
const formatToYYYYMMDD = (dateValue: unknown): string => {
  // Handle Date objects
  if (dateValue && typeof dateValue === 'object' && 'toISOString' in dateValue && typeof dateValue.toISOString === 'function') {
    return dateValue.toISOString().split('T')[0];
  }
  
  // Handle string dates
  if (typeof dateValue === 'string') {
    const dateObj = new Date(dateValue);
    if (!isNaN(dateObj.getTime())) {
      return dateObj.toISOString().split('T')[0];
    }
    return dateValue;
  }
  
  // Try to convert to a date if it's something else
  try {
    const dateStr = String(dateValue);
    const dateObj = new Date(dateStr);
    if (!isNaN(dateObj.getTime())) {
      return dateObj.toISOString().split('T')[0];
    }
  } catch (e) {
    // Fallback
  }
  
  // Last resort - convert to string
  return String(dateValue);
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
    // and format all dates consistently as YYYY-MM-DD strings
    const cleanedData = historicalData.map(item => {
      const { date, city, location, aqi, pollutants } = item;
      
      // Ensure date is formatted as YYYY-MM-DD string using our helper
      const formattedDate = formatToYYYYMMDD(date);
      
      // Return a clean object with properly formatted date
      return { 
        date: formattedDate, 
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
    
    // Log the request data for debugging
    console.log('Sending prediction request with data:', {
      historical_data_sample: cleanedData.length > 0 ? cleanedData.slice(0, 2) : [],
      model_name: modelName
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
    
    // Log the response status
    console.log(`Backend prediction response status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Backend API error: ${response.status} - ${errorText}`);
      throw new Error(`Backend API error: ${response.status} - ${errorText}`);
    }
    
    let predictions: AQIDataPoint[] = [];
    
    try {
      predictions = await response.json();
      console.log("Raw response from backend:", predictions);
    } catch (error) {
      console.error('Error parsing backend response:', error);
      throw new Error('Failed to parse backend response as JSON');
    }
    
    // The backend may return an empty array or nullish value
    if (!Array.isArray(predictions)) {
      console.error('Backend returned invalid predictions format:', predictions);
      throw new Error('Backend returned invalid predictions format');
    }
    
    if (predictions.length === 0) {
      console.warn('Backend returned empty predictions array');
    } else {
      console.log(`Received ${predictions.length} prediction points from backend`);
      console.log("Prediction sample:", predictions.slice(0, 2));
      
      // Standardize date formats in the predictions for frontend consistency
      predictions = predictions.map(prediction => {
        // Use our helper function to format the date
        const formattedDate = formatToYYYYMMDD(prediction.date);
        
        return {
          ...prediction,
          date: formattedDate
        };
      });
    }
    
    return predictions;
  } catch (error) {
    console.error('Error getting predictions from backend:', error);
    
    // Check for specific backend errors and provide more helpful messages
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    
    if (errorMessage.includes('Cannot compare Timestamp with datetime.date')) {
      throw new Error('Backend date format error. The backend is having trouble processing dates.');
    }
    
    throw error;
  }
};

/**
 * Test connection to the backend server
 */
export const testBackendConnection = async (url: string): Promise<boolean> => {
  if (!url) return false;
  
  try {
    console.log(`Testing connection to backend: ${url}`);
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // Add cache control to prevent browser caching
      cache: 'no-store',
    });
    
    console.log(`Backend connection test response status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Backend connection test response:', data);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error testing backend connection:', error);
    return false;
  }
};
