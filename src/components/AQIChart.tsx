
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
import { AQI_LEVELS } from "@/utils/aqi-utils";

interface AQIChartProps {
  data: any[];
  className?: string;
}

// Custom tooltip to show AQI value and date with dark mode support
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
  // Format dates for display if needed
  const chartData = data && data.length > 0 ? data.map(item => {
    // Ensure dates are properly formatted
    let formattedDate = item.date;
    if (formattedDate && typeof formattedDate === 'string') {
      // Try to ensure the date is in a valid format
      try {
        const dateObj = new Date(formattedDate);
        if (!isNaN(dateObj.getTime())) {
          // Format for display in chart
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
  
  // Define AQI threshold levels for reference lines (using AQI_LEVELS from aqi-utils)
  const thresholds = [
    { value: 50, label: "Good", color: "#4ade80" },
    { value: 100, label: "Moderate", color: "#facc15" },
    { value: 150, label: "Unhealthy for Sensitive Groups", color: "#fb923c" },
    { value: 200, label: "Unhealthy", color: "#ef4444" },
    { value: 300, label: "Very Unhealthy", color: "#9333ea" }
  ];
  
  // Find max AQI for setting y-axis domain - default to 300 to show all threshold levels
  const maxAqi = Math.max(...(chartData.length > 0 ? chartData.map(item => item.aqi) : [0]), 300);
  const yAxisMax = Math.min(Math.ceil(maxAqi * 1.1 / 50) * 50, 500);
  
  // Separate historical and predicted data for better visualization
  const historicalData = chartData.filter(item => !item.predicted);
  const predictedData = chartData.filter(item => item.predicted);
  
  // Show placeholder chart with reference lines when no data is available
  const showPlaceholder = chartData.length === 0;
  
  // Create placeholder data for empty chart (just to display reference lines)
  const placeholderData = showPlaceholder ? [
    { date: "Jan 1", aqi: 0 },
    { date: "Jan 31", aqi: 0 }
  ] : [];
  
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>AQI Forecast Chart</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ChartContainer
            config={{
              historical: { color: "#93c5fd" }, // Lighter blue for historical
              predicted: { color: "#f97316" },  // Orange for predictions
            }}
          >
            <div className="w-full h-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  margin={{ top: 5, right: 120, left: 20, bottom: 5 }}
                  data={showPlaceholder ? placeholderData : undefined}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis 
                    dataKey="date" 
                    interval="preserveStartEnd"
                    minTickGap={30}
                    allowDuplicatedCategory={false}
                  />
                  <YAxis 
                    domain={[0, yAxisMax]} 
                    label={{ value: 'AQI Value', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  
                  {/* Reference lines for AQI thresholds - with wider right margin for labels */}
                  {thresholds.map(threshold => (
                    <ReferenceLine 
                      key={threshold.value}
                      y={threshold.value} 
                      stroke={threshold.color} 
                      strokeDasharray="3 3"
                      label={{ 
                        value: threshold.label, 
                        position: 'right', 
                        fill: threshold.color,
                        fontSize: 12,
                        offset: 10,
                      }}
                    />
                  ))}
                  
                  {/* Show empty state message when no real data */}
                  {showPlaceholder && (
                    <text 
                      x="50%" 
                      y="50%" 
                      textAnchor="middle" 
                      dominantBaseline="middle" 
                      className="fill-muted-foreground"
                    >
                      No data to display. Please select a city and load data.
                    </text>
                  )}
                  
                  {/* Historical data line rendered first (in background) */}
                  {historicalData.length > 0 && (
                    <Line
                      data={historicalData}
                      type="monotone"
                      dataKey="aqi"
                      name="Historical AQI"
                      stroke="var(--color-historical)"
                      strokeWidth={2}
                      strokeOpacity={0.6}
                      dot={{ r: 2, strokeWidth: 1 }}
                      activeDot={{ r: 5 }}
                      isAnimationActive={true}
                      connectNulls={true}
                    />
                  )}
                  
                  {/* Predicted data line rendered on top (more prominent) */}
                  {predictedData.length > 0 && (
                    <Line
                      data={predictedData}
                      type="monotone"
                      dataKey="aqi"
                      name="Predicted AQI"
                      stroke="var(--color-predicted)"
                      strokeWidth={3}
                      strokeDasharray="4 0"
                      dot={{ r: 3, strokeWidth: 2 }}
                      activeDot={{ r: 6 }}
                      isAnimationActive={true}
                      connectNulls={true}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default AQIChart;
