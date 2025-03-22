
// AQI severity levels and colors
export const AQI_LEVELS = [
  { level: "Good", range: [0, 50], color: "bg-green-500", textColor: "text-green-500" },
  { level: "Moderate", range: [51, 100], color: "bg-yellow-400", textColor: "text-yellow-500" },
  { level: "Unhealthy for Sensitive Groups", range: [101, 150], color: "bg-orange-400", textColor: "text-orange-500" },
  { level: "Unhealthy", range: [151, 200], color: "bg-red-500", textColor: "text-red-500" },
  { level: "Very Unhealthy", range: [201, 300], color: "bg-purple-600", textColor: "text-purple-600" },
  { level: "Hazardous", range: [301, 500], color: "bg-rose-900", textColor: "text-rose-900" },
];

// Get AQI level based on AQI value
export const getAQILevel = (aqi: number) => {
  const level = AQI_LEVELS.find(
    (level) => aqi >= level.range[0] && aqi <= level.range[1]
  );
  return level || AQI_LEVELS[AQI_LEVELS.length - 1]; // Default to hazardous if above range
};

// Generate sample data for demonstration
export const generateSampleData = () => {
  const cities = ["Jaipur", "Los Angeles", "Chicago", "Houston", "Phoenix"];
  const today = new Date();
  const data = [];

  for (let city of cities) {
    // Past 30 days of data
    for (let i = 30; i >= 1; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      // Base AQI with some randomness
      const baseAQI = city === "Los Angeles" ? 85 : 
                      city === "Phoenix" ? 110 :
                      city === "Chicago" ? 60 :
                      city === "Houston" ? 75 : 45;
      
      // Add some seasonal variation
      const seasonalFactor = Math.sin((date.getMonth() + 1) / 12 * Math.PI) * 15;
      
      // Random daily variation
      const dailyVariation = Math.round(Math.random() * 20 - 10);
      
      // Calculate AQI
      const aqi = Math.max(0, Math.min(500, Math.round(baseAQI + seasonalFactor + dailyVariation)));
      
      // Generate pollutant data with some correlation to AQI
      const factor = aqi / 100;
      
      data.push({
        date: date.toISOString().split('T')[0],
        city: city,
        aqi: aqi,
        pollutants: {
          pm25: Math.round((10 + Math.random() * 30) * factor),
          pm10: Math.round((20 + Math.random() * 50) * factor),
          no2: Math.round((20 + Math.random() * 40) * factor),
          o3: Math.round((30 + Math.random() * 35) * factor),
          co: Math.round((500 + Math.random() * 1000) * factor) / 100,
          so2: Math.round((5 + Math.random() * 15) * factor),
          nh3: Math.round((10 + Math.random() * 20) * factor)
        }
      });
    }
  }
  
  return data;
};
