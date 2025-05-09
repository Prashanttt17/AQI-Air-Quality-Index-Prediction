
import { useState, useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';
import { isBackendEnabled } from '@/utils/enhanced-predictive-models';
import { getBackendSettings } from '@/utils/backend-integration';

type PredictionModel = 'ARIMA' | 'SARIMAX';

interface UsePredictionModelReturn {
  availableModels: PredictionModel[];
  selectedModel: PredictionModel;
  setSelectedModel: (model: PredictionModel) => void;
  isBackendConnected: boolean;
}

export function usePredictionModel(): UsePredictionModelReturn {
  const [availableModels, setAvailableModels] = useState<PredictionModel[]>(['ARIMA', 'SARIMAX']);
  const [selectedModel, setSelectedModel] = useState<PredictionModel>('ARIMA');
  const [isBackendConnected, setIsBackendConnected] = useState<boolean>(false);

  // Effect to check backend status and available models
  useEffect(() => {
    const checkBackendAndModels = async () => {
      const backendEnabled = isBackendEnabled();
      setIsBackendConnected(backendEnabled);

      // We're only supporting ARIMA and SARIMAX models
      const models: PredictionModel[] = ['ARIMA', 'SARIMAX'];
      setAvailableModels(models);
      
      if (backendEnabled) {
        try {
          // Let's verify backend connection
          const settings = getBackendSettings();
          const response = await fetch(`${settings.url}/`);
          
          if (response.ok) {
            console.log("Backend connection verified");
            // We successfully connected to the backend
            toast({
              title: "Backend Connected",
              description: "Successfully connected to the ML backend server",
            });
          }
        } catch (error) {
          console.error("Failed to connect to backend:", error);
          // Still using default models, so we don't need to do anything
        }
      }
    };

    checkBackendAndModels();
  }, []);

  return {
    availableModels,
    selectedModel,
    setSelectedModel,
    isBackendConnected
  };
}
