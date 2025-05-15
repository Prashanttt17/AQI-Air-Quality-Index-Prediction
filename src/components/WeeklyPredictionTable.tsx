
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AQIDataPoint } from '@/utils/api-service';
import ForecastTableRow from './ForecastTableRow';
import ForecastTableHeader from './ForecastTableHeader';
import { getBackendSettings } from '@/utils/backend-integration';

interface WeeklyPredictionTableProps {
  predictions: AQIDataPoint[];
  className?: string;
}

const WeeklyPredictionTable: React.FC<WeeklyPredictionTableProps> = ({ predictions, className }) => {
  // Use the predictions directly, they should already be processed
  const finalPredictions = useMemo(() => predictions, [predictions]);
  
  // Check if we have specific location data
  const hasLocationData = predictions.length > 0 && predictions[0].location;
  const locationName = hasLocationData ? predictions[0].location : "";
  const cityName = predictions.length > 0 ? predictions[0].city : "";
  
  // Check if backend is connected
  const backendSettings = useMemo(() => getBackendSettings(), []);
  const isBackendEnabled = backendSettings.enabled && !!backendSettings.url;

  // If no predictions and backend is enabled, show a message
  if (finalPredictions.length === 0 && isBackendEnabled) {
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <ForecastTableHeader location={locationName} city={cityName || "Selected City"} />
        </CardHeader>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">
            No prediction data available. Please ensure that:
          </p>
          <ul className="text-sm mt-2 list-disc text-left pl-8 space-y-1">
            <li>The backend server is running</li>
            <li>You've selected a city with sufficient historical data</li>
            <li>You have proper API keys configured</li>
          </ul>
        </CardContent>
      </Card>
    );
  }

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
