import React, { useState, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { toast } from '@/components/ui/use-toast';
import { CloudSun, Database, Key } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import NavLinks from '@/components/NavLinks';

import AQIInfoCard from '@/components/AQIInfoCard';
import AQIChart from '@/components/AQIChart';
import FileUpload from '@/components/FileUpload';
import ApiDataFetcher from '@/components/ApiDataFetcher';
import ApiKeyManager from '@/components/ApiKeyManager';
import ApiPlatformSelector from '@/components/ApiPlatformSelector';
import BackendSettingsManager from '@/components/BackendSettingsManager';
import ModelSelector from '@/components/ModelSelector';
import PollutantsDisplay from '@/components/PollutantsDisplay';
import CitySelector from '@/components/CitySelector';
import WeeklyPredictionTable from '@/components/WeeklyPredictionTable';
import { ThemeToggle } from '@/components/theme-toggle';

import { generateSampleData } from '@/utils/aqi-utils';
import { generateEnhancedPredictions, generateEnhancedPredictionsAsync, isBackendEnabled } from '@/utils/enhanced-predictive-models';
import { AQIDataPoint, getApiKey, AQIDataService, ApiPlatform, extractBaseCity } from '@/utils/api-service';

const Index = () => {
  // State for data management
  const [rawData, setRawData] = useState<AQIDataPoint[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('ARIMA');
  const [predictions, setPredictions] = useState<AQIDataPoint[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [selectedCity, setSelectedCity] = useState<string>("Select City");
  const [selectedTab, setSelectedTab] = useState<string>('dashboard');
  const [isPollutantsOpen, setIsPollutantsOpen] = useState<boolean>(false);
  const [dataLoaded, setDataLoaded] = useState<boolean>(false);
  const [selectedApiPlatform, setSelectedApiPlatform] = useState<ApiPlatform>('airvisual');
  const [selectedState, setSelectedState] = useState<string>("All States");
  const [loadingPredictions, setLoadingPredictions] = useState<boolean>(false);
  
  // Current, tomorrow, and weekly average AQI values
  const [currentAQI, setCurrentAQI] = useState<number>(0);
  const [tomorrowAQI, setTomorrowAQI] = useState<number>(0);
  const [weeklyAvgAQI, setWeeklyAvgAQI] = useState<number>(0);
  
  // Check for API key and show notification if missing
  useEffect(() => {
    const apiKey = getApiKey(selectedApiPlatform);
    if (!apiKey) {
      toast({
        title: `${selectedApiPlatform === 'airvisual' ? 'AirVisual' : 'AQICN'} API Key Missing`,
        description: `Set your ${selectedApiPlatform === 'airvisual' ? 'AirVisual' : 'AQICN'} API key in the API Access tab to fetch real data.`,
      });
    }
  }, [selectedApiPlatform]);
  
  // Reset location state when API platform changes
  const handleResetLocationState = () => {
    setSelectedState("All States");
    setSelectedCity("Select City");
    setRawData([]);
    setPredictions([]);
    setCurrentAQI(0);
    setTomorrowAQI(0);
    setWeeklyAvgAQI(0);
    setDataLoaded(false);
  };
  
  // Handle API platform change
  const handleApiPlatformChange = (platform: ApiPlatform) => {
    setSelectedApiPlatform(platform);
    
    // Reset data when platform changes
    setRawData([]);
    setPredictions([]);
    setDataLoaded(false);
  };
  
  // Function to display city and location properly
  const getDisplayLocation = (cityWithLocation: string, city: string, location?: string) => {
    if (location) {
      // For AQICN data, we want to show the user-selected city when possible
      if (selectedApiPlatform === 'aqicn' && selectedCity !== "Select City") {
        const baseCity = extractBaseCity(selectedCity);
        if (baseCity && city.includes(baseCity)) {
          return `${location}, ${baseCity}`;
        }
      }
      return `${location}, ${city}`;
    }
    
    if (cityWithLocation && cityWithLocation.includes(',')) {
      // For AQICN data like "Sector 22, India", extract the main city
      if (selectedApiPlatform === 'aqicn') {
        const baseCity = extractBaseCity(cityWithLocation);
        return baseCity;
      }
      return cityWithLocation;
    }
    
    return city;
  };
  
  // Function to fetch data for a selected city
  const fetchDataForSelectedCity = async (city: string, state: string, platform: ApiPlatform = selectedApiPlatform) => {
    if (city === "Select City") return;
    
    try {
      const apiKey = getApiKey(platform);
      if (apiKey) {
        const data = await AQIDataService.fetchAQIData(city, state, undefined, platform);
        if (data && data.length > 0) {
          handleDataLoaded(data);
        }
      }
    } catch (error) {
      console.error("Error fetching data for city:", error);
    }
  };
  
  // Handle city selection
  const handleCityChange = async (city: string) => {
    setSelectedCity(city);
    
    // Reset data if "Select City" is chosen
    if (city === "Select City") {
      setRawData([]);
      setPredictions([]);
      setCurrentAQI(0);
      setTomorrowAQI(0);
      setWeeklyAvgAQI(0);
      setDataLoaded(false);
    } else {
      // Automatically fetch data for the selected city for current API platform
      fetchDataForSelectedCity(city, selectedState);
    }
  };
  
  // Handle state selection
  const handleStateChange = (state: string) => {
    setSelectedState(state);
    // We don't reset the city here to maintain selection across tabs
  };
  
  // Handle data loading (from API, file upload, or sample)
  const handleDataLoaded = (data: AQIDataPoint[]) => {
    if (!Array.isArray(data) || data.length === 0) {
      toast({
        title: "Error",
        description: "No valid data received",
        variant: "destructive"
      });
      return;
    }
    
    // Extract base city name for matching
    let baseCity = selectedCity;
    let selectedLocation = null;
    
    if (selectedCity.includes(',')) {
      const parts = selectedCity.split(',');
      selectedLocation = parts[0].trim();
      baseCity = parts[parts.length - 1].trim();
    }
    
    // Ensure all data has the required fields
    const validData = data.filter(item => {
      return item && 
             typeof item === 'object' && 
             item.date && 
             item.city && 
             typeof item.aqi === 'number' && 
             !isNaN(item.aqi);
    });
    
    if (validData.length === 0) {
      toast({
        title: "Error",
        description: "No valid data entries found",
        variant: "destructive"
      });
      return;
    }
    
    console.log("Valid data loaded:", validData);
    setRawData(validData);
    setDataLoaded(true);
    
    // Extract unique cities with location information if available
    const uniqueCitiesWithLocation = [...new Set(
      validData.map(item => item.location ? `${item.location}, ${item.city}` : item.city)
    )];
    setCities(uniqueCitiesWithLocation);
    
    // If we loaded data for a specific city, make sure it's selected
    if (validData.length > 0) {
      const firstItem = validData[0];
      const cityDisplay = firstItem.location ? 
        `${firstItem.location}, ${firstItem.city}` : 
        firstItem.city;
      
      if (selectedCity === "Select City" || selectedCity !== cityDisplay) {
        setSelectedCity(cityDisplay);
      }
    }
  };
  
  // Preserve tab selection
  const handleTabChange = (value: string) => {
    setSelectedTab(value);
    
    // If we're coming back to the dashboard, ensure the city display is correct
    if (value === 'dashboard' && dataLoaded && rawData.length > 0 && selectedCity !== "Select City") {
      // No need to reload data, just make sure the city is displayed correctly
      if (selectedApiPlatform === 'aqicn' && selectedCity.includes(',')) {
        const baseCity = extractBaseCity(selectedCity);
        if (baseCity && baseCity !== selectedCity && rawData[0] && rawData[0].city.includes(baseCity)) {
          // Update the display of the city, but don't actually change the selection
          console.log("Preserving selected city on tab change:", selectedCity, baseCity);
        }
      }
    }
  };
  
  // Update predictions when model, city, or data changes
  useEffect(() => {
    if (rawData.length === 0 || !selectedCity || selectedCity === "Select City") {
      // Reset predictions if no data or no city selected
      setPredictions([]);
      setCurrentAQI(0);
      setTomorrowAQI(0);
      setWeeklyAvgAQI(0);
      return;
    }
    
    // Extract base city name for matching
    let baseCity = selectedCity;
    let selectedLocation = null;
    
    if (selectedCity.includes(',')) {
      const parts = selectedCity.split(',');
      selectedLocation = parts[0].trim();
      baseCity = parts[parts.length - 1].trim();
    }
    
    // Filter data for selected city, including checking both city and location fields
    const cityData = rawData.filter(item => {
      const itemCity = item.city;
      const itemLocation = item.location;
      const fullItemLocation = itemLocation ? `${itemLocation}, ${itemCity}` : itemCity;
      
      // Check if the item matches either the direct city name or the location-city combination
      return itemCity === selectedCity || 
             fullItemLocation === selectedCity ||
             (selectedCity.includes(itemCity) && (!selectedLocation || itemLocation === selectedLocation));
    });
    
    if (cityData.length === 0) {
      setPredictions([]);
      setCurrentAQI(0);
      setTomorrowAQI(0);
      setWeeklyAvgAQI(0);
      return;
    }
    
    // Sort data by date
    cityData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // Set current AQI if we have data
    if (cityData.length > 0) {
      setCurrentAQI(cityData[cityData.length - 1].aqi);
    }
    
    // Check if backend is enabled
    if (isBackendEnabled()) {
      setLoadingPredictions(true);
      
      // Use async function to get predictions from backend
      generateEnhancedPredictionsAsync(cityData, selectedModel)
        .then(backendPredictions => {
          if (backendPredictions && backendPredictions.length > 0) {
            // Preserve location information from original data
            if (cityData[0].location) {
              backendPredictions.forEach(pred => {
                pred.location = cityData[0].location;
              });
            }
            
            setPredictions(backendPredictions);
            
            // Calculate tomorrow and weekly average AQI
            setTomorrowAQI(backendPredictions[0].aqi);
            const weeklySum = backendPredictions.reduce((sum, item) => sum + item.aqi, 0);
            setWeeklyAvgAQI(Math.round(weeklySum / backendPredictions.length));
          } else {
            setPredictions([]);
            setTomorrowAQI(0);
            setWeeklyAvgAQI(0);
          }
          setLoadingPredictions(false);
        })
        .catch(error => {
          console.error("Error getting predictions:", error);
          setPredictions([]);
          setTomorrowAQI(0);
          setWeeklyAvgAQI(0);
          setLoadingPredictions(false);
        });
    } else {
      // If backend is not enabled, clear predictions
      setPredictions([]);
      setTomorrowAQI(0);
      setWeeklyAvgAQI(0);
    }
  }, [rawData, selectedCity, selectedModel]);
  
  // Prepare chart data by combining historical and prediction data
  const chartData = React.useMemo(() => {
    if (rawData.length === 0 || !selectedCity || selectedCity === "Select City") return [];
    
    // Extract base city name for matching
    let baseCity = selectedCity;
    let selectedLocation = null;
    
    if (selectedCity.includes(',')) {
      const parts = selectedCity.split(',');
      selectedLocation = parts[0].trim();
      baseCity = parts[parts.length - 1].trim();
    }
    
    // Filter and sort historical data for the selected city
    const cityData = rawData
      .filter(item => {
        const itemCity = item.city;
        const itemLocation = item.location;
        const fullItemLocation = itemLocation ? `${itemLocation}, ${itemCity}` : itemCity;
        
        // Check if the item matches either the direct city name or the location-city combination
        return itemCity === selectedCity || 
               fullItemLocation === selectedCity ||
               (selectedCity.includes(itemCity) && (!selectedLocation || itemLocation === selectedLocation));
      })
      .sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        
        if (isNaN(dateA) && isNaN(dateB)) return 0;
        if (isNaN(dateA)) return -1;
        if (isNaN(dateB)) return 1;
        
        return dateA - dateB;
      });
    
    // Take only the last 14 days of historical data for the chart
    const recentData = cityData.slice(-14);
    
    // Mark each historical item
    const markedHistoricalData = recentData.map(item => ({
      ...item,
      predicted: false
    }));
    
    // Mark each prediction item
    const markedPredictions = predictions.map(item => ({
      ...item,
      predicted: true
    }));
    
    // Combine with predictions
    return [...markedHistoricalData, ...markedPredictions];
  }, [rawData, predictions, selectedCity]);
  
  // Get display location for the current AQI card
  const getAqiCardLocation = () => {
    if (!selectedCity || selectedCity === "Select City") {
      return "Select a city to view data";
    }
    
    // Handle AQICN specific format
    if (selectedApiPlatform === 'aqicn' && selectedCity.includes(',')) {
      const baseCity = extractBaseCity(selectedCity);
      if (baseCity && baseCity !== selectedCity) {
        return `Latest recorded value for ${baseCity}`;
      }
    }
    
    // Check if it's a location-specific format like "Sector 22, India"
    if (selectedCity.includes(',')) {
      return `Latest recorded value for ${selectedCity}`;
    }
    
    return `Latest recorded value for ${selectedCity}`;
  };
  
  // Check if data is loaded and city is selected
  const isDataReady = dataLoaded && selectedCity !== "Select City";
  
  return (
    <div className="flex flex-col min-h-screen-safe bg-background">
      <header className="border-b flex-shrink-0">
        <div className="container py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl sm:text-3xl font-bold">Air Quality Index (AQI) Prediction Dashboard</h1>
            <NavLinks />
          </div>
          <ThemeToggle />
        </div>
      </header>
      
      <main className="container py-6 flex-1-safe overflow-hidden">
        <Tabs value={selectedTab} onValueChange={handleTabChange} className="w-full h-full flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-3 mb-6 flex-shrink-0 h-12">
            <TabsTrigger value="dashboard" className="text-base">
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="data" className="text-base">
              <CloudSun className="h-5 w-5 mr-2" />
              Data Management
            </TabsTrigger>
            <TabsTrigger value="api" className="text-base">
              <Key className="h-5 w-5 mr-2" />
              API Access
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="dashboard" className="space-y-6 flex-1 content-area">
            {/* City selector with scroll area */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5 flex-shrink-0">
              <div className="h-[190px] md:h-auto">
                <CitySelector
                  cities={cities}
                  selectedCity={selectedCity}
                  onCityChange={handleCityChange}
                  selectedState={selectedState}
                  onStateChange={handleStateChange}
                  className="md:col-span-1 h-full"
                />
              </div>
              
              <div className="grid grid-cols-3 gap-5 md:col-span-3">
                <AQIInfoCard 
                  title="Current AQI"
                  value={currentAQI}
                  subtitle={getAqiCardLocation()}
                />
                <AQIInfoCard 
                  title="Tomorrow"
                  value={tomorrowAQI}
                  subtitle="Next day forecast"
                />
                <AQIInfoCard 
                  title="7-Day Average"
                  value={weeklyAvgAQI}
                  subtitle="Weekly prediction"
                />
              </div>
            </div>
            
            {/* Model Selector and Chart - Show all the time */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5 flex-1 min-h-0">
              <ModelSelector
                selectedModel={selectedModel}
                onModelChange={setSelectedModel}
                className="md:col-span-1 h-full"
              />
              
              {/* Increased height for the chart container */}
              <div className="md:col-span-3 h-[450px] md:h-[520px] chart-container">
                <AQIChart 
                  data={chartData}
                  className="h-full"
                />
              </div>
            </div>
            
            {/* Add instruction card when no data is loaded */}
            {!isDataReady && (
              <Card className="p-8 text-center flex-shrink-0">
                <CardContent>
                  <h3 className="text-xl font-medium mb-3">No Data Available</h3>
                  <p className="text-muted-foreground mb-4 text-base">
                    {selectedCity === "Select City" 
                      ? "Please select a city from the dropdown above." 
                      : "Please load data for the selected city from the Data Management tab."}
                  </p>
                </CardContent>
              </Card>
            )}
            
            {/* Weekly Prediction Table - Only show when predictions are available */}
            {predictions.length > 0 && (
              <WeeklyPredictionTable
                predictions={predictions}
              />
            )}
            
            {/* Pollutants Information - Only show when predictions with pollutants are available */}
            {predictions.length > 0 && predictions[0].pollutants && (
              <Collapsible
                open={isPollutantsOpen}
                onOpenChange={setIsPollutantsOpen}
                className="w-full flex-shrink-0"
              >
                <CollapsibleTrigger className="w-full">
                  <Card>
                    <CardHeader className="py-5">
                      <CardTitle className="text-lg">Pollutant Levels {isPollutantsOpen ? '▼' : '▶'}</CardTitle>
                    </CardHeader>
                  </Card>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <PollutantsDisplay 
                    pollutants={predictions[0].pollutants}
                  />
                </CollapsibleContent>
              </Collapsible>
            )}
          </TabsContent>
          
          <TabsContent value="data" className="space-y-8 flex-1 overflow-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-8">
                <ApiDataFetcher 
                  onDataLoaded={handleDataLoaded} 
                  selectedCity={selectedCity}
                  selectedPlatform={selectedApiPlatform}
                  disabled={selectedCity === "Select City"}
                  selectedState={selectedState}
                />
                <FileUpload onDataLoaded={handleDataLoaded} />
              </div>
              
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl">Data Information</CardTitle>
                  <CardDescription className="text-base">
                    Current data status and requirements
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="rounded-md bg-muted p-5">
                    <div className="space-y-3">
                      <p className="text-base">
                        <span className="font-medium">Selected API:</span> {selectedApiPlatform === 'airvisual' ? 'AirVisual' : 'AQICN'}
                      </p>
                      <p className="text-base">
                        <span className="font-medium">Selected State:</span> {selectedState}
                      </p>
                      <p className="text-base">
                        <span className="font-medium">Selected City:</span> {selectedCity}
                      </p>
                      <p className="text-base">
                        <span className="font-medium">Total Records:</span> {rawData.length}
                      </p>
                      <p className="text-base">
                        <span className="font-medium">Cities:</span>{' '}
                        <ScrollArea className="h-24">
                          <div className="space-y-1">
                            {cities.map(city => (
                              <div key={city}>{city}</div>
                            ))}
                          </div>
                        </ScrollArea>
                      </p>
                      <p className="text-base">
                        <span className="font-medium">Date Range:</span>{' '}
                        {rawData.length > 0 
                          ? `${new Date(rawData[0].date).toLocaleDateString()} to ${new Date(rawData[rawData.length-1].date).toLocaleDateString()}`
                          : 'No data available'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="rounded-md bg-muted p-5">
                    <h4 className="text-base font-medium mb-3">CSV Format Guide</h4>
                    <div className="text-sm text-muted-foreground">
                      <p>Upload any CSV format - the system will automatically detect:</p>
                      <ul className="list-disc list-inside mt-3 space-y-2">
                        <li>Date columns (various formats supported)</li>
                        <li>Location/City columns</li>
                        <li>AQI values</li>
                        <li>Pollutant measurements (PM2.5, PM10, etc.)</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="api" className="space-y-8 flex-1 overflow-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-8">
                <ApiPlatformSelector
                  selectedPlatform={selectedApiPlatform}
                  onPlatformChange={handleApiPlatformChange}
                  onResetLocationState={handleResetLocationState}
                />
                <ApiKeyManager 
                  selectedPlatform={selectedApiPlatform} 
                />
                <BackendSettingsManager />
              </div>
              
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Database className="h-6 w-6" />
                    API Documentation
                  </CardTitle>
                  <CardDescription className="text-base">
                    Information about using the {selectedApiPlatform === 'airvisual' ? 'AirVisual' : 'AQICN'} API
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  {selectedApiPlatform === 'airvisual' ? (
                    <div className="space-y-3">
                      <h3 className="text-base font-medium">Available Endpoints</h3>
                      
                      <div className="rounded-md bg-muted p-4">
                        <p className="text-sm font-medium">GET /v2/nearest_city</p>
                        <p className="text-sm text-muted-foreground mt-2">
                          Get nearest city air quality data
                        </p>
                      </div>
                      
                      <div className="rounded-md bg-muted p-4">
                        <p className="text-sm font-medium">GET /v2/city</p>
                        <p className="text-sm text-muted-foreground mt-2">
                          Get specific city air quality data
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <h3 className="text-base font-medium">Available Endpoints</h3>
                      
                      <div className="rounded-md bg-muted p-4">
                        <p className="text-sm font-medium">GET /feed/{'{city}'}</p>
                        <p className="text-sm text-muted-foreground mt-2">
                          Get air quality data for a specific city
                        </p>
                      </div>
                      
                      <div className="rounded-md bg-muted p-4">
                        <p className="text-sm font-medium">GET /feed/geo:{'{lat}'};{'{lng}'}</p>
                        <p className="text-sm text-muted-foreground mt-2">
                          Get air quality data for specific coordinates
                        </p>
                      </div>
                    </div>
                  )}
                  
                  <div className="space-y-3">
                    <h3 className="text-base font-medium">Authentication</h3>
                    <p className="text-sm text-muted-foreground">
                      Include your API key as a {selectedApiPlatform === 'airvisual' ? 'key' : 'token'} parameter:
                    </p>
                    <div className="bg-muted rounded-md p-3">
                      <code className="text-sm">
                        ?{selectedApiPlatform === 'airvisual' ? 'key' : 'token'}=your_api_key_here
                      </code>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <h3 className="text-base font-medium">Rate Limits</h3>
                    <p className="text-sm text-muted-foreground">
                      {selectedApiPlatform === 'airvisual' ? (
                        <>Free tier: 10,000 calls per month (~300 per day)</>
                      ) : (
                        <>Free tier: 1,000 calls per day</>
                      )}
                      <br />
                      Premium tiers available for higher limits
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
      
      <footer className="border-t mt-auto flex-shrink-0">
        <div className="container py-4 flex justify-between items-center">
          <p className="text-sm sm:text-base text-muted-foreground">
            Air Quality Index (AQI) Prediction Dashboard
          </p>
          <p className="text-sm sm:text-base text-muted-foreground">
            Powered by {selectedApiPlatform === 'airvisual' ? 'AirVisual' : 'AQICN'} API
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
