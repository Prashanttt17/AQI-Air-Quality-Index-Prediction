
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

  // Effect to check backend status
  useEffect(() => {
    const checkBackend = async () => {
      const backendEnabled = isBackendEnabled();
      setIsBackendConnected(backendEnabled);
      
      if (backendEnabled) {
        try {
          // Let's verify backend connection
          const settings = getBackendSettings();
          const response = await fetch(`${settings.url}/`);
          
          if (response.ok) {
            console.log("Backend connection verified");
            // Successfully connected to the backend
            setIsBackendConnected(true);
          } else {
            console.error("Backend connection failed with status:", response.status);
            setIsBackendConnected(false);
            toast({
              title: "Backend Connection Failed",
              description: "Please check your backend server and settings.",
              variant: "destructive"
            });
          }
        } catch (error) {
          console.error("Failed to connect to backend:", error);
          setIsBackendConnected(false);
        }
      } else {
        setIsBackendConnected(false);
      }
    };

    checkBackend();
  }, []);

  return {
    availableModels,
    selectedModel,
    setSelectedModel,
    isBackendConnected
  };
}
