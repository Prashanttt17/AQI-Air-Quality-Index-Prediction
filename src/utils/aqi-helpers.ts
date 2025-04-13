
// Helper function to determine color based on AQI value
export const getAQIColor = (aqi: number): string => {
  if (aqi <= 50) return "text-green-600 dark:text-green-400";
  if (aqi <= 100) return "text-yellow-600 dark:text-yellow-400";
  if (aqi <= 150) return "text-orange-600 dark:text-orange-400";
  if (aqi <= 200) return "text-red-600 dark:text-red-400";
  if (aqi <= 300) return "text-purple-600 dark:text-purple-400";
  return "text-rose-800 dark:text-rose-500";
};

// Helper function to determine AQI category
export const getAQICategory = (aqi: number): string => {
  if (aqi <= 50) return "Good";
  if (aqi <= 100) return "Moderate";
  if (aqi <= 150) return "Unhealthy for Sensitive Groups";
  if (aqi <= 200) return "Unhealthy";
  if (aqi <= 300) return "Very Unhealthy";
  return "Hazardous";
};

// Helper to get pollutant health impact
export const getPollutantHealth = (pollutant: string): string => {
  switch (pollutant) {
    case 'PM2.5':
      return "Fine particles that can penetrate deep into lungs and bloodstream. Can cause respiratory and cardiovascular issues.";
    case 'PM10':
      return "Inhalable particles that can affect respiratory system. Can cause coughing, wheezing, and asthma attacks.";
    case 'O₃':
      return "Ground-level ozone can trigger respiratory problems, reduce lung function and worsen asthma.";
    case 'NO₂':
      return "Can irritate airways and increase susceptibility to respiratory infections.";
    case 'SO₂':
      return "Affects respiratory system and can cause difficulty breathing.";
    case 'CO':
      return "Reduces blood's ability to transport oxygen. Can cause headaches, dizziness.";
    case 'NH₃':
      return "Can irritate eyes, nose, throat, and respiratory tract.";
    default:
      return "May affect respiratory health at elevated levels.";
  }
};
