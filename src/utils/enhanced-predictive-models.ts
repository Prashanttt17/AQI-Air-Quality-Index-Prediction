
import { AQIDataPoint } from '@/utils/api-service';
import { generateForecastData } from '@/utils/forecast-data-helpers';
import { getBackendSettings, getPredictionsFromBackend } from '@/utils/backend-integration';

/**
 * Generate enhanced AQI predictions based on historical data and specified model
 * This function will use the backend integration if enabled, otherwise fallback to frontend simulation
 * 
 * Note: This function was updated to return the data directly instead of a Promise to match how it's used in the application
 */
export const generateEnhancedPredictions = (
  historicalData: AQIDataPoint[], 
  modelName: string
): AQIDataPoint[] => {
  // Check if backend integration is enabled
  if (isBackendEnabled()) {
    try {
      // For sync usage, we need to return the frontend simulation
      // Backend integration is still supported but will be used asynchronously
      console.log("Backend is enabled, but using frontend simulation for sync operation");
      return generateForecastData(historicalData);
    } catch (error) {
      console.error("Frontend simulation fallback:", error);
      return generateForecastData(historicalData);
    }
  }
  
  // Use frontend simulation if backend is not enabled
  return generateForecastData(historicalData);
};

/**
 * Asynchronous version of generateEnhancedPredictions that can be used
 * when you need to actually wait for backend predictions
 */
export const generateEnhancedPredictionsAsync = async (
  historicalData: AQIDataPoint[], 
  modelName: string
): Promise<AQIDataPoint[]> => {
  // Check if backend integration is enabled
  if (isBackendEnabled()) {
    try {
      // Use the backend for predictions
      const predictions = await getPredictionsFromBackend(historicalData, modelName);
      return predictions;
    } catch (error) {
      console.error("Backend prediction failed, falling back to frontend simulation:", error);
      // Fallback to frontend simulation if backend fails
      return generateForecastData(historicalData);
    }
  }
  
  // Use frontend simulation if backend is not enabled
  return generateForecastData(historicalData);
};

/**
 * Check if backend integration is enabled
 */
export const isBackendEnabled = (): boolean => {
  const settings = getBackendSettings();
  return settings.enabled && !!settings.url;
};
