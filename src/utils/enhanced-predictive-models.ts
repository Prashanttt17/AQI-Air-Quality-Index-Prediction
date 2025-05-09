
import { AQIDataPoint } from '@/utils/api-service';
import { generateForecastData } from '@/utils/forecast-data-helpers';
import { getBackendSettings, getPredictionsFromBackend } from '@/utils/backend-integration';
import { toast } from '@/components/ui/use-toast';

/**
 * Generate enhanced AQI predictions based on historical data and specified model
 * This function will use the backend integration if enabled, otherwise fallback to frontend simulation
 */
export const generateEnhancedPredictions = (
  historicalData: AQIDataPoint[], 
  modelName: string
): AQIDataPoint[] => {
  // Check if backend integration is enabled
  if (isBackendEnabled()) {
    try {
      console.log("Backend is enabled, but using frontend simulation for sync operation");
      console.log(`Will attempt async backend call for model: ${modelName}`);
      
      // Trigger the async call but don't wait for it
      generateEnhancedPredictionsAsync(historicalData, modelName)
        .then(backendPredictions => {
          console.log("Received backend predictions:", backendPredictions.length);
          // We could potentially update state here via a callback
          // but for now we'll just log the successful retrieval
        })
        .catch(err => {
          console.error("Backend prediction failed silently:", err);
        });
      
      // Return frontend simulation for immediate display
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
      // Validate that we have sufficient historical data
      if (!Array.isArray(historicalData) || historicalData.length < 3) {
        throw new Error("Insufficient historical data for prediction");
      }
      
      console.log(`Requesting backend prediction with model: ${modelName}`);
      console.log(`Historical data points: ${historicalData.length}`);
      
      // Use the backend for predictions
      const predictions = await getPredictionsFromBackend(historicalData, modelName);
      
      if (!Array.isArray(predictions) || predictions.length === 0) {
        throw new Error("Backend returned empty predictions");
      }
      
      console.log(`Received ${predictions.length} prediction points from backend`);
      return predictions;
    } catch (error) {
      console.error("Backend prediction failed, falling back to frontend simulation:", error);
      toast({
        title: "Backend Prediction Failed",
        description: "Using frontend simulation as fallback. Check your backend connection.",
        variant: "destructive"
      });
      
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
