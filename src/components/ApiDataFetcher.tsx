
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { DownloadCloud, RefreshCw, Info } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AQIDataService, AQIDataPoint, getApiUrl, ApiPlatform } from "@/utils/api-service";
import { generateSampleData } from "@/utils/aqi-utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

interface ApiDataFetcherProps {
  onDataLoaded: (data: AQIDataPoint[]) => void;
  selectedCity: string;
  selectedPlatform: ApiPlatform;
  selectedState: string;
  disabled?: boolean;
}

const ApiDataFetcher: React.FC<ApiDataFetcherProps> = ({ 
  onDataLoaded, 
  selectedCity,
  selectedPlatform,
  selectedState,
  disabled = false 
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [dataSource, setDataSource] = useState<'api' | 'sample'>('api');
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);
  const [lastLocation, setLastLocation] = useState<string | null>(null);
  const apiUrl = getApiUrl(selectedPlatform);
  
  // Add throttling to prevent too many API requests
  const THROTTLE_TIME = 10000; // 10 seconds between API calls
  
  const handleFetchData = async () => {
    // If no city is selected or it's "Select City", show a toast and return
    if (!selectedCity || selectedCity === "Select City") {
      toast({
        title: "No City Selected",
        description: "Please select a city before fetching data.",
        variant: "destructive"
      });
      return;
    }
    
    // Check if we're trying to fetch too soon (throttle API calls)
    const currentTime = Date.now();
    if (dataSource === 'api' && currentTime - lastFetchTime < THROTTLE_TIME) {
      const waitTimeRemaining = Math.ceil((THROTTLE_TIME - (currentTime - lastFetchTime)) / 1000);
      toast({
        title: "Too Many Requests",
        description: `Please wait ${waitTimeRemaining} seconds before making another API request.`,
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      let data: AQIDataPoint[];
      
      if (dataSource === 'api') {
        // Update last fetch time
        setLastFetchTime(currentTime);
        
        // Pass the selected city and platform to the API service
        // Add selectedState as a parameter
        data = await AQIDataService.fetchAQIData(selectedCity, selectedState, undefined, selectedPlatform);
        
        // Check if we have specific location information (especially for AQICN API)
        if (data.length > 0 && data[0].location) {
          setLastLocation(data[0].location);
        } else {
          setLastLocation(null);
        }
        
        console.log("API Data Fetched:", data);
      } else {
        // Generate sample data for the selected city
        data = generateSampleData(selectedCity);
        setLastLocation(null);
      }
      
      if (data.length === 0) {
        toast({
          title: "No Data",
          description: "No data available from the selected source.",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }
      
      onDataLoaded(data);
      
      toast({
        title: "Success",
        description: `Loaded ${data.length} data points for ${selectedCity} from ${dataSource === 'api' ? selectedPlatform + ' API' : 'sample data'}.`,
      });
    } catch (error) {
      console.error("Error fetching data:", error);
      
      // If API fails, use sample data as fallback
      if (dataSource === 'api') {
        const sampleData = generateSampleData(selectedCity);
        setLastLocation(null);
            
        onDataLoaded(sampleData);
        
        toast({
          title: "API Error - Using Sample Data",
          description: `Failed to fetch from ${selectedPlatform.toUpperCase()} API for ${selectedCity}. Using sample data instead.`,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to generate sample data.",
          variant: "destructive"
        });
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">AQI Data Source</CardTitle>
        <CardDescription>
          Choose a data source and load AQI data
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Data Source</label>
          <Select 
            value={dataSource} 
            onValueChange={(value) => setDataSource(value as 'api' | 'sample')}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select data source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="api">{selectedPlatform.toUpperCase()} API Data</SelectItem>
              <SelectItem value="sample">Sample Data</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {lastLocation && (
          <div className="rounded-md bg-muted p-3">
            <h4 className="text-sm font-medium mb-1">Specific Location</h4>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">{lastLocation}</Badge>
              <span className="text-xs text-muted-foreground">in {selectedCity}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {selectedPlatform === 'aqicn' ? 
                'AQICN API provides data for specific monitoring stations in each city.' :
                'AirVisual API specific location information.'}
            </p>
          </div>
        )}
        
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>API Information</AlertTitle>
          <AlertDescription>
            The API endpoint is: <code className="bg-muted p-1 rounded">{apiUrl}</code>
            <br />
            You can access this API directly using the API key from the API Access tab.
          </AlertDescription>
        </Alert>
        
        <div className="rounded-md bg-muted p-4">
          <h4 className="text-sm font-medium mb-2">About the Data Source</h4>
          {dataSource === 'api' ? (
            <p className="text-xs text-muted-foreground">
              Fetches real-time and historical AQI data from the {selectedPlatform.toUpperCase()} API. Requires a valid API key to be set.
              Rate limited to one request every 10 seconds to avoid API throttling.
              {selectedPlatform === 'aqicn' && <span className="block mt-1">Note: AQICN API provides data for specific monitoring stations within cities.</span>}
              {selectedPlatform === 'airvisual' && <span className="block mt-1">Note: AirVisual API provides city-level data with limited station details.</span>}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Uses generated sample data for demonstration purposes. No API connection required.
            </p>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleFetchData}
          disabled={isLoading || disabled || !selectedCity || selectedCity === "Select City"}
          className="w-full"
        >
          {isLoading ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Loading Data...
            </>
          ) : (
            <>
              <DownloadCloud className="h-4 w-4 mr-2" />
              Load {dataSource === 'api' ? selectedPlatform.toUpperCase() + ' API' : 'Sample'} Data for {selectedCity !== "Select City" ? selectedCity : "Selected City"}
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ApiDataFetcher;
