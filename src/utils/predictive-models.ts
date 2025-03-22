
// Simple ARIMA-like prediction model (simplified for frontend demonstration)
export const predictARIMA = (historicalData: any[], daysToPredict: number = 7) => {
  // Extract AQI values
  const aqiValues = historicalData.map(item => item.aqi);
  
  // Calculate basic statistics for our simplified model
  const mean = aqiValues.reduce((sum, val) => sum + val, 0) / aqiValues.length;
  const recentTrend = aqiValues.slice(-5).reduce((sum, val, i, arr) => {
    return i > 0 ? sum + (val - arr[i-1]) : 0;
  }, 0) / 4;
  
  // Calculate variance for random component
  const variance = aqiValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / aqiValues.length;
  const stdDev = Math.sqrt(variance);
  
  // Generate predictions
  const predictions = [];
  const lastDate = new Date(historicalData[historicalData.length - 1].date);
  const lastAQI = aqiValues[aqiValues.length - 1];
  
  let predictedAQI = lastAQI;
  
  for (let i = 1; i <= daysToPredict; i++) {
    // Apply simple AR(1) model with trend
    predictedAQI = predictedAQI * 0.7 + mean * 0.3 + recentTrend * 0.5;
    
    // Add small random component
    const randomComponent = (Math.random() - 0.5) * stdDev * 0.5;
    predictedAQI = Math.max(0, Math.min(500, Math.round(predictedAQI + randomComponent)));
    
    // Generate next date
    const nextDate = new Date(lastDate);
    nextDate.setDate(nextDate.getDate() + i);
    
    predictions.push({
      date: nextDate.toISOString().split('T')[0],
      aqi: predictedAQI,
      predicted: true
    });
  }
  
  return predictions;
};

// SARIMAX-like prediction model with seasonal components (simplified for frontend)
export const predictSARIMAX = (historicalData: any[], daysToPredict: number = 7) => {
  // Extract AQI values
  const aqiValues = historicalData.map(item => item.aqi);
  
  // Calculate basic statistics
  const mean = aqiValues.reduce((sum, val) => sum + val, 0) / aqiValues.length;
  
  // Calculate recent trend (last 5 days)
  const recentTrend = aqiValues.slice(-5).reduce((sum, val, i, arr) => {
    return i > 0 ? sum + (val - arr[i-1]) : 0;
  }, 0) / 4;
  
  // Estimate seasonal component (using last 7 days pattern)
  const seasonalPattern = [];
  for (let i = 0; i < 7; i++) {
    const dayValues = aqiValues.filter((_, index) => 
      (aqiValues.length - 1 - index) % 7 === i && index < aqiValues.length - 7);
    
    if (dayValues.length > 0) {
      const dayMean = dayValues.reduce((sum, val) => sum + val, 0) / dayValues.length;
      seasonalPattern.push(dayMean - mean);
    } else {
      seasonalPattern.push(0);
    }
  }
  
  // Calculate variance for random component
  const variance = aqiValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / aqiValues.length;
  const stdDev = Math.sqrt(variance);
  
  // Generate predictions
  const predictions = [];
  const lastDate = new Date(historicalData[historicalData.length - 1].date);
  const lastAQI = aqiValues[aqiValues.length - 1];
  
  let predictedAQI = lastAQI;
  
  for (let i = 1; i <= daysToPredict; i++) {
    // Apply AR(1) component
    const arComponent = predictedAQI * 0.6 + mean * 0.4;
    
    // Add trend component
    const trendComponent = recentTrend * 0.7;
    
    // Add seasonal component
    const dayOfWeekIndex = (new Date(lastDate).getDay() + i) % 7;
    const seasonalComponent = seasonalPattern[dayOfWeekIndex] * 0.8;
    
    // Combine components
    predictedAQI = arComponent + trendComponent + seasonalComponent;
    
    // Add small random component
    const randomComponent = (Math.random() - 0.5) * stdDev * 0.4;
    predictedAQI = Math.max(0, Math.min(500, Math.round(predictedAQI + randomComponent)));
    
    // Generate next date
    const nextDate = new Date(lastDate);
    nextDate.setDate(nextDate.getDate() + i);
    
    predictions.push({
      date: nextDate.toISOString().split('T')[0],
      aqi: predictedAQI,
      predicted: true
    });
  }
  
  return predictions;
};

// Generate full predictions with pollutants
export const generatePredictions = (historicalData: any[], model: string, daysToPredict: number = 7) => {
  // Get basic AQI predictions
  const aqiPredictions = model === 'SARIMAX' 
    ? predictSARIMAX(historicalData, daysToPredict)
    : predictARIMA(historicalData, daysToPredict);
  
  // Last real data point to base our pollutant predictions on
  const lastRealData = historicalData[historicalData.length - 1];
  
  // Enhance predictions with pollutant data
  return aqiPredictions.map(prediction => {
    const predictionFactor = prediction.aqi / lastRealData.aqi;
    
    // Generate correlated pollutant predictions
    const pollutants = lastRealData.pollutants 
      ? {
          pm25: Math.round(lastRealData.pollutants.pm25 * predictionFactor * (0.9 + Math.random() * 0.2)),
          pm10: Math.round(lastRealData.pollutants.pm10 * predictionFactor * (0.9 + Math.random() * 0.2)),
          no2: Math.round(lastRealData.pollutants.no2 * predictionFactor * (0.9 + Math.random() * 0.2)),
          o3: Math.round(lastRealData.pollutants.o3 * predictionFactor * (0.9 + Math.random() * 0.2)),
          co: Math.round(lastRealData.pollutants.co * predictionFactor * (0.9 + Math.random() * 0.2) * 100) / 100,
          so2: Math.round(lastRealData.pollutants.so2 * predictionFactor * (0.9 + Math.random() * 0.2)),
          nh3: Math.round(lastRealData.pollutants.nh3 * predictionFactor * (0.9 + Math.random() * 0.2))
        }
      : null;
    
    return {
      ...prediction,
      city: lastRealData.city,
      pollutants
    };
  });
};
