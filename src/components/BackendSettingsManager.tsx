
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { Server, Loader2, AlertTriangle } from 'lucide-react';
import { getBackendSettings, saveBackendSettings, testBackendConnection } from '@/utils/backend-integration';

/**
 * Component for managing backend server settings
 */
const BackendSettingsManager = () => {
  const [backendEnabled, setBackendEnabled] = useState(false);
  const [backendUrl, setBackendUrl] = useState('');
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'unknown'>('unknown');
  const [showTimestampWarning, setShowTimestampWarning] = useState(false);
  
  // Load settings on component mount
  useEffect(() => {
    const settings = getBackendSettings();
    setBackendEnabled(settings.enabled);
    setBackendUrl(settings.url || 'http://127.0.0.1:8000');
    
    // Check connection status if enabled
    if (settings.enabled && settings.url) {
      handleTestConnection(settings.url, false);
    }
  }, []);
  
  // Save settings when they change
  const handleSaveSettings = async () => {
    // Clean URL (remove trailing slash if present)
    const cleanedUrl = backendUrl.trim().replace(/\/$/, '');
    
    // First test the connection before saving
    if (backendEnabled && cleanedUrl) {
      setIsTestingConnection(true);
      const isConnected = await testBackendConnection(cleanedUrl);
      setIsTestingConnection(false);
      
      if (!isConnected) {
        toast({
          title: "Connection Failed",
          description: "Unable to connect to the backend server. Please check the URL and ensure the server is running.",
          variant: "destructive"
        });
        setConnectionStatus('disconnected');
        return;
      }
      
      setConnectionStatus('connected');
    }
    
    // Save settings regardless of connection test result
    saveBackendSettings({
      enabled: backendEnabled,
      url: cleanedUrl
    });
    
    setBackendUrl(cleanedUrl);
    
    toast({
      title: "Settings Saved",
      description: backendEnabled 
        ? "Backend integration has been enabled"
        : "Backend integration has been disabled",
    });
    
    // Show timestamp warning if backend enabled to help troubleshoot
    if (backendEnabled) {
      setShowTimestampWarning(true);
    } else {
      setShowTimestampWarning(false);
    }
  };
  
  // Test connection to the backend
  const handleTestConnection = async (url = backendUrl, showToast = true) => {
    if (!url.trim()) {
      if (showToast) {
        toast({
          title: "Error",
          description: "Please enter a backend URL",
          variant: "destructive"
        });
      }
      setConnectionStatus('disconnected');
      return;
    }
    
    setIsTestingConnection(true);
    
    try {
      const isConnected = await testBackendConnection(url);
      
      if (isConnected) {
        setConnectionStatus('connected');
        if (showToast) {
          toast({
            title: "Connection Successful",
            description: "Successfully connected to the AQI Prediction backend",
          });
        }
      } else {
        setConnectionStatus('disconnected');
        if (showToast) {
          toast({
            title: "Connection Failed",
            description: "Could not connect to the specified backend server. Make sure it's running and accessible.",
            variant: "destructive"
          });
        }
      }
    } catch (error) {
      console.error("Error testing backend connection:", error);
      setConnectionStatus('disconnected');
      if (showToast) {
        toast({
          title: "Connection Failed",
          description: "Could not connect to the specified backend server",
          variant: "destructive"
        });
      }
    } finally {
      setIsTestingConnection(false);
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Server className="h-6 w-6" />
          Backend Integration Setup
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
              placeholder="http://127.0.0.1:8000 or http://localhost:8000"
              value={backendUrl}
              onChange={(e) => setBackendUrl(e.target.value)}
              disabled={!backendEnabled}
              className="flex-1"
            />
            <Button 
              variant="outline" 
              onClick={() => handleTestConnection()}
              disabled={!backendEnabled || !backendUrl || isTestingConnection}
              className={connectionStatus === 'connected' ? 'bg-green-100 dark:bg-green-900/30' : ''}
            >
              {isTestingConnection ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testing...
                </>
              ) : connectionStatus === 'connected' ? (
                'Connected'
              ) : (
                'Test Connection'
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            The URL where your AQI backend server is running (usually http://127.0.0.1:8000 or http://localhost:8000)
          </p>
        </div>
        
        {showTimestampWarning && (
          <div className="bg-amber-100 dark:bg-amber-900/20 p-4 rounded-md flex items-start gap-2 border border-amber-300 dark:border-amber-800">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-sm">Important Note:</h4>
              <p className="text-xs mt-1">The backend now uses consistent date formatting that should prevent the common "Cannot compare Timestamp with datetime.date" error. If you still experience this error, try restarting both the frontend and backend.</p>
            </div>
          </div>
        )}
        
        <div className="bg-muted p-4 rounded-md">
          <h3 className="font-medium mb-2">Connection Steps</h3>
          <p className="text-sm mb-2">1. Start the backend server:</p>
          <pre className="bg-slate-800 text-slate-100 p-2 rounded text-xs overflow-x-auto">
            cd backend
            uvicorn main:app --reload
          </pre>
          <p className="text-sm mt-3 mb-2">2. Enter the correct URL (copy from terminal):</p>
          <code className="text-xs bg-slate-800 text-slate-100 p-1 rounded">http://127.0.0.1:8000</code>
          <p className="text-sm mt-3">3. Click "Test Connection" then "Save Settings"</p>
          <p className="text-sm mt-3">4. Go to dashboard, select city and view predictions</p>
        </div>
      </CardContent>
      
      <CardFooter className="flex flex-col space-y-4 items-stretch">
        <Button onClick={handleSaveSettings} className="w-full">Save Settings</Button>
        <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
          <p className="font-medium">Troubleshooting:</p>
          <ul className="list-disc pl-4 mt-1">
            <li>Ensure backend server is running (check terminal)</li>
            <li>Make sure to copy the exact URL from the terminal (http://127.0.0.1:8000)</li>
            <li>If you see "Cannot compare Timestamp with datetime.date" errors in the backend logs, the frontend has been updated to fix this issue</li>
            <li>For persistent timestamp comparison errors, try restarting both the backend and frontend</li>
            <li>Check that you're using Python 3.7+ for the backend</li>
            <li>Make sure all backend dependencies are installed: <code>pip install -r requirements.txt</code></li>
          </ul>
        </div>
      </CardFooter>
    </Card>
  );
};

export default BackendSettingsManager;
