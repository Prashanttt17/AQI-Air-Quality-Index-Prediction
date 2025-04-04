
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
  
  // Format display value to avoid showing decimal places
  const displayValue = Math.round(safeValue);
  
  return (
    <Card className={className}>
      <CardHeader className="pb-2 pt-4">
        <CardTitle className="text-lg font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center py-1">
          <div className="flex items-center space-x-3">
            <div className={`w-4 h-4 rounded-full ${aqiLevel.color}`} />
            <span className="text-3xl font-bold">{displayValue}</span>
          </div>
          <div className="mt-2">
            <span className={`text-base font-medium ${aqiLevel.textColor}`}>
              {aqiLevel.level}
            </span>
          </div>
          {subtitle && (
            <div className="text-sm text-muted-foreground mt-2">
              {subtitle}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AQIInfoCard;
