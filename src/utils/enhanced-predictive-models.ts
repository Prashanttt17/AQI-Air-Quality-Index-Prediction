
import { AQIDataPoint } from '@/utils/api-service';
import { generateForecastData } from '@/utils/forecast-data-helpers';
import { getBackendSettings } from '@/utils/backend-integration';

/**
 * Generate enhanced AQI predictions based on historical data and specified model
 * This function will use the frontend simulation but is designed to be easily replaced
 * with the backend integration when needed
 */
export const generateEnhancedPredictions = (
  historicalData: AQIDataPoint[], 
  modelName: string
): AQIDataPoint[] => {
  // For now, we'll use the frontend simulation logic
  // (Backend integration is handled in the UI components)
  return generateForecastData(historicalData);
};

/**
 * Check if backend integration is enabled
 */
export const isBackendEnabled = (): boolean => {
  const settings = getBackendSettings();
  return settings.enabled && !!settings.url;
};
