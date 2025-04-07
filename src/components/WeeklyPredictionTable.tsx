
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AQIDataPoint } from '@/utils/api-service';
import { format } from 'date-fns';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";

interface WeeklyPredictionTableProps {
  predictions: AQIDataPoint[];
  className?: string;
}

// Helper function to determine color based on AQI value
const getAQIColor = (aqi: number): string => {
  if (aqi <= 50) return "text-green-600 dark:text-green-400";
  if (aqi <= 100) return "text-yellow-600 dark:text-yellow-400";
  if (aqi <= 150) return "text-orange-600 dark:text-orange-400";
  if (aqi <= 200) return "text-red-600 dark:text-red-400";
  if (aqi <= 300) return "text-purple-600 dark:text-purple-400";
  return "text-rose-800 dark:text-rose-500";
};

// Helper function to determine AQI category
const getAQICategory = (aqi: number): string => {
  if (aqi <= 50) return "Good";
  if (aqi <= 100) return "Moderate";
  if (aqi <= 150) return "Unhealthy for Sensitive Groups";
  if (aqi <= 200) return "Unhealthy";
  if (aqi <= 300) return "Very Unhealthy";
  return "Hazardous";
};

// Helper function to format date for display
const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return format(date, 'EEE, MMM d'); // Format as "Mon, Jan 1"
  } catch (e) {
    return dateString;
  }
};

// Helper to get pollutant health impact
const getPollutantHealth = (pollutant: string): string => {
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

const WeeklyPredictionTable: React.FC<WeeklyPredictionTableProps> = ({ predictions, className }) => {
  // Get today's date at midnight for comparison
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Get all future dates from the dataset (both predicted and actual)
  const futureDates = predictions.filter(item => {
    const itemDate = new Date(item.date);
    itemDate.setHours(0, 0, 0, 0);
    return itemDate >= today;
  });
  
  // Sort by date (ascending)
  futureDates.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  // Take only the first 7 days for weekly forecast
  const weekPredictions = futureDates.slice(0, 7);
  
  // If we don't have 7 days of data, generate days to fill the table
  if (weekPredictions.length < 7) {
    const lastDate = weekPredictions.length > 0 
      ? new Date(weekPredictions[weekPredictions.length - 1].date)
      : new Date();
      
    // Template for a prediction
    const templatePrediction = weekPredictions.length > 0
      ? { ...weekPredictions[weekPredictions.length - 1] }
      : predictions.length > 0
        ? { ...predictions[predictions.length - 1] }
        : {
            date: '',
            city: '',
            aqi: 0,
            predicted: true,
            pollutants: {
              pm25: 0,
              pm10: 0,
              no2: 0,
              o3: 0,
              co: 0,
              so2: 0,
              nh3: 0
            }
          };
    
    // Generate remaining days
    for (let i = weekPredictions.length; i < 7; i++) {
      const nextDay = new Date(lastDate);
      nextDay.setDate(nextDay.getDate() + 1);
      
      weekPredictions.push({
        ...templatePrediction,
        date: nextDay.toISOString().split('T')[0],
        predicted: true,
        aqi: Math.max(0, Math.round(templatePrediction.aqi * 0.95))  // Slightly decrease AQI each day
      });
      
      lastDate.setDate(lastDate.getDate() + 1);
    }
  }
  
  // Generate dates for next 7 days if we have no data at all
  if (weekPredictions.length === 0) {
    const currDate = new Date();
    for (let i = 0; i < 7; i++) {
      const forecastDate = new Date(currDate);
      forecastDate.setDate(forecastDate.getDate() + i);
      
      weekPredictions.push({
        date: forecastDate.toISOString().split('T')[0],
        city: '',
        aqi: 0,
        predicted: true,
        pollutants: {
          pm25: 0,
          pm10: 0,
          no2: 0,
          o3: 0,
          co: 0,
          so2: 0,
          nh3: 0
        }
      });
    }
  }

  // Mark all items as predicted for consistency
  const finalPredictions = weekPredictions.map(pred => ({
    ...pred,
    predicted: true
  }));
  
  // Check if we have specific location data
  const hasLocationData = finalPredictions.length > 0 && finalPredictions[0].location;
  const locationName = hasLocationData ? finalPredictions[0].location : "";
  const cityName = finalPredictions.length > 0 ? finalPredictions[0].city : "";
  
  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex flex-col">
          <CardTitle>7-Day AQI Forecast</CardTitle>
          {hasLocationData && (
            <div className="flex items-center mt-1">
              <Badge variant="outline" className="text-xs font-normal">
                {locationName}
              </Badge>
              <span className="text-xs text-muted-foreground ml-2">
                {locationName !== cityName ? `in ${cityName}` : "Location specific data"}
              </span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-2">
        <div className="overflow-x-auto">
          <Table className="w-full">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="py-1">Date</TableHead>
                <TableHead className="py-1">AQI</TableHead>
                <TableHead className="py-1">Category</TableHead>
                <TableHead className="py-1">Main Pollutant</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {finalPredictions.map((prediction, index) => {
                // Determine main pollutant if available
                let mainPollutant = "PM2.5";
                let pollutantValue = 0;
                
                if (prediction.pollutants) {
                  const pollutants = prediction.pollutants;
                  const maxPollutant = Object.entries(pollutants).reduce(
                    (max, [key, value]) => 
                      (key === 'pm25' && value > max.value / 10) || // Weight PM2.5 higher
                      (key === 'pm10' && value > max.value / 5) ||  // Weight PM10 higher
                      (value > max.value) 
                        ? { name: key, value } 
                        : max,
                    { name: 'pm25', value: pollutants.pm25 }
                  );
                  
                  pollutantValue = maxPollutant.value;
                  
                  switch (maxPollutant.name) {
                    case 'pm25': mainPollutant = "PM2.5"; break;
                    case 'pm10': mainPollutant = "PM10"; break;
                    case 'no2': mainPollutant = "NO₂"; break;
                    case 'o3': mainPollutant = "O₃"; break;
                    case 'co': mainPollutant = "CO"; break;
                    case 'so2': mainPollutant = "SO₂"; break;
                    case 'nh3': mainPollutant = "NH₃"; break;
                    default: mainPollutant = "PM2.5";
                  }
                }
                
                const aqiColor = getAQIColor(prediction.aqi);
                
                return (
                  <TableRow key={index} className="hover:bg-transparent">
                    <TableCell className="py-1">
                      {formatDate(prediction.date)}
                    </TableCell>
                    <TableCell className="font-medium py-1">
                      <span className={`${aqiColor}`}>{Math.round(prediction.aqi)}</span>
                    </TableCell>
                    <TableCell className="py-1">
                      <span className={`${aqiColor}`}>{getAQICategory(prediction.aqi)}</span>
                    </TableCell>
                    <TableCell className="py-1">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="cursor-help">
                              {mainPollutant}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs p-3">
                            <p className="font-medium mb-1">{mainPollutant}</p>
                            <p className="text-xs text-muted-foreground">
                              {getPollutantHealth(mainPollutant)}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default WeeklyPredictionTable;
