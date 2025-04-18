
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

interface ModelSelectorProps {
  selectedModel: string;
  onModelChange: (model: string) => void;
  className?: string;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({ 
  selectedModel, 
  onModelChange,
  className
}) => {
  return (
    <Card className={className}>
      <CardHeader className="pb-4 pt-4">
        <CardTitle className="text-lg">Prediction Model</CardTitle>
        <CardDescription className="text-sm">
          Select the forecasting model to use
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs 
          defaultValue={selectedModel} 
          value={selectedModel}
          onValueChange={onModelChange}
          className="w-full"
        >
          <TabsList className="grid grid-cols-2 w-full h-10">
            <TabsTrigger value="ARIMA" className="text-sm">ARIMA</TabsTrigger>
            <TabsTrigger value="SARIMAX" className="text-sm">SARIMAX</TabsTrigger>
          </TabsList>
          <TabsContent value="ARIMA" className="mt-5">
            <div className="text-sm space-y-2">
              <p className="font-medium">AutoRegressive Integrated Moving Average</p>
              <p className="text-muted-foreground">
                A time series forecasting model that works well with non-seasonal data.
                Suitable for short-term forecasting with stable patterns.
              </p>
            </div>
          </TabsContent>
          <TabsContent value="SARIMAX" className="mt-5">
            <div className="text-sm space-y-2">
              <p className="font-medium">Seasonal ARIMA with eXogenous variables</p>
              <p className="text-muted-foreground">
                An enhanced version of ARIMA that accounts for seasonal patterns in the data.
                Better for data with weekly or monthly cyclical trends.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ModelSelector;
