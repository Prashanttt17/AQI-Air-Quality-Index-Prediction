
import { useState, useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';
import { isBackendEnabled } from '@/utils/enhanced-predictive-models';
import { getBackendSettings, testBackendConnection } from '@/utils/backend-integration';

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
      
      if (!backendEnabled) {
        setIsBackendConnected(false);
        return;
      }
      
      try {
        // Let's verify backend connection
        const settings = getBackendSettings();
        if (!settings.url) {
          setIsBackendConnected(false);
          return;
        }
        
        console.log("Testing backend connection from usePredictionModel hook");
        const connected = await testBackendConnection(settings.url);
        setIsBackendConnected(connected);
        
        if (!connected) {
          console.error("Backend connection failed in usePredictionModel hook");
          toast({
            title: "Backend Connection Failed",
            description: "Could not connect to backend server. Make sure it's running properly.",
            variant: "destructive"
          });
        } else {
          console.log("Backend connection verified in usePredictionModel hook");
        }
      } catch (error) {
        console.error("Failed to connect to backend:", error);
        setIsBackendConnected(false);
        toast({
          title: "Backend Connection Error",
          description: "Could not connect to the backend server.",
          variant: "destructive"
        });
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
