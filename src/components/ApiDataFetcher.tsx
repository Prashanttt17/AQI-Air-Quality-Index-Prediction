
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { DownloadCloud, RefreshCw, Info } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AQIDataService, AQIDataPoint, getApiUrl } from "@/utils/api-service";
import { generateSampleData } from "@/utils/aqi-utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface ApiDataFetcherProps {
  onDataLoaded: (data: AQIDataPoint[]) => void;
  selectedCity: string;
  disabled?: boolean;
}

const ApiDataFetcher: React.FC<ApiDataFetcherProps> = ({ 
  onDataLoaded, 
  selectedCity,
  disabled = false 
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [dataSource, setDataSource] = useState<'api' | 'sample'>('api');
  const apiUrl = getApiUrl();
  
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
    
    setIsLoading(true);
    
    try {
      let data: AQIDataPoint[];
      
      if (dataSource === 'api') {
        // Pass the selected city to the API service
        data = await AQIDataService.fetchAQIData(selectedCity);
      } else {
        // Generate sample data for the selected city
        data = generateSampleData(selectedCity);
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
        description: `Loaded ${data.length} data points for ${selectedCity} from ${dataSource === 'api' ? 'API' : 'sample data'}.`,
      });
    } catch (error) {
      console.error("Error fetching data:", error);
      
      // If API fails, use sample data as fallback
      if (dataSource === 'api') {
        const sampleData = generateSampleData(selectedCity);
            
        onDataLoaded(sampleData);
        
        toast({
          title: "API Error - Using Sample Data",
          description: `Failed to fetch from API for ${selectedCity}. Using sample data instead.`,
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
              <SelectItem value="api">API Data</SelectItem>
              <SelectItem value="sample">Sample Data</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
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
              Fetches real-time and historical AQI data from the API. Requires a valid API key to be set.
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
              Load {dataSource === 'api' ? 'API' : 'Sample'} Data for {selectedCity !== "Select City" ? selectedCity : "Selected City"}
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ApiDataFetcher;
