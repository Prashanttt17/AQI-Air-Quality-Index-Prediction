import React, { useState, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { toast } from '@/components/ui/use-toast';
import { Gauge, CloudSun, Database, Key } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

import AQIInfoCard from '@/components/AQIInfoCard';
import AQIChart from '@/components/AQIChart';
import FileUpload from '@/components/FileUpload';
import ApiDataFetcher from '@/components/ApiDataFetcher';
import ApiKeyManager from '@/components/ApiKeyManager';
import ModelSelector from '@/components/ModelSelector';
import PollutantsDisplay from '@/components/PollutantsDisplay';
import CitySelector from '@/components/CitySelector';
import WeeklyPredictionTable from '@/components/WeeklyPredictionTable';
import { ThemeToggle } from '@/components/theme-toggle';

import { generateSampleData } from '@/utils/aqi-utils';
import { generateEnhancedPredictions } from '@/utils/enhanced-predictive-models';
import { AQIDataPoint, getApiKey, AQIDataService } from '@/utils/api-service';

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
  
  // Current, tomorrow, and weekly average AQI values
  const [currentAQI, setCurrentAQI] = useState<number>(0);
  const [tomorrowAQI, setTomorrowAQI] = useState<number>(0);
  const [weeklyAvgAQI, setWeeklyAvgAQI] = useState<number>(0);
  
  // Check for API key and show notification if missing
  useEffect(() => {
    const apiKey = getApiKey();
    if (!apiKey) {
      toast({
        title: "API Key Missing",
        description: "Set your AirVisual API key in the API Access tab to fetch real data.",
      });
    }
  }, []);
  
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
      // Automatically fetch data for the selected city
      try {
        const apiKey = getApiKey();
        if (apiKey) {
          const data = await AQIDataService.fetchAQIData(city);
          if (data && data.length > 0) {
            handleDataLoaded(data);
          }
        }
      } catch (error) {
        console.error("Error fetching data for city:", error);
      }
    }
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
    
    setRawData(validData);
    setDataLoaded(true);
    
    // Extract unique cities
    const uniqueCities = [...new Set(validData.map(item => item.city))];
    setCities(uniqueCities);
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
    
    // Filter data for selected city
    const cityData = rawData.filter(item => item.city === selectedCity);
    
    if (cityData.length === 0) {
      setPredictions([]);
      setCurrentAQI(0);
      setTomorrowAQI(0);
      setWeeklyAvgAQI(0);
      return;
    }
    
    // Sort data by date
    cityData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // Generate predictions using the enhanced selected model
    const newPredictions = generateEnhancedPredictions(cityData, selectedModel);
    setPredictions(newPredictions);
    
    // Calculate current, tomorrow, and weekly average AQI
    if (cityData.length > 0) {
      setCurrentAQI(cityData[cityData.length - 1].aqi);
      if (newPredictions.length > 0) {
        setTomorrowAQI(newPredictions[0].aqi);
        const weeklySum = newPredictions.reduce((sum, item) => sum + item.aqi, 0);
        setWeeklyAvgAQI(Math.round(weeklySum / newPredictions.length));
      }
    }
  }, [rawData, selectedCity, selectedModel]);
  
  // Prepare chart data by combining historical and prediction data
  const chartData = React.useMemo(() => {
    if (rawData.length === 0 || !selectedCity || selectedCity === "Select City") return [];
    
    // Filter and sort historical data for the selected city
    const cityData = rawData
      .filter(item => item.city === selectedCity)
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
    
    // Combine with predictions
    return [...recentData, ...predictions];
  }, [rawData, predictions, selectedCity]);
  
  // Check if data is loaded and city is selected
  const isDataReady = dataLoaded && selectedCity !== "Select City";
  
  return (
    <div className="flex flex-col min-h-screen-safe bg-background">
      <header className="border-b flex-shrink-0">
        <div className="container py-3 flex justify-between items-center">
          <h1 className="text-xl sm:text-2xl font-bold">Air Quality Index (AQI) Prediction Dashboard</h1>
          <ThemeToggle />
        </div>
      </header>
      
      <main className="container py-4 flex-1-safe overflow-hidden">
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full h-full flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-3 mb-4 flex-shrink-0">
            <TabsTrigger value="dashboard">
              <Gauge className="h-4 w-4 mr-2" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="data">
              <CloudSun className="h-4 w-4 mr-2" />
              Data Management
            </TabsTrigger>
            <TabsTrigger value="api">
              <Key className="h-4 w-4 mr-2" />
              API Access
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="dashboard" className="space-y-4 flex-1 content-area">
            {/* City selector with scroll area */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 flex-shrink-0">
              <div className="h-[180px] md:h-auto">
                <CitySelector
                  cities={cities}
                  selectedCity={selectedCity}
                  onCityChange={handleCityChange}
                  className="md:col-span-1 h-full"
                />
              </div>
              
              <div className="grid grid-cols-3 gap-3 md:col-span-3">
                <AQIInfoCard 
                  title="Current AQI"
                  value={currentAQI}
                  subtitle={selectedCity !== "Select City" ? `Latest recorded value for ${selectedCity}` : "Select a city to view data"}
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 flex-1 min-h-0">
              <ModelSelector
                selectedModel={selectedModel}
                onModelChange={setSelectedModel}
                className="md:col-span-1 h-full"
              />
              
              {/* Increased height for the chart container */}
              <div className="md:col-span-3 h-[400px] md:h-[450px] chart-container">
                <AQIChart 
                  data={chartData}
                  className="h-full"
                />
              </div>
            </div>
            
            {/* Add instruction card when no data is loaded */}
            {!isDataReady && (
              <Card className="p-6 text-center flex-shrink-0">
                <CardContent>
                  <h3 className="text-lg font-medium mb-2">No Data Available</h3>
                  <p className="text-muted-foreground mb-3">
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
                    <CardHeader>
                      <CardTitle>Pollutant Levels {isPollutantsOpen ? '▼' : '▶'}</CardTitle>
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
          
          <TabsContent value="data" className="space-y-6 flex-1 overflow-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-6">
                <ApiDataFetcher 
                  onDataLoaded={handleDataLoaded} 
                  selectedCity={selectedCity}
                  disabled={selectedCity === "Select City"}
                />
                <FileUpload onDataLoaded={handleDataLoaded} />
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle>Data Information</CardTitle>
                  <CardDescription>
                    Current data status and requirements
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-md bg-muted p-4">
                    <div className="space-y-2">
                      <p className="text-sm">
                        <span className="font-medium">Selected City:</span> {selectedCity}
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">Total Records:</span> {rawData.length}
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">Cities:</span>{' '}
                        <ScrollArea className="h-20">
                          {cities.join(', ')}
                        </ScrollArea>
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">Date Range:</span>{' '}
                        {rawData.length > 0 
                          ? `${new Date(rawData[0].date).toLocaleDateString()} to ${new Date(rawData[rawData.length-1].date).toLocaleDateString()}`
                          : 'No data available'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="rounded-md bg-muted p-4">
                    <h4 className="text-sm font-medium mb-2">CSV Format Guide</h4>
                    <p className="text-xs text-muted-foreground">
                      Upload any CSV format - the system will automatically detect:
                      <ul className="list-disc list-inside mt-2 space-y-1">
                        <li>Date columns (various formats supported)</li>
                        <li>Location/City columns</li>
                        <li>AQI values</li>
                        <li>Pollutant measurements (PM2.5, PM10, etc.)</li>
                      </ul>
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="api" className="space-y-6 flex-1 overflow-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ApiKeyManager />
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    API Documentation
                  </CardTitle>
                  <CardDescription>
                    Information about using the AirVisual API
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Available Endpoints</h3>
                    
                    <div className="rounded-md bg-muted p-3">
                      <p className="text-xs font-medium">GET /v2/nearest_city</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Get nearest city air quality data
                      </p>
                    </div>
                    
                    <div className="rounded-md bg-muted p-3">
                      <p className="text-xs font-medium">GET /v2/city</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Get specific city air quality data
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Authentication</h3>
                    <p className="text-xs text-muted-foreground">
                      Include your API key as a query parameter:
                    </p>
                    <div className="bg-muted rounded-md p-2">
                      <code className="text-xs">
                        ?key=your_api_key_here
                      </code>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Rate Limits</h3>
                    <p className="text-xs text-muted-foreground">
                      Free tier: 10,000 calls per month (~300 per day)<br />
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
        <div className="container py-3 flex justify-between items-center">
          <p className="text-xs sm:text-sm text-muted-foreground">
            Air Quality Index (AQI) Prediction Dashboard
          </p>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Powered by AirVisual API
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
