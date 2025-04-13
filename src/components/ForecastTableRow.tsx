
import React from 'react';
import { TableCell, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { format } from 'date-fns';
import { getAQIColor, getAQICategory, getPollutantHealth } from '@/utils/aqi-helpers';

interface ForecastTableRowProps {
  date: string;
  aqi: number;
  pollutants: Record<string, number> | null;
}

// Helper function to format date for display
const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return format(date, 'EEE, MMM d'); // Format as "Mon, Jan 1"
  } catch (e) {
    return dateString;
  }
};

const ForecastTableRow: React.FC<ForecastTableRowProps> = ({ date, aqi, pollutants }) => {
  // Determine main pollutant if available
  let mainPollutant = "PM2.5";
  let pollutantValue = 0;
  
  if (pollutants) {
    const maxPollutant = Object.entries(pollutants).reduce(
      (max, [key, value]) => {
        const numValue = typeof value === 'number' ? value : 0;
        const maxValue = typeof max.value === 'number' ? max.value : 0;
        
        if ((key === 'pm25' && numValue > maxValue / 10) || // Weight PM2.5 higher
            (key === 'pm10' && numValue > maxValue / 5) ||  // Weight PM10 higher
            (numValue > maxValue))  
          return { name: key, value: numValue };
        return max;
      },
      { name: 'pm25', value: pollutants.pm25 || 0 }
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
  
  const aqiColor = getAQIColor(aqi);
  
  return (
    <TableRow className="hover:bg-transparent">
      <TableCell className="py-1">
        {formatDate(date)}
      </TableCell>
      <TableCell className="font-medium py-1">
        <span className={`${aqiColor}`}>{Math.round(aqi)}</span>
      </TableCell>
      <TableCell className="py-1">
        <span className={`${aqiColor}`}>{getAQICategory(aqi)}</span>
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
};

export default ForecastTableRow;
