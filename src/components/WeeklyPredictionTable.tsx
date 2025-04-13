
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AQIDataPoint } from '@/utils/api-service';
import { generateForecastData } from '@/utils/forecast-data-helpers';
import ForecastTableRow from './ForecastTableRow';
import ForecastTableHeader from './ForecastTableHeader';

interface WeeklyPredictionTableProps {
  predictions: AQIDataPoint[];
  className?: string;
}

const WeeklyPredictionTable: React.FC<WeeklyPredictionTableProps> = ({ predictions, className }) => {
  // Create a memoized version of finalPredictions to prevent recalculation on re-renders
  // This ensures values stay consistent when interacting with the component
  const finalPredictions = useMemo(() => generateForecastData(predictions), [predictions]);
  
  // Check if we have specific location data
  const hasLocationData = predictions.length > 0 && predictions[0].location;
  const locationName = hasLocationData ? predictions[0].location : "";
  const cityName = predictions.length > 0 ? predictions[0].city : "";
  
  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <ForecastTableHeader location={locationName} city={cityName} />
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
              {finalPredictions.map((prediction, index) => (
                <ForecastTableRow 
                  key={index}
                  date={prediction.date}
                  aqi={prediction.aqi}
                  pollutants={prediction.pollutants}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default WeeklyPredictionTable;
