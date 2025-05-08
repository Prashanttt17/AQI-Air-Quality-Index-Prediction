
import { AQIDataPoint } from '@/utils/api-service';
import { generateForecastData } from '@/utils/forecast-data-helpers';
import { getBackendSettings, getPredictionsFromBackend } from '@/utils/backend-integration';

/**
 * Generate enhanced AQI predictions based on historical data and specified model
 * This function will use the backend integration if enabled, otherwise fallback to frontend simulation
 */
export const generateEnhancedPredictions = async (
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
