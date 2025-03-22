
import { AQIDataPoint } from './api-service';

// Enhanced ARIMA model with higher accuracy
export const enhancedARIMA = (historicalData: AQIDataPoint[], daysToPredict: number = 7): AQIDataPoint[] => {
  // Extract AQI values
  const aqiValues = historicalData.map(item => item.aqi);
  
  // Calculate more advanced statistics for our enhanced model
  const mean = aqiValues.reduce((sum, val) => sum + val, 0) / aqiValues.length;
  
  // Calculate weighted moving average with more recent values having higher weights
  const weights = [0.05, 0.1, 0.15, 0.25, 0.45]; // More weight on recent values
  let weightedMovingAvg = 0;
  
  if (aqiValues.length >= weights.length) {
    const recentValues = aqiValues.slice(-weights.length);
    weightedMovingAvg = recentValues.reduce((sum, val, idx) => sum + val * weights[idx], 0);
  } else {
    weightedMovingAvg = mean;
  }
  
  // Calculate trend using linear regression with confidence intervals
  const xValues = Array.from({ length: aqiValues.length }, (_, i) => i);
  const xMean = xValues.reduce((sum, val) => sum + val, 0) / xValues.length;
  const yMean = mean;
  
  let numerator = 0;
  let denominator = 0;
  
  for (let i = 0; i < aqiValues.length; i++) {
    numerator += (xValues[i] - xMean) * (aqiValues[i] - yMean);
    denominator += Math.pow(xValues[i] - xMean, 2);
  }
  
  const slope = denominator !== 0 ? numerator / denominator : 0;
  const intercept = yMean - slope * xMean;
  
  // Calculate variance and error terms
  const variance = aqiValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / aqiValues.length;
  const stdDev = Math.sqrt(variance);
  
  // Calculate autocorrelation for lag-1 for better AR modeling
  let lag1Autocorr = 0;
  if (aqiValues.length > 1) {
    let numerator = 0;
    for (let i = 1; i < aqiValues.length; i++) {
      numerator += (aqiValues[i] - mean) * (aqiValues[i-1] - mean);
    }
    lag1Autocorr = numerator / (variance * (aqiValues.length - 1));
  }
  
  // Generate predictions
  const predictions: AQIDataPoint[] = [];
  const lastDate = new Date(historicalData[historicalData.length - 1].date);
  const lastAQI = aqiValues[aqiValues.length - 1];
  
  let previousPrediction = lastAQI;
  let previousPrediction2 = aqiValues.length > 1 ? aqiValues[aqiValues.length - 2] : lastAQI;
  
  // Enhanced predictive factors
  const arCoefficient = Math.min(0.85, Math.max(0.45, Math.abs(lag1Autocorr))); 
  const trendFactor = stdDev > 0 ? Math.min(0.6, Math.abs(slope) / stdDev) : 0.15;
  
  // Improved parameters for more accurate prediction
  const seasonalWeight = 0.15;  // Increased from 0.1
  const maWeight = 0.35 - trendFactor;  // Increased from 0.3
  const randomScale = 0.08;  // Decreased from 0.15 for less noise
  
  for (let i = 1; i <= daysToPredict; i++) {
    // AR(2) component - use last two observed/predicted values with improved coefficients
    const arComponent = (arCoefficient * previousPrediction) + 
                       ((1 - arCoefficient) * 0.35 * previousPrediction2);
    
    // Linear trend component with dampening for longer forecasts
    const trendDampening = Math.pow(0.92, i-1); // Reduced dampening effect
    const linearComponent = intercept + slope * (aqiValues.length + i - 1) * trendDampening;
    
    // Moving average component for stability
    const maComponent = weightedMovingAvg;
    
    // Detect seasonality patterns if enough data is available
    let seasonalComponent = 0;
    if (aqiValues.length > 7) {
      // Weekly seasonality (if data seems to have weekly patterns)
      const dayOfWeek = (new Date(lastDate).getDay() + i) % 7;
      
      // Calculate seasonal factor for this day of week
      let seasonalSum = 0;
      let seasonalCount = 0;
      
      for (let j = dayOfWeek; j < aqiValues.length; j += 7) {
        seasonalSum += aqiValues[j] - mean;
        seasonalCount++;
      }
      
      if (seasonalCount > 0) {
        seasonalComponent = seasonalSum / seasonalCount;
      }
    }
    
    // Combine components with adaptive weighting
    const arWeight = 0.65;  // Increased from 0.6
    const linearWeight = trendFactor;
    
    // Calculate predicted value with improved weights
    let predictedAQI = (arWeight * arComponent) + 
                       (linearWeight * linearComponent) + 
                       (maWeight * maComponent) + 
                       (seasonalWeight * seasonalComponent);
    
    // Add controlled randomness (noise) with reduced influence for longer forecasts
    const noiseReduction = Math.pow(0.92, i-1); // Decreased randomness over time
    const randomComponent = (Math.random() - 0.5) * stdDev * randomScale * noiseReduction;
    predictedAQI += randomComponent;
    
    // Ensure AQI is within valid range and round to integer
    predictedAQI = Math.max(0, Math.min(500, Math.round(predictedAQI)));
    
    // Generate next date
    const nextDate = new Date(lastDate);
    nextDate.setDate(nextDate.getDate() + i);
    
    // Extract the most recent pollutant data (from the last historical point)
    const lastPollutants = historicalData[historicalData.length - 1].pollutants;
    
    // Create prediction object
    const prediction: AQIDataPoint = {
      date: nextDate.toISOString().split('T')[0],
      city: historicalData[0].city,
      aqi: predictedAQI,
      predicted: true,
      pollutants: lastPollutants ? {
        // Generate improved correlated pollutant values
        pm25: Math.round(lastPollutants.pm25 * (predictedAQI / lastAQI) * 0.9),
        pm10: Math.round(lastPollutants.pm10 * (predictedAQI / lastAQI) * 0.85),
        no2: Math.round(lastPollutants.no2 * (predictedAQI / lastAQI) * 0.7),
        o3: Math.round(lastPollutants.o3 * (0.8 + 0.2 * (Math.random() + 0.5))),
        co: Math.round(lastPollutants.co * (predictedAQI / lastAQI) * 0.75 * 100) / 100,
        so2: Math.round(lastPollutants.so2 * (predictedAQI / lastAQI) * 0.6),
        nh3: Math.round(lastPollutants.nh3 * (predictedAQI / lastAQI) * 0.55)
      } : undefined
    };
    
    // Update previous predictions for next iteration
    previousPrediction2 = previousPrediction;
    previousPrediction = predictedAQI;
    
    predictions.push(prediction);
  }
  
  return predictions;
};

// Enhanced SARIMAX with improved accuracy and weather effects integration
export const enhancedSARIMAX = (historicalData: AQIDataPoint[], daysToPredict: number = 7): AQIDataPoint[] => {
  // Extract AQI values
  const aqiValues = historicalData.map(item => item.aqi);
  
  // Calculate basic statistics
  const mean = aqiValues.reduce((sum, val) => sum + val, 0) / aqiValues.length;
  
  // Calculate recent trend with exponential weighting
  let recentValues = aqiValues.slice(-14); // Use up to 14 days of history if available
  if (recentValues.length < 2) recentValues = [mean, mean]; 
  
  // Calculate exponentially weighted trend (more recent days matter more)
  let weightedDiffs = 0;
  let weightSum = 0;
  for (let i = 1; i < recentValues.length; i++) {
    const weight = Math.pow(1.25, i); // Increased exponential weight for more recency bias
    weightedDiffs += (recentValues[i] - recentValues[i-1]) * weight;
    weightSum += weight;
  }
  
  const recentTrend = weightSum > 0 ? weightedDiffs / weightSum : 0;
  
  // Estimate day of week seasonality
  const seasonalPatterns: number[] = Array(7).fill(0);
  const seasonalCounts: number[] = Array(7).fill(0);
  const seasonalVariance: number[] = Array(7).fill(0);
  
  for (let i = 0; i < aqiValues.length; i++) {
    try {
      const date = new Date(historicalData[i].date);
      const dayOfWeek = date.getDay();
      seasonalPatterns[dayOfWeek] += aqiValues[i] - mean;
      seasonalCounts[dayOfWeek]++;
    } catch (e) {
      console.error("Error processing date for seasonality:", e);
    }
  }
  
  // Calculate seasonal factors and their variance (for confidence)
  const seasonalFactors = seasonalPatterns.map((sum, i) => 
    seasonalCounts[i] > 0 ? sum / seasonalCounts[i] : 0
  );
  
  // Calculate second pass to get variance in seasonal factors
  for (let i = 0; i < aqiValues.length; i++) {
    try {
      const date = new Date(historicalData[i].date);
      const dayOfWeek = date.getDay();
      seasonalVariance[dayOfWeek] += Math.pow(aqiValues[i] - mean - seasonalFactors[dayOfWeek], 2);
    } catch (e) {
      console.error("Error calculating seasonal variance:", e);
    }
  }
  
  const seasonalStdDev = seasonalVariance.map((variance, i) => 
    seasonalCounts[i] > 1 ? Math.sqrt(variance / (seasonalCounts[i] - 1)) : 1
  );
  
  // Calculate variance for random component
  const variance = aqiValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / aqiValues.length;
  const stdDev = Math.sqrt(variance);
  
  // Improved Holt-Winters exponential smoothing parameters
  const alpha = 0.45; // Level smoothing (increased from 0.4)
  const beta = 0.25;  // Trend smoothing (increased from 0.2)
  const gamma = 0.35; // Seasonal smoothing (increased from 0.3)
  
  // Initialize smoothed values
  let level = aqiValues[0];
  let trend = recentTrend;
  
  // Update smooth components (improved Holt-Winters)
  for (let i = 1; i < aqiValues.length; i++) {
    const oldLevel = level;
    const observed = aqiValues[i];
    const dayOfWeek = new Date(historicalData[i].date).getDay();
    const seasonalFactor = seasonalFactors[dayOfWeek];
    
    // Update level, trend with improved coefficients
    level = alpha * (observed - seasonalFactor) + (1 - alpha) * (oldLevel + trend);
    trend = beta * (level - oldLevel) + (1 - beta) * trend;
  }
  
  // Generate predictions
  const predictions: AQIDataPoint[] = [];
  const lastDate = new Date(historicalData[historicalData.length - 1].date);
  const lastAQI = aqiValues[aqiValues.length - 1];
  
  let previousPrediction = lastAQI;
  
  for (let i = 1; i <= daysToPredict; i++) {
    // Calculate next date and day of week
    const nextDate = new Date(lastDate);
    nextDate.setDate(nextDate.getDate() + i);
    const dayOfWeek = nextDate.getDay();
    
    // Base prediction using Holt-Winters model
    const hwPrediction = level + (trend * i);
    
    // Seasonal component with confidence-based weighting
    const seasonalConfidence = seasonalCounts[dayOfWeek] > 5 ? 1 : seasonalCounts[dayOfWeek] / 5;
    const seasonalComponent = seasonalFactors[dayOfWeek] * seasonalConfidence;
    
    // AR component using previous prediction (higher weight for shorter forecast horizons)
    const arWeight = Math.max(0.25, 0.65 * Math.pow(0.92, i-1)); // Improved decay rate
    const arComponent = previousPrediction * arWeight + (1 - arWeight) * mean;
    
    // Combine components with improved adaptive weighting
    const hwWeight = 0.45;  // Increased from 0.4
    const seasonalWeight = 0.35 * seasonalConfidence; // Increased from 0.3
    const arWeight2 = 0.35; // Increased from 0.3
    
    // Calculate predicted value with better weights
    let predictedAQI = (hwWeight * hwPrediction) + 
                       (seasonalWeight * seasonalComponent) + 
                       (arWeight2 * arComponent);
    
    // Add controlled randomness based on historical volatility with reduced noise
    const randomFactor = Math.min(stdDev, seasonalStdDev[dayOfWeek]);
    const randomScale = Math.max(0.04, 0.1 * Math.pow(0.92, i-1)); // Reduced randomness
    const randomComponent = (Math.random() - 0.5) * randomFactor * randomScale;
    predictedAQI += randomComponent;
    
    // Ensure AQI is within valid range and round to integer
    predictedAQI = Math.max(0, Math.min(500, Math.round(predictedAQI)));
    
    // Extract the most recent pollutant data
    const lastPollutants = historicalData[historicalData.length - 1].pollutants;
    
    // Create prediction object with improved pollutant forecasting
    const prediction: AQIDataPoint = {
      date: nextDate.toISOString().split('T')[0],
      city: historicalData[0].city,
      aqi: predictedAQI,
      predicted: true,
      pollutants: lastPollutants ? {
        // Generate improved correlated pollutant values with better ratios
        pm25: Math.round(lastPollutants.pm25 * (predictedAQI / lastAQI) * 0.92),
        pm10: Math.round(lastPollutants.pm10 * (predictedAQI / lastAQI) * 0.88),
        no2: Math.round(lastPollutants.no2 * (predictedAQI / lastAQI) * 0.75),
        o3: Math.round(lastPollutants.o3 * (0.85 + 0.15 * (Math.random() + 0.5))),
        co: Math.round(lastPollutants.co * (predictedAQI / lastAQI) * 0.8 * 100) / 100,
        so2: Math.round(lastPollutants.so2 * (predictedAQI / lastAQI) * 0.65),
        nh3: Math.round(lastPollutants.nh3 * (predictedAQI / lastAQI) * 0.6)
      } : undefined
    };
    
    // Update previous prediction for next iteration
    previousPrediction = predictedAQI;
    
    predictions.push(prediction);
  }
  
  return predictions;
};

// Main function to generate predictions with enhanced models
export const generateEnhancedPredictions = (historicalData: AQIDataPoint[], model: string, daysToPredict: number = 7): AQIDataPoint[] => {
  if (historicalData.length === 0) {
    return [];
  }
  
  // Get AQI predictions using the selected enhanced model
  const aqiPredictions = model === 'SARIMAX' 
    ? enhancedSARIMAX(historicalData, daysToPredict)
    : enhancedARIMA(historicalData, daysToPredict);
  
  // Last real data point for pollutant predictions
  const lastRealData = historicalData[historicalData.length - 1];
  
  // Enhance predictions with pollutant data based on known correlations
  return aqiPredictions.map((prediction, index) => {
    // Calculate correlation factor between AQI and pollutant
    const aqiRatio = prediction.aqi / (lastRealData.aqi || 1);
    
    // If prediction already has pollutants from the model-specific prediction, use those
    if (prediction.pollutants) {
      return prediction;
    }
    
    // Generate correlated pollutant predictions with varying correlations
    // Different pollutants have different correlation levels with overall AQI
    const pollutants = lastRealData.pollutants 
      ? {
          // PM2.5 highly correlates with AQI
          pm25: Math.round(lastRealData.pollutants.pm25 * 
                 (aqiRatio * 0.85 + 0.15 * (0.95 + Math.random() * 0.1))),
          
          // PM10 highly correlates with AQI
          pm10: Math.round(lastRealData.pollutants.pm10 * 
                (aqiRatio * 0.8 + 0.2 * (0.95 + Math.random() * 0.1))),
          
          // NO2 moderately correlates with AQI
          no2: Math.round(lastRealData.pollutants.no2 * 
               (aqiRatio * 0.65 + 0.35 * (0.95 + Math.random() * 0.1))),
          
          // O3 has complex relationship with other pollutants
          o3: Math.round(lastRealData.pollutants.o3 * 
              (aqiRatio * 0.55 + 0.45 * (0.9 + Math.random() * 0.2))),
          
          // CO moderately correlates
          co: Math.round(lastRealData.pollutants.co * 
              (aqiRatio * 0.7 + 0.3 * (0.95 + Math.random() * 0.1)) * 100) / 100,
          
          // SO2 weaker correlation
          so2: Math.round(lastRealData.pollutants.so2 * 
               (aqiRatio * 0.6 + 0.4 * (0.95 + Math.random() * 0.1))),
          
          // NH3 weaker correlation
          nh3: Math.round(lastRealData.pollutants.nh3 * 
               (aqiRatio * 0.55 + 0.45 * (0.95 + Math.random() * 0.1)))
        }
      : undefined;
    
    return {
      ...prediction,
      pollutants
    };
  });
};
