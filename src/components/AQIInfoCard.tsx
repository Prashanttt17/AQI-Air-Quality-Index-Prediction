
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAQILevel } from "@/utils/aqi-utils";

interface AQIInfoCardProps {
  title: string;
  value: number;
  subtitle?: string;
  className?: string;
}

const AQIInfoCard: React.FC<AQIInfoCardProps> = ({ title, value, subtitle, className }) => {
  // Ensure value is a valid number
  const safeValue = isNaN(value) ? 0 : value;
  const aqiLevel = getAQILevel(safeValue);
  
  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-md font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${aqiLevel.color}`} />
            <span className="text-2xl font-bold">{safeValue}</span>
          </div>
          <div className="mt-1">
            <span className={`text-sm font-medium ${aqiLevel.textColor}`}>
              {aqiLevel.level}
            </span>
          </div>
          {subtitle && (
            <div className="text-xs text-muted-foreground mt-1">
              {subtitle}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AQIInfoCard;
