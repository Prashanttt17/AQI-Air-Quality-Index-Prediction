import { toast } from "@/components/ui/use-toast";

// Define data types
export interface PollutantData {
  pm25: number;
  pm10: number;
  no2: number;
  o3: number;
  co: number;
  so2: number;
  nh3: number;
}

export interface AQIDataPoint {
  id?: string;
  date: string;
  city: string;
  aqi: number;
  pollutants?: PollutantData;
  predicted?: boolean;
}

// API base URL for AirVisual API
const AIR_VISUAL_API_BASE_URL = "https://api.airvisual.com/v2";

export const getApiUrl = (): string => {
  return AIR_VISUAL_API_BASE_URL;
};

// Save API key to localStorage
export const saveApiKey = (apiKey: string): void => {
  localStorage.setItem('aqi_api_key', apiKey);
};

// Get API key from localStorage
export const getApiKey = (): string | null => {
  return localStorage.getItem('aqi_api_key');
};

export const AQIDataService = {
  // Fetch AQI data for a specific city or nearest city
  async fetchAQIData(city?: string, state?: string, country?: string): Promise<AQIDataPoint[]> {
    const apiKey = getApiKey();
    
    if (!apiKey) {
      toast({
        title: "API Key Missing",
        description: "Please set your AirVisual API key in the API Access tab",
        variant: "destructive"
      });
      throw new Error("API key is required");
    }
    
    try {
      let endpoint = `${AIR_VISUAL_API_BASE_URL}/cities`;
      let params = new URLSearchParams({
        key: apiKey
      });
      
      // If city is specified, get data for that city
      if (city && country) {
        endpoint = `${AIR_VISUAL_API_BASE_URL}/city`;
        params.append('city', city);
        if (state) params.append('state', state);
        params.append('country', country);
      } else {
        // Otherwise get nearest city data
        endpoint = `${AIR_VISUAL_API_BASE_URL}/nearest_city`;
      }
      
      const response = await fetch(`${endpoint}?${params.toString()}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`API Error: ${errorData.data.message || response.status}`);
      }
      
      const responseData = await response.json();
      
      // Process the data from AirVisual format to our format
      if (endpoint.includes('nearest_city') || endpoint.includes('city')) {
        // Single city response
        const cityData = responseData.data;
        const currentDate = new Date().toISOString().split('T')[0];
        
        // Create data points for today and historical (simulated)
        const dataPoints: AQIDataPoint[] = [];
        
        // Add current data point
        dataPoints.push({
          date: currentDate,
          city: cityData.city || 'Unknown',
          aqi: cityData.current.pollution.aqius,
          pollutants: {
            pm25: cityData.current.pollution.pm25 || 0,
            pm10: cityData.current.pollution.pm10 || 0,
            no2: 0, // AirVisual free API doesn't provide these values
            o3: 0,
            co: 0,
            so2: 0,
            nh3: 0
          }
        });
        
        // Simulate some historical data (last 14 days)
        for (let i = 1; i <= 14; i++) {
          const pastDate = new Date();
          pastDate.setDate(pastDate.getDate() - i);
          
          // Create a somewhat realistic variation based on current AQI
          const baseAqi = cityData.current.pollution.aqius;
          const variation = Math.floor(Math.random() * 20) - 10; // -10 to +10
          const historicalAqi = Math.max(0, baseAqi + variation);
          
          dataPoints.push({
            date: pastDate.toISOString().split('T')[0],
            city: cityData.city || 'Unknown',
            aqi: historicalAqi,
            pollutants: {
              pm25: Math.max(0, (cityData.current.pollution.pm25 || 10) + Math.floor(Math.random() * 10) - 5),
              pm10: Math.max(0, (cityData.current.pollution.pm10 || 20) + Math.floor(Math.random() * 15) - 7),
              no2: 0,
              o3: 0,
              co: 0,
              so2: 0,
              nh3: 0
            }
          });
        }
        
        // Sort by date
        dataPoints.sort((a, b) => a.date.localeCompare(b.date));
        
        return dataPoints;
      } else {
        // Cities list response - convert to our format
        const cities = responseData.data;
        return cities.map((city: any) => ({
          date: new Date().toISOString().split('T')[0],
          city: city.city,
          aqi: 0, // We don't have AQI data in the cities list
          pollutants: {
            pm25: 0,
            pm10: 0,
            no2: 0,
            o3: 0,
            co: 0,
            so2: 0,
            nh3: 0
          }
        }));
      }
    } catch (error) {
      console.error("Error fetching AQI data:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch AQI data",
        variant: "destructive"
      });
      throw error;
    }
  },
  
  // List available countries
  async getCountries(): Promise<string[]> {
    const apiKey = getApiKey();
    
    if (!apiKey) {
      toast({
        title: "API Key Missing",
        description: "Please set your AirVisual API key in the API Access tab",
        variant: "destructive"
      });
      return [];
    }
    
    try {
      const response = await fetch(`${AIR_VISUAL_API_BASE_URL}/countries?key=${apiKey}`);
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }
      
      const data = await response.json();
      return data.data.map((country: any) => country.country);
    } catch (error) {
      console.error("Error fetching countries:", error);
      return [];
    }
  },
  
  // List states in a country
  async getStates(country: string): Promise<string[]> {
    const apiKey = getApiKey();
    
    if (!apiKey) {
      return [];
    }
    
    try {
      const response = await fetch(
        `${AIR_VISUAL_API_BASE_URL}/states?country=${encodeURIComponent(country)}&key=${apiKey}`
      );
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }
      
      const data = await response.json();
      return data.data.map((state: any) => state.state);
    } catch (error) {
      console.error("Error fetching states:", error);
      return [];
    }
  },
  
  // List cities in a state and country
  async getCities(state: string, country: string): Promise<string[]> {
    const apiKey = getApiKey();
    
    if (!apiKey) {
      return [];
    }
    
    try {
      const response = await fetch(
        `${AIR_VISUAL_API_BASE_URL}/cities?state=${encodeURIComponent(state)}&country=${encodeURIComponent(country)}&key=${apiKey}`
      );
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }
      
      const data = await response.json();
      return data.data.map((city: any) => city.city);
    } catch (error) {
      console.error("Error fetching cities:", error);
      return [];
    }
  }
};

// Function to create API key for testing purposes
export const generateApiKey = (): string => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const keyLength = 32;
  let result = '';
  
  for (let i = 0; i < keyLength; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  
  return result;
};
