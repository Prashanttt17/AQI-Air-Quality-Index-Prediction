
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

export type ApiPlatform = 'airvisual' | 'aqicn';

interface ApiPlatformSelectorProps {
  selectedPlatform: ApiPlatform;
  onPlatformChange: (platform: ApiPlatform) => void;
  className?: string;
  onResetLocationState?: () => void;  // Add this new prop
}

const ApiPlatformSelector: React.FC<ApiPlatformSelectorProps> = ({
  selectedPlatform,
  onPlatformChange,
  className,
  onResetLocationState
}) => {
  // Handle platform change with reset
  const handlePlatformChange = (value: string) => {
    const platform = value as ApiPlatform;
    onPlatformChange(platform);
    // Reset location state when platform changes
    if (onResetLocationState) {
      onResetLocationState();
    }
  };
  
  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-medium">API Platform</CardTitle>
        <CardDescription>
          Select which API platform to use for AQI data
        </CardDescription>
      </CardHeader>
      <CardContent>
        <RadioGroup 
          value={selectedPlatform} 
          onValueChange={handlePlatformChange}
          className="space-y-4"
        >
          <div className="flex items-start space-x-3 p-3 rounded-md border">
            <RadioGroupItem value="airvisual" id="airvisual" className="mt-1" />
            <div className="space-y-1.5">
              <Label htmlFor="airvisual" className="text-base font-medium">AirVisual API</Label>
              <p className="text-sm text-muted-foreground">
                Provides AQI data with PM2.5, PM10, and weather information.
                Free tier offers up to 10,000 calls/month.
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-3 p-3 rounded-md border">
            <RadioGroupItem value="aqicn" id="aqicn" className="mt-1" />
            <div className="space-y-1.5">
              <Label htmlFor="aqicn" className="text-base font-medium">AQICN API</Label>
              <p className="text-sm text-muted-foreground">
                World Air Quality Index project API with detailed pollutant data.
                Free tier offers up to 1,000 calls/day.
              </p>
            </div>
          </div>
        </RadioGroup>
      </CardContent>
    </Card>
  );
};

export default ApiPlatformSelector;
