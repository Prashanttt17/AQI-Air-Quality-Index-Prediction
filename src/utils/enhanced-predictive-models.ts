
import { AQIDataPoint } from '@/utils/api-service';
import { generateForecastData } from '@/utils/forecast-data-helpers';
import { getBackendSettings, getPredictionsFromBackend, testBackendConnection } from '@/utils/backend-integration';
import { toast } from '@/components/ui/use-toast';

/**
 * Format a date value to YYYY-MM-DD string format
 */
const formatToYYYYMMDD = (dateValue: string | Date | unknown): string => {
  if (typeof dateValue === 'string') {
    // Try to parse it as a date and format
    const dateObj = new Date(dateValue);
    if (!isNaN(dateObj.getTime())) {
      return dateObj.toISOString().split('T')[0];
    }
    // If parsing fails, return the original string
    return dateValue;
  } 
  
  if (dateValue instanceof Date) {
    return dateValue.toISOString().split('T')[0];
  }
  
  // Try to convert to a date if it's something else
  try {
    const dateObj = new Date(String(dateValue));
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
        description: "Please ensure your backend server is properly configured and running.",
        variant: "destructive"
      });
      
      return []; // Return empty array to show no predictions
    }
  }
  
  // If backend is not enabled, show notification
  toast({
    title: "Backend Integration Required",
    description: "Please enable and configure the Backend Integration to access predictions.",
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
      // First, test the backend connection
      const settings = getBackendSettings();
      const isConnected = await testBackendConnection(settings.url);
      
      if (!isConnected) {
        throw new Error("Cannot connect to backend server. Please check if it's running.");
      }
      
      // Validate that we have sufficient historical data
      if (!Array.isArray(historicalData) || historicalData.length < 3) {
        throw new Error("Insufficient historical data for prediction");
      }
      
      console.log(`Requesting backend prediction with model: ${modelName}`);
      console.log(`Historical data points: ${historicalData.length}`);
      
      // Add console logs for debugging
      console.log("Historical data sample:", historicalData.slice(0, 2));
      
      // Ensure dates are properly formatted as strings in YYYY-MM-DD format
      // This is critical to fix the timestamp comparison error
      const formattedHistoricalData = historicalData.map(item => {
        // Get the date as a string in YYYY-MM-DD format using our helper
        const formattedDate = formatToYYYYMMDD(item.date);
        
        return {
          ...item,
          date: formattedDate
        };
      });
      
      // Use the backend for predictions
      const predictions = await getPredictionsFromBackend(formattedHistoricalData, modelName);
      
      if (!Array.isArray(predictions) || predictions.length === 0) {
        console.error("Backend returned empty predictions");
        throw new Error("Backend returned empty predictions");
      }
      
      console.log(`Received ${predictions.length} prediction points from backend`);
      console.log("Prediction sample:", predictions.slice(0, 2));
      
      return predictions;
    } catch (error) {
      console.error("Backend prediction failed:", error);
      
      // Check for the specific timestamp error from the backend
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      if (errorMessage.includes("Cannot compare Timestamp with datetime.date") || 
          errorMessage.toLowerCase().includes("timestamp")) {
        toast({
          title: "Backend Date Format Error",
          description: "There was an issue with date formats. Please try again or contact support.",
          variant: "destructive"
        });
      } else {
        // Show notification with detailed error message
        toast({
          title: "Backend Prediction Failed",
          description: errorMessage,
          variant: "destructive"
        });
      }
      
      // Return empty array to show no predictions
      return [];
    }
  }
  
  // Show notification that backend is required
  toast({
    title: "Backend Integration Required",
    description: "Please enable and configure the Backend Integration to access predictions.",
    variant: "destructive"
  });
  
  // Return empty array to show no predictions
  return [];
};

/**
 * Check if backend integration is enabled and configured
 */
export const isBackendEnabled = (): boolean => {
  const settings = getBackendSettings();
  return settings.enabled && !!settings.url;
};
