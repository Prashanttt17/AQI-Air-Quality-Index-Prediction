
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { Server, Loader2 } from 'lucide-react';
import { getBackendSettings, saveBackendSettings } from '@/utils/backend-integration';

/**
 * Component for managing backend server settings
 */
const BackendSettingsManager = () => {
  const [backendEnabled, setBackendEnabled] = useState(false);
  const [backendUrl, setBackendUrl] = useState('');
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  
  // Load settings on component mount
  useEffect(() => {
    const settings = getBackendSettings();
    setBackendEnabled(settings.enabled);
    setBackendUrl(settings.url);
  }, []);
  
  // Save settings when they change
  const handleSaveSettings = () => {
    saveBackendSettings({
      enabled: backendEnabled,
      url: backendUrl.trim()
    });
    
    toast({
      title: "Settings Saved",
      description: backendEnabled 
        ? "Backend integration has been enabled"
        : "Backend integration has been disabled",
    });
  };
  
  // Test connection to the backend
  const handleTestConnection = async () => {
    if (!backendUrl.trim()) {
      toast({
        title: "Error",
        description: "Please enter a backend URL",
        variant: "destructive"
      });
      return;
    }
    
    setIsTestingConnection(true);
    
    try {
      const response = await fetch(`${backendUrl}/`);
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.message && data.message.includes("AQI Prediction API")) {
          toast({
            title: "Connection Successful",
            description: "Successfully connected to the AQI Prediction backend",
          });
        } else {
          toast({
            title: "Connection Warning",
            description: "Connected to a server, but it may not be the correct AQI Prediction backend",
            variant: "destructive"
          });
        }
      } else {
        toast({
          title: "Connection Failed",
          description: `Server responded with status: ${response.status}`,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error testing backend connection:", error);
      toast({
        title: "Connection Failed",
        description: "Could not connect to the specified backend server",
        variant: "destructive"
      });
    } finally {
      setIsTestingConnection(false);
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Server className="h-6 w-6" />
          Backend Integration
        </CardTitle>
        <CardDescription>
          Connect to a Python backend running the AQI prediction models
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="backend-enabled">Enable Backend Integration</Label>
            <p className="text-sm text-muted-foreground">
              Use a separate backend server for AQI predictions
            </p>
          </div>
          <Switch
            id="backend-enabled"
            checked={backendEnabled}
            onCheckedChange={setBackendEnabled}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="backend-url">Backend URL</Label>
          <div className="flex gap-2">
            <Input
              id="backend-url"
              placeholder="http://localhost:8000 or https://yourngrok.url"
              value={backendUrl}
              onChange={(e) => setBackendUrl(e.target.value)}
              disabled={!backendEnabled}
              className="flex-1"
            />
            <Button 
              variant="outline" 
              onClick={handleTestConnection}
              disabled={!backendEnabled || !backendUrl || isTestingConnection}
            >
              {isTestingConnection ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testing...
                </>
              ) : (
                'Test Connection'
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            The URL where your AQI backend server is running
          </p>
        </div>
      </CardContent>
      
      <CardFooter>
        <Button onClick={handleSaveSettings}>Save Settings</Button>
      </CardFooter>
    </Card>
  );
};

export default BackendSettingsManager;
