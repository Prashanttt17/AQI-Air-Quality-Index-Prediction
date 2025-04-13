
import React from 'react';
import { Badge } from "@/components/ui/badge";

interface ForecastTableHeaderProps {
  location?: string;
  city?: string;
}

const ForecastTableHeader: React.FC<ForecastTableHeaderProps> = ({ location, city }) => {
  const hasLocationData = !!location;
  
  return (
    <>
      <div className="flex flex-col">
        <h3 className="text-2xl font-semibold leading-none tracking-tight">7-Day AQI Forecast</h3>
        {hasLocationData && (
          <div className="flex items-center mt-1">
            <Badge variant="outline" className="text-xs font-normal">
              {location}
            </Badge>
            <span className="text-xs text-muted-foreground ml-2">
              {location !== city ? `in ${city}` : "Location specific data"}
            </span>
          </div>
        )}
      </div>
    </>
  );
};

export default ForecastTableHeader;
