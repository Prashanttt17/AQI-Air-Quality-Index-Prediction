
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

// Updated organizational structure: cities grouped by states in alphabetical order
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

// Flatten the cities array for backward compatibility
const ALL_INDIAN_CITIES = Object.values(INDIAN_CITIES_BY_STATE).flat().sort();

interface CitySelectorProps {
  cities: string[];
  selectedCity: string;
  onCityChange: (city: string) => void;
  className?: string;
  // Add these new props for state persistence
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
  // Combine both predefined cities and API-provided cities
  const allCities = React.useMemo(() => {
    // Create a set from our ALL_INDIAN_CITIES list and API-provided cities
    const combinedCities = new Set([...ALL_INDIAN_CITIES, ...cities]);
    
    // Return sorted array
    return Array.from(combinedCities).sort();
  }, [cities]);
  
  // Find which state a city belongs to
  const findStateForCity = (city: string): string => {
    for (const [state, stateCities] of Object.entries(INDIAN_CITIES_BY_STATE)) {
      if (stateCities.includes(city)) {
        return state;
      }
    }
    return "Other";
  };

  // Group cities by state for display
  const citiesByState = React.useMemo(() => {
    const grouped: Record<string, string[]> = {"All States": ["Select City"]};
    
    // Merge API-provided cities with our predefined list
    allCities.forEach(city => {
      const state = findStateForCity(city);
      if (!grouped[state]) {
        grouped[state] = [];
      }
      grouped[state].push(city);
    });
    
    // Sort cities within each state
    Object.keys(grouped).forEach(state => {
      grouped[state].sort();
    });
    
    return grouped;
  }, [allCities]);
  
  // Get list of all states in alphabetical order
  const statesList = React.useMemo(() => {
    return ["All States", ...Object.keys(INDIAN_CITIES_BY_STATE)].sort();
  }, []);
  
  // Cities to display based on selected state
  const filteredCities = React.useMemo(() => {
    if (selectedState === "All States") {
      return ["Select City", ...allCities];
    }
    return ["Select City", ...(citiesByState[selectedState] || [])];
  }, [selectedState, citiesByState, allCities]);

  // Set appropriate city when state changes
  useEffect(() => {
    if (selectedCity !== "Select City") {
      const cityState = findStateForCity(selectedCity);
      if (cityState !== selectedState && cityState !== "Other") {
        // If city belongs to a different state, update state selection
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
          {/* State selection dropdown */}
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
          
          {/* City selection dropdown */}
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
                  <SelectValue placeholder="Select city" />
                </SelectTrigger>
                <SelectContent className="max-h-[200px]">
                  <ScrollArea className="h-[200px]">
                    {filteredCities.map(city => (
                      <SelectItem key={city} value={city} className="text-sm">
                        {city}
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
