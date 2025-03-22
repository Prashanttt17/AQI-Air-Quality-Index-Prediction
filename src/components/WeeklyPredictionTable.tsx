
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AQIDataPoint } from '@/utils/api-service';
import { format } from 'date-fns';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
  // Only show the first 7 days of predictions
  const weekPredictions = predictions.slice(0, 7);
  
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>7-Day AQI Forecast</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>AQI</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Main Pollutant</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {weekPredictions.map((prediction, index) => {
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
                  <TableRow key={index}>
                    <TableCell>
                      {formatDate(prediction.date)}
                    </TableCell>
                    <TableCell className="font-medium">
                      <span className={`${aqiColor}`}>{Math.round(prediction.aqi)}</span>
                    </TableCell>
                    <TableCell>
                      <span className={`${aqiColor}`}>{getAQICategory(prediction.aqi)}</span>
                    </TableCell>
                    <TableCell>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="cursor-help">
                              {mainPollutant}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs p-4">
                            <p className="font-medium mb-2">{mainPollutant}</p>
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
