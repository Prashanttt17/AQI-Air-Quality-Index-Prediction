
import { useState, useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';
import { isBackendEnabled } from '@/utils/enhanced-predictive-models';
import { getBackendSettings } from '@/utils/backend-integration';

type PredictionModel = 'ARIMA' | 'SARIMAX' | 'RandomForest' | 'LSTM';

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

      // Add default frontend models
      let models: PredictionModel[] = ['ARIMA', 'SARIMAX'];

      if (backendEnabled) {
        try {
          const settings = getBackendSettings();
          // Try to fetch available models from backend
          const response = await fetch(`${settings.url}/api/models`);
          
          if (response.ok) {
            const backendModels = await response.json();
            if (Array.isArray(backendModels)) {
              // Combine with frontend models ensuring no duplicates
              models = [...new Set([...models, ...backendModels])] as PredictionModel[];
            }
            console.log("Available models from backend:", models);
          }
        } catch (error) {
          console.error("Failed to fetch models from backend:", error);
          // Still using default models, so we don't need to do anything
        }
      }

      setAvailableModels(models);
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
