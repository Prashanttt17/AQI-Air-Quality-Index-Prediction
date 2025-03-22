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
import { AQIDataPoint, getApiKey } from '@/utils/api-service';

const Index = () => {
  // State for data management
  const [rawData, setRawData] = useState<AQIDataPoint[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('ARIMA');
  const [predictions, setPredictions] = useState<AQIDataPoint[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [selectedTab, setSelectedTab] = useState<string>('dashboard');
  const [isPollutantsOpen, setIsPollutantsOpen] = useState<boolean>(false);
  
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
  
  // Load sample data on initial render
  useEffect(() => {
    const sampleData = generateSampleData();
    handleDataLoaded(sampleData);
    
    toast({
      title: "Sample Data Loaded",
      description: "Using sample AQI data. Use the Data tab to load real data.",
    });
  }, []);
  
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
    
    // Extract unique cities
    const uniqueCities = [...new Set(validData.map(item => item.city))];
    setCities(uniqueCities);
    
    // Set first city as selected by default
    if (uniqueCities.length > 0) {
      setSelectedCity(uniqueCities[0]);
    }
  };
  
  // Update predictions when model, city, or data changes
  useEffect(() => {
    if (rawData.length === 0 || !selectedCity) return;
    
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
    if (rawData.length === 0 || !selectedCity) return [];
    
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
  
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Air Quality Index (AQI) Prediction Dashboard</h1>
          <ThemeToggle />
        </div>
      </header>
      
      <main className="container py-6">
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
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
          
          <TabsContent value="dashboard" className="space-y-6">
            {/* City selector with scroll area */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <ScrollArea className="h-[200px] md:h-auto">
                <CitySelector
                  cities={cities}
                  selectedCity={selectedCity}
                  onCityChange={setSelectedCity}
                  className="md:col-span-1"
                />
              </ScrollArea>
              
              <div className="grid grid-cols-3 gap-4 md:col-span-3">
                <AQIInfoCard 
                  title="Current AQI"
                  value={currentAQI}
                  subtitle="Latest recorded value"
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
            
            {/* AQI Chart and Model Selector */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <ModelSelector
                selectedModel={selectedModel}
                onModelChange={setSelectedModel}
                className="md:col-span-1"
              />
              
              <AQIChart 
                data={chartData}
                className="md:col-span-3"
              />
            </div>
            
            {/* Weekly Prediction Table */}
            {predictions.length > 0 && (
              <WeeklyPredictionTable
                predictions={predictions}
              />
            )}
            
            {/* Pollutants Information */}
            {predictions.length > 0 && predictions[0].pollutants && (
              <Collapsible
                open={isPollutantsOpen}
                onOpenChange={setIsPollutantsOpen}
                className="w-full"
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
          
          <TabsContent value="data" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-6">
                <ApiDataFetcher onDataLoaded={handleDataLoaded} />
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
          
          <TabsContent value="api" className="space-y-6">
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
      
      <footer className="border-t mt-8">
        <div className="container py-4 flex justify-between items-center">
          <p className="text-sm text-muted-foreground">
            Air Quality Index (AQI) Prediction Dashboard
          </p>
          <p className="text-sm text-muted-foreground">
            Powered by AirVisual API
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
