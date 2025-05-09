
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Server, Cpu, BarChart } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import BackendSettingsManager from '@/components/BackendSettingsManager';
import { getBackendSettings } from '@/utils/backend-integration';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const BackendSettingsPage = () => {
  const navigate = useNavigate();
  const [backendStatus, setBackendStatus] = useState<'connected' | 'disconnected' | 'unknown'>('unknown');
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('connection');

  useEffect(() => {
    // Check backend status
    const checkBackendStatus = async () => {
      const settings = getBackendSettings();
      if (!settings.enabled || !settings.url) {
        setBackendStatus('disconnected');
        return;
      }

      try {
        const response = await fetch(`${settings.url}/`);
        if (response.ok) {
          setBackendStatus('connected');
          
          // Try to fetch available models if connected
          try {
            const modelsResponse = await fetch(`${settings.url}/api/models`);
            if (modelsResponse.ok) {
              const models = await modelsResponse.json();
              setAvailableModels(models);
            }
          } catch (error) {
            console.error("Couldn't fetch models:", error);
          }
        } else {
          setBackendStatus('disconnected');
        }
      } catch (error) {
        console.error("Error checking backend status:", error);
        setBackendStatus('disconnected');
      }
    };

    checkBackendStatus();
  }, []);

  return (
    <div className="container py-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Backend Settings</h1>
        </div>
      </div>

      {/* Status indicator */}
      <Alert className={`mb-6 ${backendStatus === 'connected' ? 'border-green-500' : 'border-amber-500'}`}>
        <Server className={`h-4 w-4 ${backendStatus === 'connected' ? 'text-green-500' : 'text-amber-500'}`} />
        <AlertTitle>Backend Status: {backendStatus === 'connected' ? 'Connected' : 'Disconnected'}</AlertTitle>
        <AlertDescription>
          {backendStatus === 'connected' 
            ? 'Your backend server is properly connected and available for advanced predictions.' 
            : 'Configure and enable your backend connection to access advanced prediction models.'}
        </AlertDescription>
      </Alert>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="connection" className="text-base">
            <Server className="h-5 w-5 mr-2" />
            Connection Settings
          </TabsTrigger>
          <TabsTrigger value="models" className="text-base">
            <Cpu className="h-5 w-5 mr-2" />
            ML Models
          </TabsTrigger>
        </TabsList>

        <TabsContent value="connection" className="space-y-4">
          <BackendSettingsManager />
          
          <Card>
            <CardHeader>
              <CardTitle>Configuration Guide</CardTitle>
              <CardDescription>
                How to set up and connect your backend server
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-base font-medium">Local Backend Setup</h3>
                <div className="rounded-md bg-muted p-4">
                  <p className="text-sm mb-2">1. Navigate to your backend directory:</p>
                  <pre className="bg-slate-800 text-slate-100 p-2 rounded text-xs overflow-x-auto">
                    cd backend
                  </pre>
                  
                  <p className="text-sm mb-2 mt-4">2. Install requirements:</p>
                  <pre className="bg-slate-800 text-slate-100 p-2 rounded text-xs overflow-x-auto">
                    pip install -r requirements.txt
                  </pre>
                  
                  <p className="text-sm mb-2 mt-4">3. Start the server:</p>
                  <pre className="bg-slate-800 text-slate-100 p-2 rounded text-xs overflow-x-auto">
                    uvicorn main:app --reload
                  </pre>
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-base font-medium">Connection Information</h3>
                <ul className="list-disc pl-5 space-y-1 text-sm">
                  <li>For local backend: Use <code className="bg-muted px-1">http://localhost:8000</code></li>
                  <li>For Colab backend: Use the provided ngrok URL (e.g., <code className="bg-muted px-1">https://xxxx-xxxx-xxxx.ngrok.io</code>)</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="models" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cpu className="h-6 w-6" />
                Available Prediction Models
              </CardTitle>
              <CardDescription>
                Machine learning models available for AQI prediction
              </CardDescription>
            </CardHeader>
            <CardContent>
              {backendStatus === 'connected' ? (
                availableModels.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {availableModels.map((model, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <h3 className="font-medium mb-2">{model}</h3>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <BarChart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      Model information unavailable. The backend may not support model listing.
                    </p>
                  </div>
                )
              ) : (
                <div className="text-center py-8">
                  <Server className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Connect to a backend server to view available models.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Model Information</CardTitle>
              <CardDescription>
                Details about the prediction models
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border rounded-lg p-4">
                  <h3 className="font-medium mb-2">ARIMA Model</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    AutoRegressive Integrated Moving Average model for time series forecasting.
                  </p>
                  <p className="text-xs bg-muted p-2 rounded">
                    Best for short-term predictions with clear trends and patterns.
                  </p>
                </div>
                
                <div className="border rounded-lg p-4">
                  <h3 className="font-medium mb-2">SARIMAX Model</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    Seasonal ARIMA with eXogenous variables for complex seasonal patterns.
                  </p>
                  <p className="text-xs bg-muted p-2 rounded">
                    Handles seasonal data with additional external variables.
                  </p>
                </div>

                <div className="border rounded-lg p-4">
                  <h3 className="font-medium mb-2">Random Forest</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    Ensemble learning method using multiple decision trees.
                  </p>
                  <p className="text-xs bg-muted p-2 rounded">
                    Good for capturing non-linear relationships in data.
                  </p>
                </div>

                <div className="border rounded-lg p-4">
                  <h3 className="font-medium mb-2">LSTM</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    Long Short-Term Memory neural network for sequence prediction.
                  </p>
                  <p className="text-xs bg-muted p-2 rounded">
                    Advanced deep learning model for complex patterns and long-term dependencies.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BackendSettingsPage;
