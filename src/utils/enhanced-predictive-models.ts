
import { AQIDataPoint } from '@/utils/api-service';
import { generateForecastData } from '@/utils/forecast-data-helpers';
import { getBackendSettings, getPredictionsFromBackend } from '@/utils/backend-integration';
import { toast } from '@/components/ui/use-toast';

/**
 * Generate enhanced AQI predictions based on historical data and specified model
 * This function will use the backend integration if enabled, otherwise don't show predictions
 */
export const generateEnhancedPredictions = (
  historicalData: AQIDataPoint[], 
  modelName: string
): AQIDataPoint[] => {
  // Check if backend integration is enabled
  if (isBackendEnabled()) {
    try {
      console.log("Backend is enabled, attempting backend prediction");
      
      // Trigger the async call but don't wait for it
      // Instead of showing frontend simulation, we'll wait for backend data
      return []; // Return empty array initially, will be populated by async call
    } catch (error) {
      console.error("Backend integration error:", error);
      
      // Show notification that backend is required
      toast({
        title: "Backend Integration Required",
        description: "Please connect the Backend Integration to enable prediction.",
        variant: "destructive"
      });
      
      return []; // Return empty array to show no predictions
    }
  }
  
  // If backend is not enabled, show notification
  toast({
    title: "Backend Integration Required",
    description: "Please connect the Backend Integration to enable prediction.",
    variant: "destructive"
  });
  
  // Return empty array to show no predictions
  return [];
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
      
      // Add console logs for debugging
      console.log("Historical data sample:", historicalData.slice(0, 2));
      
      // Use the backend for predictions
      const predictions = await getPredictionsFromBackend(historicalData, modelName);
      
      if (!Array.isArray(predictions) || predictions.length === 0) {
        console.error("Backend returned empty predictions");
        throw new Error("Backend returned empty predictions");
      }
      
      console.log(`Received ${predictions.length} prediction points from backend`);
      console.log("Prediction sample:", predictions.slice(0, 2));
      
      return predictions;
    } catch (error) {
      console.error("Backend prediction failed:", error);
      
      // Show notification that backend is required
      toast({
        title: "Backend Error",
        description: error instanceof Error ? error.message : "Please ensure your backend server is running correctly.",
        variant: "destructive"
      });
      
      // Return empty array to show no predictions
      return [];
    }
  }
  
  // Show notification that backend is required
  toast({
    title: "Backend Integration Required",
    description: "Please connect the Backend Integration to enable prediction.",
    variant: "destructive"
  });
  
  // Return empty array to show no predictions
  return [];
};

/**
 * Check if backend integration is enabled
 */
export const isBackendEnabled = (): boolean => {
  const settings = getBackendSettings();
  return settings.enabled && !!settings.url;
};
