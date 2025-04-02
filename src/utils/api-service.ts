
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
  // Fetch AQI data for a specific city
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
      // Default to city data endpoint if city is specified
      let endpoint = `${AIR_VISUAL_API_BASE_URL}/city`;
      
      let params = new URLSearchParams({
        key: apiKey
      });
      
      // If city is specified and not "Select City"
      if (city && city !== "Select City") {
        // For Indian cities, we use a direct city lookup
        // Add default parameters for Indian cities
        params.append('country', country || 'India');
        
        // Add state parameter if available, otherwise use common states for major cities
        if (state) {
          params.append('state', state);
        } else {
          // Map of cities to their states for common Indian cities
          const cityToState: Record<string, string> = {
            'Delhi': 'Delhi',
            'New Delhi': 'Delhi',
            'Mumbai': 'Maharashtra',
            'Kolkata': 'West Bengal',
            'Chennai': 'Tamil Nadu',
            'Bangalore': 'Karnataka',
            'Hyderabad': 'Telangana',
            'Ahmedabad': 'Gujarat',
            'Pune': 'Maharashtra',
            'Jaipur': 'Rajasthan',
            'Lucknow': 'Uttar Pradesh',
            'Kanpur': 'Uttar Pradesh',
            'Nagpur': 'Maharashtra',
            'Indore': 'Madhya Pradesh',
            'Thane': 'Maharashtra',
            'Bhopal': 'Madhya Pradesh',
            'Visakhapatnam': 'Andhra Pradesh',
            'Patna': 'Bihar',
            'Vadodara': 'Gujarat',
            'Ghaziabad': 'Uttar Pradesh',
            'Ludhiana': 'Punjab',
            'Agra': 'Uttar Pradesh',
            'Nashik': 'Maharashtra',
            'Faridabad': 'Haryana',
            'Meerut': 'Uttar Pradesh',
            'Rajkot': 'Gujarat',
            'Varanasi': 'Uttar Pradesh',
            'Srinagar': 'Jammu and Kashmir',
            'Aurangabad': 'Maharashtra',
            'Dhanbad': 'Jharkhand',
            'Amritsar': 'Punjab',
            'Allahabad': 'Uttar Pradesh',
            'Ranchi': 'Jharkhand',
            'Howrah': 'West Bengal',
            'Coimbatore': 'Tamil Nadu',
            'Jabalpur': 'Madhya Pradesh',
            'Gwalior': 'Madhya Pradesh',
            'Vijayawada': 'Andhra Pradesh',
            'Jodhpur': 'Rajasthan',
            'Madurai': 'Tamil Nadu',
            'Raipur': 'Chhattisgarh',
            'Kota': 'Rajasthan',
            'Chandigarh': 'Chandigarh',
            'Guwahati': 'Assam',
            'Solapur': 'Maharashtra',
            'Hubli–Dharwad': 'Karnataka',
            'Mysore': 'Karnataka',
            'Tiruchirappalli': 'Tamil Nadu',
            'Bareilly': 'Uttar Pradesh',
            'Aligarh': 'Uttar Pradesh',
            'Tiruppur': 'Tamil Nadu',
            'Gurugram': 'Haryana',
            'Moradabad': 'Uttar Pradesh',
            'Jalandhar': 'Punjab',
            'Bhubaneswar': 'Odisha',
            'Salem': 'Tamil Nadu',
            'Warangal': 'Telangana',
            'Mira-Bhayandar': 'Maharashtra',
            'Jalgaon': 'Maharashtra',
            'Guntur': 'Andhra Pradesh',
            'Bhiwandi': 'Maharashtra',
            'Saharanpur': 'Uttar Pradesh',
            'Gorakhpur': 'Uttar Pradesh',
            'Bikaner': 'Rajasthan',
            'Amravati': 'Maharashtra',
            'Noida': 'Uttar Pradesh',
            'Jamshedpur': 'Jharkhand',
            'Bhilai': 'Chhattisgarh',
            'Cuttack': 'Odisha',
            'Firozabad': 'Uttar Pradesh',
            'Kochi': 'Kerala',
            'Nellore': 'Andhra Pradesh',
            'Bhavnagar': 'Gujarat',
            'Dehradun': 'Uttarakhand',
            'Durgapur': 'West Bengal',
            'Asansol': 'West Bengal',
            'Rourkela': 'Odisha',
            'Nanded': 'Maharashtra',
            'Kolhapur': 'Maharashtra',
            'Ajmer': 'Rajasthan',
            'Akola': 'Maharashtra',
            'Gulbarga': 'Karnataka',
            'Jamnagar': 'Gujarat',
            'Ujjain': 'Madhya Pradesh',
            'Loni': 'Uttar Pradesh',
            'Siliguri': 'West Bengal',
            'Jhansi': 'Uttar Pradesh',
            'Ulhasnagar': 'Maharashtra',
            'Jammu': 'Jammu and Kashmir',
            'Sangli-Miraj & Kupwad': 'Maharashtra',
            'Mangalore': 'Karnataka'
          };
          
          // Use the mapped state for the city, or default to a common state
          const mappedState = cityToState[city] || 'Delhi';
          params.append('state', mappedState);
        }
        
        // Add city parameter
        params.append('city', city);
      } else {
        // If no city specified, use nearest city endpoint
        endpoint = `${AIR_VISUAL_API_BASE_URL}/nearest_city`;
      }
      
      console.log(`Fetching from ${endpoint}?${params.toString()}`);
      const response = await fetch(`${endpoint}?${params.toString()}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`API Error: ${errorData.data?.message || response.status}`);
      }
      
      const responseData = await response.json();
      console.log("API Response:", responseData); // Log for debugging
      
      // Process the data from AirVisual format to our format
      if ((endpoint.includes('nearest_city') || endpoint.includes('city')) && responseData.status === "success") {
        // No city selected, return empty array
        if (!city || city === "Select City") {
          return [];
        }
        
        // Single city response - use the actual data returned by the API
        const cityData = responseData.data;
        const currentDate = new Date().toISOString().split('T')[0];
        
        // Create data points for today and historical (simulated)
        const dataPoints: AQIDataPoint[] = [];
        
        // Use the city name from the API response
        const cityName = cityData.city || city;
        
        // Add current data point with actual AQI from the API
        dataPoints.push({
          date: currentDate,
          city: cityName,
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
            city: cityName,
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
