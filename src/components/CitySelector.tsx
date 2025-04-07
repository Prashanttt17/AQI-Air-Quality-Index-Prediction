import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin } from "lucide-react";
import { 
  Select, 
  SelectContent, 
  SelectGroup,
  SelectItem, 
  SelectLabel,
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { extractBaseCity } from '@/utils/api-service';

const INDIAN_CITIES_BY_STATE: Record<string, string[]> = {
  "Andaman and Nicobar Islands": ["Port Blair"],
  "Andhra Pradesh": ["Visakhapatnam", "Vijayawada", "Guntur", "Nellore"],
  "Assam": ["Guwahati", "Silchar", "Dibrugarh"],
  "Bihar": ["Patna", "Gaya", "Muzaffarpur"],
  "Chandigarh": ["Chandigarh"],
  "Chhattisgarh": ["Raipur", "Bhilai", "Bilaspur"],
  "Dadra and Nagar Haveli": ["Silvassa"],
  "Daman and Diu": ["Daman", "Diu"],
  "Delhi": ["Delhi", "New Delhi"],
  "Goa": ["Panaji", "Margao", "Vasco da Gama"],
  "Gujarat": ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Jamnagar", "Bhavnagar"],
  "Haryana": ["Gurugram", "Faridabad", "Panipat", "Ambala"],
  "Himachal Pradesh": ["Shimla", "Dharamshala", "Manali"],
  "Jammu and Kashmir": ["Srinagar", "Jammu", "Leh"],
  "Jharkhand": ["Ranchi", "Jamshedpur", "Dhanbad"],
  "Karnataka": ["Bangalore", "Mysore", "Hubli–Dharwad", "Mangalore"],
  "Kerala": ["Kochi", "Thiruvananthapuram", "Kozhikode", "Thrissur"],
  "Lakshadweep": ["Kavaratti"],
  "Madhya Pradesh": ["Indore", "Bhopal", "Jabalpur", "Gwalior"],
  "Maharashtra": ["Mumbai", "Pune", "Nagpur", "Thane", "Nashik", "Aurangabad", "Solapur", "Jalgaon", "Kolhapur"],
  "Manipur": ["Imphal"],
  "Meghalaya": ["Shillong"],
  "Mizoram": ["Aizawl"],
  "Nagaland": ["Kohima", "Dimapur"],
  "Odisha": ["Bhubaneswar", "Cuttack", "Rourkela"],
  "Puducherry": ["Puducherry"],
  "Punjab": ["Ludhiana", "Amritsar", "Jalandhar"],
  "Rajasthan": ["Jaipur", "Jodhpur", "Udaipur", "Kota", "Ajmer", "Bikaner"],
  "Sikkim": ["Gangtok"],
  "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem"],
  "Telangana": ["Hyderabad", "Warangal"],
  "Tripura": ["Agartala"],
  "Uttar Pradesh": ["Lucknow", "Kanpur", "Agra", "Varanasi", "Meerut", "Noida", "Ghaziabad", "Aligarh", "Moradabad", "Gorakhpur", "Saharanpur", "Bareilly", "Firozabad"],
  "Uttarakhand": ["Dehradun"],
  "West Bengal": ["Kolkata", "Howrah", "Durgapur", "Asansol", "Siliguri"]
};

const ALL_INDIAN_CITIES = Object.values(INDIAN_CITIES_BY_STATE).flat().sort();

interface CitySelectorProps {
  cities: string[];
  selectedCity: string;
  onCityChange: (city: string) => void;
  className?: string;
  selectedState: string;
  onStateChange: (state: string) => void;
}

const CitySelector: React.FC<CitySelectorProps> = ({ 
  cities, 
  selectedCity, 
  onCityChange,
  className,
  selectedState,
  onStateChange
}) => {
  const allCities = React.useMemo(() => {
    const combinedCities = new Set([...ALL_INDIAN_CITIES, ...cities]);
    return Array.from(combinedCities).sort();
  }, [cities]);
  
  const findStateForCity = (city: string): string => {
    if (city.includes(',')) {
      const parts = city.split(',');
      const baseCity = parts[parts.length - 1]?.trim() || city;
      for (const [state, stateCities] of Object.entries(INDIAN_CITIES_BY_STATE)) {
        if (stateCities.some(cityName => baseCity.includes(cityName))) {
          return state;
        }
      }
    }
    for (const [state, stateCities] of Object.entries(INDIAN_CITIES_BY_STATE)) {
      if (stateCities.some(cityName => city.includes(cityName))) {
        return state;
      }
    }
    return "Other";
  };

  const extractMainCity = (locationString: string): string => {
    if (!locationString || locationString === "Select City") return locationString;
    if (locationString.includes(',')) {
      return extractBaseCity(locationString);
    }
    return locationString;
  };

  const getDisplayCityName = (cityName: string): string => {
    if (cityName === "Select City") return cityName;
    if (cityName.includes(',')) {
      const baseCity = extractMainCity(cityName);
      if (baseCity && baseCity !== cityName && ALL_INDIAN_CITIES.includes(baseCity)) {
        return `${cityName} (${baseCity})`;
      }
    }
    return cityName;
  };

  const citiesByState = React.useMemo(() => {
    const grouped: Record<string, string[]> = {"All States": ["Select City"]};
    allCities.forEach(city => {
      const state = findStateForCity(city);
      if (!grouped[state]) {
        grouped[state] = [];
      }
      grouped[state].push(city);
    });
    Object.keys(grouped).forEach(state => {
      grouped[state].sort();
    });
    return grouped;
  }, [allCities]);
  
  const statesList = React.useMemo(() => {
    return ["All States", ...Object.keys(INDIAN_CITIES_BY_STATE)].sort();
  }, []);
  
  const filteredCities = React.useMemo(() => {
    if (selectedState === "All States") {
      return ["Select City", ...allCities];
    }
    return ["Select City", ...(citiesByState[selectedState] || [])];
  }, [selectedState, citiesByState, allCities]);

  useEffect(() => {
    if (selectedCity !== "Select City") {
      const cityState = findStateForCity(selectedCity);
      if (cityState !== selectedState && cityState !== "Other") {
        if (selectedState !== cityState) {
          onStateChange(cityState);
        }
      }
    }
  }, [selectedCity]);

  return (
    <Card className={`h-full flex flex-col ${className}`}>
      <CardHeader className="flex-shrink-0 pb-3 pt-4">
        <CardTitle className="text-lg flex items-center">
          <MapPin className="h-5 w-5 mr-2" /> 
          Location
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 px-4 pb-4 pt-0 overflow-hidden flex flex-col">
        <div className="space-y-4 flex-1 flex flex-col">
          <div className="flex-shrink-0">
            <label className="text-sm font-medium mb-1.5 block text-muted-foreground">
              State/Territory
            </label>
            <Select 
              value={selectedState} 
              onValueChange={onStateChange}
            >
              <SelectTrigger className="w-full h-9 text-sm">
                <SelectValue placeholder="Select state" />
              </SelectTrigger>
              <SelectContent className="max-h-[250px]">
                <ScrollArea className="h-[250px]">
                  {statesList.map(state => (
                    <SelectItem key={state} value={state} className="text-sm">
                      {state}
                    </SelectItem>
                  ))}
                </ScrollArea>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex-1 min-h-0 flex flex-col">
            <label className="text-sm font-medium mb-1.5 block text-muted-foreground flex-shrink-0">
              City
            </label>
            <div className="flex-1 min-h-0">
              <Select 
                value={selectedCity} 
                onValueChange={onCityChange}
              >
                <SelectTrigger className="w-full h-9 text-sm">
                  <SelectValue placeholder="Select city">
                    {selectedCity !== "Select City" ? getDisplayCityName(selectedCity) : "Select city"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="max-h-[200px]">
                  <ScrollArea className="h-[200px]">
                    {filteredCities.map(city => (
                      <SelectItem key={city} value={city} className="text-sm">
                        {getDisplayCityName(city)}
                      </SelectItem>
                    ))}
                  </ScrollArea>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CitySelector;
