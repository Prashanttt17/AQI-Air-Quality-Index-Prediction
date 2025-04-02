
import React, { useState } from 'react';
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
}

const CitySelector: React.FC<CitySelectorProps> = ({ 
  cities, 
  selectedCity, 
  onCityChange,
  className
}) => {
  // State for selected state filter
  const [selectedState, setSelectedState] = useState<string>("All States");
  
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

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg flex items-center">
          <MapPin className="h-5 w-5 mr-2" /> 
          Location
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* State selection dropdown */}
          <div>
            <label className="text-sm font-medium mb-1 block text-muted-foreground">
              State/Territory
            </label>
            <Select 
              value={selectedState} 
              onValueChange={setSelectedState}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select state" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                <ScrollArea className="h-[300px]">
                  {statesList.map(state => (
                    <SelectItem key={state} value={state}>
                      {state}
                    </SelectItem>
                  ))}
                </ScrollArea>
              </SelectContent>
            </Select>
          </div>
          
          {/* City selection dropdown */}
          <div>
            <label className="text-sm font-medium mb-1 block text-muted-foreground">
              City
            </label>
            <Select 
              value={selectedCity} 
              onValueChange={onCityChange}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select city" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                <ScrollArea className="h-[300px]">
                  {filteredCities.map(city => (
                    <SelectItem key={city} value={city}>
                      {city}
                    </SelectItem>
                  ))}
                </ScrollArea>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CitySelector;
