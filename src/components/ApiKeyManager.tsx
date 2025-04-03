
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { Copy, Key, Save, Check, AlertCircle } from "lucide-react";
import { saveApiKey, getApiKey, getApiUrl, ApiPlatform } from "@/utils/api-service";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface ApiKeyManagerProps {
  selectedPlatform: ApiPlatform;
}

const ApiKeyManager: React.FC<ApiKeyManagerProps> = ({ selectedPlatform }) => {
  const [apiKey, setApiKey] = useState<string>('');
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  
  useEffect(() => {
    // Load existing API key on component mount or when platform changes
    const existingKey = getApiKey(selectedPlatform);
    if (existingKey) {
      setApiKey(existingKey);
      setIsSaved(true);
    } else {
      setApiKey('');
      setIsSaved(false);
    }
  }, [selectedPlatform]);
  
  const handleSaveKey = () => {
    if (!apiKey.trim()) {
      toast({
        title: "Error",
        description: "Please enter an API key first.",
        variant: "destructive"
      });
      return;
    }
    
    saveApiKey(apiKey, selectedPlatform);
    setIsSaved(true);
    
    toast({
      title: "API Key Saved",
      description: `Your ${selectedPlatform === 'airvisual' ? 'AirVisual' : 'AQICN'} API key has been saved successfully.`,
    });
  };
  
  const handleCopyKey = () => {
    if (!apiKey) return;
    
    navigator.clipboard.writeText(apiKey)
      .then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
        
        toast({
          title: "Copied",
          description: "API key copied to clipboard.",
        });
      })
      .catch(err => {
        console.error('Failed to copy:', err);
        toast({
          title: "Error",
          description: "Failed to copy API key to clipboard.",
          variant: "destructive"
        });
      });
  };
  
  const apiUrl = getApiUrl(selectedPlatform);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          {selectedPlatform === 'airvisual' ? 'AirVisual' : 'AQICN'} API Key
        </CardTitle>
        <CardDescription>
          Enter your {selectedPlatform === 'airvisual' ? 'AirVisual' : 'AQICN'} API key to access real-time air quality data
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Get your free API key</AlertTitle>
          <AlertDescription>
            {selectedPlatform === 'airvisual' ? (
              <>Visit <a href="https://www.iqair.com/air-pollution-data-api" className="text-primary underline" target="_blank" rel="noopener noreferrer">IQAir AirVisual</a> to get a free API key with up to 10,000 calls per month.</>
            ) : (
              <>Visit <a href="https://aqicn.org/data-platform/token/" className="text-primary underline" target="_blank" rel="noopener noreferrer">AQICN</a> to get a free API key with up to 1,000 calls per day.</>
            )}
          </AlertDescription>
        </Alert>
        
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Your API Key</h3>
          <div className="flex items-center gap-2">
            <Input
              type="text"
              value={apiKey}
              onChange={(e) => {
                setApiKey(e.target.value);
                setIsSaved(false);
              }}
              placeholder={`Enter your ${selectedPlatform === 'airvisual' ? 'AirVisual' : 'AQICN'} API key`}
              className="font-mono"
            />
            <Button 
              size="icon" 
              variant="outline" 
              onClick={handleCopyKey}
              disabled={!apiKey}
            >
              {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        
        <div className="rounded-md bg-muted p-3">
          <h4 className="text-sm font-medium mb-2">API Usage</h4>
          <div className="space-y-1">
            {selectedPlatform === 'airvisual' ? (
              <>
                <p className="text-xs text-muted-foreground">
                  <span className="font-semibold">Free Plan:</span> 10,000 calls per month (limited to ~300 calls per day)
                </p>
                <p className="text-xs text-muted-foreground">
                  <span className="font-semibold">Data Provided:</span> Current AQI, PM2.5, PM10, and basic weather data
                </p>
              </>
            ) : (
              <>
                <p className="text-xs text-muted-foreground">
                  <span className="font-semibold">Free Plan:</span> 1,000 calls per day
                </p>
                <p className="text-xs text-muted-foreground">
                  <span className="font-semibold">Data Provided:</span> Detailed AQI data with multiple pollutants including PM2.5, PM10, O3, NO2, SO2, CO
                </p>
              </>
            )}
            <p className="text-xs text-muted-foreground">
              <span className="font-semibold">Authentication:</span> API key must be provided with each request
            </p>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button
          onClick={handleSaveKey}
          disabled={!apiKey || isSaved}
          className="w-full"
        >
          <Save className="h-4 w-4 mr-2" />
          {isSaved ? "API Key Saved" : "Save API Key"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ApiKeyManager;
