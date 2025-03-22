
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { HelpCircle, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

// Define pollutant thresholds based on standard guidelines
const POLLUTANT_LEVELS = {
  pm25: [
    { range: [0, 12], level: "Good", color: "bg-green-500", description: "Air quality is satisfactory, and air pollution poses little or no risk." },
    { range: [12.1, 35.4], level: "Moderate", color: "bg-yellow-400", description: "Air quality is acceptable. However, there may be a risk for some people, particularly those who are unusually sensitive to air pollution." },
    { range: [35.5, 55.4], level: "Unhealthy for Sensitive Groups", color: "bg-orange-400", description: "Members of sensitive groups may experience health effects. The general public is less likely to be affected." },
    { range: [55.5, 150.4], level: "Unhealthy", color: "bg-red-500", description: "Some members of the general public may experience health effects; members of sensitive groups may experience more serious health effects." },
    { range: [150.5, 250.4], level: "Very Unhealthy", color: "bg-purple-600", description: "Health alert: The risk of health effects is increased for everyone." },
    { range: [250.5, 500], level: "Hazardous", color: "bg-rose-900", description: "Health warning of emergency conditions: everyone is more likely to be affected." }
  ],
  pm10: [
    { range: [0, 54], level: "Good", color: "bg-green-500", description: "Air quality is satisfactory, and air pollution poses little or no risk." },
    { range: [55, 154], level: "Moderate", color: "bg-yellow-400", description: "Air quality is acceptable. However, there may be a risk for some people, particularly those who are unusually sensitive to air pollution." },
    { range: [155, 254], level: "Unhealthy for Sensitive Groups", color: "bg-orange-400", description: "Members of sensitive groups may experience health effects. The general public is less likely to be affected." },
    { range: [255, 354], level: "Unhealthy", color: "bg-red-500", description: "Some members of the general public may experience health effects; members of sensitive groups may experience more serious health effects." },
    { range: [355, 424], level: "Very Unhealthy", color: "bg-purple-600", description: "Health alert: The risk of health effects is increased for everyone." },
    { range: [425, 604], level: "Hazardous", color: "bg-rose-900", description: "Health warning of emergency conditions: everyone is more likely to be affected." }
  ],
  co: [
    { range: [0, 4.4], level: "Good", color: "bg-green-500", description: "Carbon monoxide levels are low and pose little health risk." },
    { range: [4.5, 9.4], level: "Moderate", color: "bg-yellow-400", description: "Sensitive individuals should consider limiting prolonged outdoor exertion." },
    { range: [9.5, 12.4], level: "Unhealthy for Sensitive Groups", color: "bg-orange-400", description: "People with heart disease should limit moderate exertion and avoid sources of CO." },
    { range: [12.5, 15.4], level: "Unhealthy", color: "bg-red-500", description: "Avoid prolonged exertion near roadways or other sources of carbon monoxide." },
    { range: [15.5, 30.4], level: "Very Unhealthy", color: "bg-purple-600", description: "Avoid any outdoor activity and sources of CO. Stay indoors if possible." },
    { range: [30.5, 50.4], level: "Hazardous", color: "bg-rose-900", description: "Health warning of emergency conditions. Everyone should avoid all outdoor exertion." }
  ],
  no2: [
    { range: [0, 53], level: "Good", color: "bg-green-500", description: "Nitrogen dioxide levels are low and pose little health risk." },
    { range: [54, 100], level: "Moderate", color: "bg-yellow-400", description: "Unusually sensitive people should consider reducing prolonged outdoor exertion." },
    { range: [101, 360], level: "Unhealthy for Sensitive Groups", color: "bg-orange-400", description: "People with respiratory diseases should limit outdoor exertion." },
    { range: [361, 649], level: "Unhealthy", color: "bg-red-500", description: "Everyone should limit prolonged outdoor exertion near busy roads." },
    { range: [650, 1249], level: "Very Unhealthy", color: "bg-purple-600", description: "Avoid outdoor activity, especially near sources of combustion." },
    { range: [1250, 2049], level: "Hazardous", color: "bg-rose-900", description: "Everyone should avoid all outdoor exertion." }
  ],
  o3: [
    { range: [0, 54], level: "Good", color: "bg-green-500", description: "Ozone levels are low and pose little health risk." },
    { range: [55, 70], level: "Moderate", color: "bg-yellow-400", description: "Unusually sensitive individuals may experience respiratory symptoms." },
    { range: [71, 85], level: "Unhealthy for Sensitive Groups", color: "bg-orange-400", description: "People with lung disease, children, and older adults should reduce prolonged outdoor exertion." },
    { range: [86, 105], level: "Unhealthy", color: "bg-red-500", description: "Everyone should reduce prolonged outdoor exertion. Risk of respiratory symptoms in sensitive individuals." },
    { range: [106, 200], level: "Very Unhealthy", color: "bg-purple-600", description: "Everyone should avoid outdoor activity. Sensitive groups should remain indoors." },
    { range: [201, 604], level: "Hazardous", color: "bg-rose-900", description: "Everyone should avoid all outdoor exertion and remain indoors if possible." }
  ],
  so2: [
    { range: [0, 35], level: "Good", color: "bg-green-500", description: "Sulfur dioxide levels are low and pose little health risk." },
    { range: [36, 75], level: "Moderate", color: "bg-yellow-400", description: "Sensitive groups should monitor symptoms like wheezing or shortness of breath." },
    { range: [76, 185], level: "Unhealthy for Sensitive Groups", color: "bg-orange-400", description: "People with asthma should limit outdoor exertion." },
    { range: [186, 304], level: "Unhealthy", color: "bg-red-500", description: "People with asthma, children and older adults should avoid outdoor activity." },
    { range: [305, 604], level: "Very Unhealthy", color: "bg-purple-600", description: "Children, older adults, and people with lung disease should remain indoors." },
    { range: [605, 1004], level: "Hazardous", color: "bg-rose-900", description: "Everyone should avoid all outdoor exertion." }
  ],
  nh3: [
    { range: [0, 200], level: "Good", color: "bg-green-500", description: "Ammonia levels are low and pose little health risk." },
    { range: [201, 400], level: "Moderate", color: "bg-yellow-400", description: "May cause mild irritation for sensitive individuals." },
    { range: [401, 800], level: "Unhealthy for Sensitive Groups", color: "bg-orange-400", description: "People with respiratory conditions may experience mild irritation." },
    { range: [801, 1200], level: "Unhealthy", color: "bg-red-500", description: "May cause respiratory irritation in the general population." },
    { range: [1201, 1800], level: "Very Unhealthy", color: "bg-purple-600", description: "Everyone may begin to experience respiratory irritation." },
    { range: [1801, 2800], level: "Hazardous", color: "bg-rose-900", description: "Health warning of emergency conditions. Potential for serious respiratory effects." }
  ]
};

// Get level based on pollutant value
const getPollutantLevel = (pollutant: string, value: number) => {
  const levels = (POLLUTANT_LEVELS as any)[pollutant];
  if (!levels) return { level: "Unknown", color: "bg-gray-500", description: "No data available" };
  
  const level = levels.find(
    (level: any) => value >= level.range[0] && value <= level.range[1]
  );
  return level || levels[levels.length - 1];
};

// Information about each pollutant for the tooltip
const POLLUTANT_INFO = {
  pm25: {
    name: "PM2.5",
    fullName: "Fine Particulate Matter",
    description: "Tiny particles with a diameter of 2.5 micrometers or less. These can penetrate deep into the lungs and even enter the bloodstream.",
    sources: "Combustion (vehicles, power plants), wood burning, industrial processes",
    healthEffects: "Respiratory and cardiovascular issues, aggravated asthma, decreased lung function, premature death in people with heart or lung disease"
  },
  pm10: {
    name: "PM10",
    fullName: "Coarse Particulate Matter",
    description: "Particles with a diameter between 2.5 and 10 micrometers. These can enter the lungs but are filtered by the nose and throat.",
    sources: "Dust, pollen, mold, construction, industrial processes",
    healthEffects: "Respiratory issues, aggravated asthma, decreased lung function"
  },
  no2: {
    name: "NO₂",
    fullName: "Nitrogen Dioxide",
    description: "A reddish-brown gas with a pungent odor that is a major component of smog.",
    sources: "Combustion engines, power plants, industrial processes",
    healthEffects: "Respiratory irritation, airway inflammation, increased susceptibility to respiratory infections"
  },
  o3: {
    name: "O₃",
    fullName: "Ozone",
    description: "A colorless gas that exists naturally in the upper atmosphere but is harmful at ground level.",
    sources: "Created by chemical reactions between oxides of nitrogen and volatile organic compounds in sunlight",
    healthEffects: "Throat irritation, congestion, chest pain, inflammation of lung tissue, worsening of respiratory diseases"
  },
  co: {
    name: "CO",
    fullName: "Carbon Monoxide",
    description: "An odorless, colorless gas that is highly toxic at high levels.",
    sources: "Vehicle exhaust, combustion processes, indoor heating, wildfires",
    healthEffects: "Reduced oxygen delivery to body organs, headaches, dizziness, confusion, unconsciousness, death at high levels"
  },
  so2: {
    name: "SO₂",
    fullName: "Sulfur Dioxide",
    description: "A colorless gas with a sharp, pungent odor.",
    sources: "Fossil fuel combustion, industrial processes, volcanic activity",
    healthEffects: "Respiratory irritation, bronchoconstriction, aggravated asthma"
  },
  nh3: {
    name: "NH₃",
    fullName: "Ammonia",
    description: "A colorless gas with a pungent odor.",
    sources: "Agricultural activities, animal waste, fertilizers, industrial processes",
    healthEffects: "Respiratory irritation, eye irritation, possible respiratory issues at high concentrations"
  }
};

interface PollutantsDisplayProps {
  pollutants: {
    pm25: number;
    pm10: number;
    no2: number;
    o3: number;
    co: number;
    so2: number;
    nh3: number;
  };
  className?: string;
}

const PollutantsDisplay: React.FC<PollutantsDisplayProps> = ({ pollutants, className }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  // Check if we have valid pollutant data
  const hasPollutantData = pollutants && 
    (pollutants.pm25 > 0 || pollutants.pm10 > 0 || pollutants.no2 > 0 || 
     pollutants.o3 > 0 || pollutants.co > 0 || pollutants.so2 > 0 || pollutants.nh3 > 0);
  
  // Format and prepare data for display
  const pollutantData = [
    { name: "PM2.5", value: pollutants.pm25, unit: "µg/m³", id: "pm25" },
    { name: "PM10", value: pollutants.pm10, unit: "µg/m³", id: "pm10" },
    { name: "NO₂", value: pollutants.no2, unit: "ppb", id: "no2" },
    { name: "O₃", value: pollutants.o3, unit: "ppb", id: "o3" },
    { name: "CO", value: pollutants.co, unit: "ppm", id: "co" },
    { name: "SO₂", value: pollutants.so2, unit: "ppb", id: "so2" },
    { name: "NH₃", value: pollutants.nh3, unit: "ppb", id: "nh3" }
  ];
  
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle>Pollutant Levels</CardTitle>
        <CollapsibleTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-9 p-0" 
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            <span className="sr-only">Toggle pollutant details</span>
          </Button>
        </CollapsibleTrigger>
      </CardHeader>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleContent>
          <CardContent>
            {!hasPollutantData ? (
              <div className="text-center py-6">
                <HelpCircle className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">
                  No pollutant data available. This could be because:
                </p>
                <ul className="text-sm text-muted-foreground list-disc list-inside mt-2">
                  <li>The API or dataset doesn't include detailed pollutant information</li>
                  <li>The selected data source doesn't provide pollutant breakdown</li>
                  <li>Try using a different data source or city for more detailed information</li>
                </ul>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pollutant</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Health Impact</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pollutantData
                    .filter(pollutant => pollutant.value > 0)
                    .map((pollutant) => {
                      const level = getPollutantLevel(pollutant.id, pollutant.value);
                      const info = (POLLUTANT_INFO as any)[pollutant.id];
                      
                      return (
                        <TableRow key={pollutant.id}>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <span className="font-medium">{pollutant.name}</span>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                                  </TooltipTrigger>
                                  <TooltipContent className="w-80 p-4">
                                    <div className="space-y-2">
                                      <h4 className="font-semibold">{info.fullName} ({info.name})</h4>
                                      <p className="text-sm">{info.description}</p>
                                      <div>
                                        <h5 className="font-semibold text-sm">Sources:</h5>
                                        <p className="text-xs">{info.sources}</p>
                                      </div>
                                      <div>
                                        <h5 className="font-semibold text-sm">Health Effects:</h5>
                                        <p className="text-xs">{info.healthEffects}</p>
                                      </div>
                                      <div>
                                        <h5 className="font-semibold text-sm">Measurement Unit:</h5>
                                        <p className="text-xs">{pollutant.unit}: {pollutant.id === "pm25" || pollutant.id === "pm10" ? 
                                          "Micrograms per cubic meter - measures the mass of particles in the air" : 
                                          pollutant.id === "co" ? 
                                          "Parts per million - indicates the concentration of the gas in the air" :
                                          "Parts per billion - indicates the concentration of the gas in the air"}</p>
                                      </div>
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span>{pollutant.value.toFixed(1)}</span>
                              <span className="text-xs text-muted-foreground">{pollutant.unit}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <div className={`w-3 h-3 rounded-full ${level.color}`} />
                              <div>
                                <div className="text-sm font-medium">{level.level}</div>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div className="text-xs text-muted-foreground underline cursor-help">
                                        Health implications
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent className="w-72">
                                      <p className="text-sm">{level.description}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

export default PollutantsDisplay;
