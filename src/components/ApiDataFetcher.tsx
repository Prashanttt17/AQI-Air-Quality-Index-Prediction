
import React, { useState } from 'react';
import { ArrowDown, CloudSun, Database } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { generateSampleData } from '@/utils/aqi-utils';
import { AQIDataService, ApiPlatform, extractBaseCity } from '@/utils/api-service';

interface ApiDataFetcherProps {
  onDataLoaded: (data: any) => void;
  selectedCity: string;
  selectedState: string;
  selectedPlatform: ApiPlatform;
  disabled?: boolean;
}

const ApiDataFetcher: React.FC<ApiDataFetcherProps> = ({ onDataLoaded, selectedCity, selectedState, selectedPlatform, disabled = false }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [dataSource, setDataSource] = useState<'api' | 'sample'>('api');

  // Function to extract the displayable city name
  const getDisplayCityName = (cityWithLocation: string) => {
    if (cityWithLocation === "Select City") return cityWithLocation;
    
    // For AQICN data that might have format like "Sector 22, India"
    if (cityWithLocation.includes(',')) {
      // Extract only the base city name for better display
      if (selectedPlatform === 'aqicn') {
        const baseCity = extractBaseCity(cityWithLocation);
        if (baseCity !== cityWithLocation) {
          return baseCity; // Return the extracted base city name
        }
      }
      // For display purposes in the UI, we want to show both parts
      return cityWithLocation;
    }
    return cityWithLocation;
  };

  const handleFetchData = async () => {
    setIsLoading(true);
    
    try {
      let data;
      
      if (dataSource === 'api') {
        // Fetch data from the selected API platform
        if (selectedCity === "Select City") {
          throw new Error("Please select a city first");
        }
        
        data = await AQIDataService.fetchAQIData(selectedCity, selectedState, undefined, selectedPlatform);
      } else {
        // Generate sample data
        data = generateSampleData(selectedCity);
      }
      
      if (!data || data.length === 0) {
        throw new Error("No data received");
      }
      
      // Pass data back to parent component
      onDataLoaded(data);
      
      // Determine location text for message
      let locationText = getDisplayCityName(selectedCity);
      if (data && data.length > 0 && data[0].location) {
        if (selectedPlatform === 'aqicn') {
          // For AQICN, use the user-selected city name for better UX
          locationText = `${data[0].location}, ${extractBaseCity(data[0].city)}`;
        } else {
          locationText = `${data[0].location}, ${data[0].city}`;
        }
      }
      
      toast({
        title: "Success",
        description: `Loaded ${data.length} data points for ${locationText} from ${dataSource === 'api' ? selectedPlatform + ' API' : 'sample data'}.`,
      });
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Get display name for city
  const displayCityName = getDisplayCityName(selectedCity);

  return (
    <Card className="relative">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-xl">
          <CloudSun className="h-6 w-6" />
          Load AQI Data
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Button
            variant={dataSource === 'api' ? "default" : "outline"}
            onClick={() => setDataSource('api')}
            className="flex items-center justify-center py-6"
          >
            <CloudSun className="h-5 w-5 mr-2" />
            From {selectedPlatform === 'airvisual' ? 'AirVisual' : 'AQICN'} API
          </Button>
          
          <Button
            variant={dataSource === 'sample' ? "default" : "outline"}
            onClick={() => setDataSource('sample')}
            className="flex items-center justify-center py-6"
          >
            <Database className="h-5 w-5 mr-2" />
            Generate Sample Data
          </Button>
        </div>
        
        <Separator />
        
        {dataSource === 'api' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <div className="font-medium">Selected City</div>
                <div className="text-sm text-muted-foreground">
                  {displayCityName !== "Select City" ? displayCityName : "No city selected"}
                </div>
              </div>
              
              <div>
                <div className="font-medium">Selected State</div>
                <div className="text-sm text-muted-foreground">
                  {selectedState}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {dataSource === 'sample' && (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium block mb-2">City for Sample Data</label>
              <Select defaultValue={selectedCity} disabled={isLoading}>
                <SelectTrigger>
                  <SelectValue placeholder={displayCityName !== "Select City" ? displayCityName : "Select city for sample data"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={selectedCity !== "Select City" ? selectedCity : "New Delhi"}>
                    {displayCityName !== "Select City" ? displayCityName : "New Delhi"}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
        
        <div className="pt-4">
          <Button 
            onClick={handleFetchData} 
            disabled={disabled || isLoading || (dataSource === 'api' && selectedCity === "Select City")} 
            className="w-full"
          >
            {isLoading ? (
              <>
                <ArrowDown className="h-4 w-4 mr-2 animate-bounce" />
                Loading...
              </>
            ) : (
              <>
                <ArrowDown className="h-4 w-4 mr-2" />
                {dataSource === 'api' ? 'Fetch from API' : 'Generate Sample Data'}
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ApiDataFetcher;
