
import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { AQI_LEVELS, getAQILevel } from "@/utils/aqi-utils";

interface AQIChartProps {
  data: any[];
  className?: string;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="border bg-card text-card-foreground shadow-lg rounded-md p-3">
        <p className="text-sm font-semibold">{`Date: ${data.date}`}</p>
        <p className="text-sm">{`AQI: ${data.aqi}`}</p>
        <p className="text-xs text-muted-foreground">{data.predicted ? "Predicted" : "Historical"}</p>
        {data.pollutants && (
          <div className="mt-2 pt-2 border-t border-border">
            <p className="text-xs font-medium">Main Pollutants:</p>
            <div className="text-xs space-y-1 mt-1">
              {data.pollutants.pm25 && (
                <p>PM2.5: {data.pollutants.pm25} µg/m³</p>
              )}
              {data.pollutants.pm10 && (
                <p>PM10: {data.pollutants.pm10} µg/m³</p>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }
  return null;
};

const AQIChart: React.FC<AQIChartProps> = ({ data, className }) => {
  const chartData = data && data.length > 0 ? data.map(item => {
    let formattedDate = item.date;
    if (formattedDate && typeof formattedDate === 'string') {
      try {
        const dateObj = new Date(formattedDate);
        if (!isNaN(dateObj.getTime())) {
          formattedDate = dateObj.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric' 
          });
        }
      } catch (e) {
        console.error("Date parsing error:", e);
      }
    }
    
    return {
      date: formattedDate,
      aqi: item.aqi,
      predicted: item.predicted || false,
      pollutants: item.pollutants
    };
  }) : [];
  
  // Define exact thresholds directly from AQI_LEVELS for better alignment
  const thresholds = [
    { value: 50, label: "Good", color: "#4ade80" },
    { value: 100, label: "Moderate", color: "#facc15" },
    { value: 150, label: "Unhealthy for Sensitive Groups", color: "#f97316" },
    { value: 200, label: "Unhealthy", color: "#ef4444" },
    { value: 300, label: "Very Unhealthy", color: "#9333ea" },
    { value: 500, label: "Hazardous", color: "#be123c" }
  ];
  
  // Calculate appropriate Y-axis max that aligns with AQI levels
  const maxAqi = Math.max(...(chartData.length > 0 ? chartData.map(item => item.aqi) : [0]), 250);
  
  // Find next threshold above the max AQI
  let yAxisMax = 500; // Default to maximum scale
  for (const threshold of thresholds) {
    if (threshold.value > maxAqi) {
      yAxisMax = threshold.value;
      break;
    }
  }
  
  // Ensure we always have at least 2 thresholds visible
  if (yAxisMax <= 100) yAxisMax = 150;
  
  const historicalData = chartData.filter(item => !item.predicted);
  const predictedData = chartData.filter(item => item.predicted);
  
  const showPlaceholder = chartData.length === 0;
  
  const placeholderData = showPlaceholder ? [
    { date: "Jan 1", aqi: 0 },
    { date: "Jan 31", aqi: 0 }
  ] : [];
  
  // Calculate proper tick values based on visible range
  const tickValues = thresholds
    .filter(threshold => threshold.value <= yAxisMax)
    .map(threshold => threshold.value);
  
  return (
    <Card className={`h-full flex flex-col ${className}`}>
      <CardHeader className="pb-6 pt-4 flex-shrink-0">
        <CardTitle>AQI Forecast Chart</CardTitle>
      </CardHeader>
      <CardContent className="p-0 flex-1 flex flex-col min-h-0">
        <div className="h-full w-full flex-1">
          <ChartContainer
            config={{
              historical: { color: "#0EA5E9" }, // Brighter blue for better visibility
              predicted: { color: "#F97316" }, // Bright orange for predictions
            }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                margin={{ top: 15, right: 130, left: 30, bottom: 35 }}
                data={showPlaceholder ? placeholderData : undefined}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis 
                  dataKey="date" 
                  interval="preserveStartEnd"
                  minTickGap={30}
                  allowDuplicatedCategory={false}
                  padding={{ left: 15, right: 15 }}
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  domain={[0, yAxisMax]} 
                  ticks={tickValues}
                  label={{ 
                    value: 'AQI Value', 
                    angle: -90, 
                    position: 'insideLeft',
                    style: { textAnchor: 'middle' },
                    offset: -10,
                    fontSize: 12
                  }}
                  tick={{ fontSize: 12 }}
                  tickMargin={5}
                  width={35}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }} 
                  verticalAlign="bottom" 
                  height={35}
                  iconSize={10}
                />
                
                {thresholds.map(threshold => {
                  // Only show thresholds that are within our current Y axis range
                  if (threshold.value <= yAxisMax) {
                    return (
                      <React.Fragment key={threshold.value}>
                        {/* Main reference line */}
                        <ReferenceLine 
                          y={threshold.value} 
                          stroke={threshold.color} 
                          strokeDasharray="3 3"
                        />
                        {/* Label on the right side (text) */}
                        <ReferenceLine 
                          y={threshold.value} 
                          stroke="transparent"
                          label={{
                            value: threshold.label,
                            position: 'right',
                            fill: threshold.color,
                            fontSize: 11,
                            offset: 5
                          }}
                        />
                      </React.Fragment>
                    );
                  }
                  return null;
                })}
                
                {showPlaceholder && (
                  <text 
                    x="50%" 
                    y="50%" 
                    textAnchor="middle" 
                    dominantBaseline="middle" 
                    className="fill-muted-foreground"
                    fontSize={14}
                  >
                    No data to display. Please select a city and load data.
                  </text>
                )}
                
                {historicalData.length > 0 && (
                  <Line
                    data={historicalData}
                    type="monotone"
                    dataKey="aqi"
                    name="Historical AQI"
                    stroke="var(--color-historical)"
                    strokeWidth={2.5}
                    dot={{ r: 3, strokeWidth: 1.5 }}
                    activeDot={{ r: 5 }}
                    isAnimationActive={true}
                    connectNulls={true}
                  />
                )}
                
                {predictedData.length > 0 && (
                  <Line
                    data={predictedData}
                    type="monotone"
                    dataKey="aqi"
                    name="Predicted AQI"
                    stroke="var(--color-predicted)"
                    strokeWidth={3}
                    strokeDasharray="4 0"
                    dot={{ r: 3.5, strokeWidth: 2 }}
                    activeDot={{ r: 5.5 }}
                    isAnimationActive={true}
                    connectNulls={true}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default AQIChart;
