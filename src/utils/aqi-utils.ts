
import { AQIDataPoint } from './api-service';

// Generate sample AQI data for demonstration
export const generateSampleData = (cityName: string = "Delhi"): AQIDataPoint[] => {
  const data: AQIDataPoint[] = [];
  const today = new Date();
  
  // Base AQI ranges for different cities (simulating different air quality patterns)
  const cityBaseAQI: Record<string, number> = {
    'Delhi': 180,
    'Mumbai': 120,
    'Bangalore': 90,
    'Chennai': 100,
    'Kolkata': 150,
    'Hyderabad': 110,
    'Pune': 105,
    'Ahmedabad': 130,
    'Jaipur': 140,
    'Lucknow': 160,
    'Ghaziabad': 210,
    'Faridabad': 170,
    'Noida': 190,
    'Gurugram': 175,
    'Kanpur': 165,
    'Patna': 155,
    'Agra': 145,
    'Varanasi': 150
  };
  
  // Use the city's base AQI or default to Delhi's range if not found
  const baseAQI = cityBaseAQI[cityName] || 150;
  
  // Generate 30 days of historical data
  for (let i = 30; i >= 1; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    // Create a realistic pattern with some randomness
    // Simulate weekly patterns, seasonal trends, etc.
    const dayOfWeek = date.getDay(); // 0-6
    const weekendEffect = (dayOfWeek === 0 || dayOfWeek === 6) ? -15 : 0; // Better air on weekends
    const timeVariation = Math.sin(i / 7 * Math.PI) * 30; // Creates a wave pattern
    const randomEffect = Math.random() * 40 - 20; // Random noise
    
    let aqi = Math.round(baseAQI + weekendEffect + timeVariation + randomEffect);
    // Ensure AQI is within reasonable range (0-500)
    aqi = Math.max(50, Math.min(400, aqi));
    
    data.push({
      date: date.toISOString().split('T')[0],
      city: cityName,
      aqi,
      pollutants: {
        pm25: Math.round(aqi * 0.8), // PM2.5 typically makes up a large portion of AQI
        pm10: Math.round(aqi * 0.5 + Math.random() * 20),
        no2: Math.round(20 + Math.random() * 30),
        o3: Math.round(15 + Math.random() * 40),
        co: Math.round(500 + Math.random() * 500),
        so2: Math.round(5 + Math.random() * 15),
        nh3: Math.round(2 + Math.random() * 8)
      }
    });
  }
  
  // Sort by date
  return data.sort((a, b) => a.date.localeCompare(b.date));
};
