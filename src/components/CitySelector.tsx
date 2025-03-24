
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// List of major Indian cities for the dropdown (removed foreign cities)
const INDIAN_CITIES = [
  "Delhi", "Mumbai", "Kolkata", "Chennai", "Bangalore", 
  "Hyderabad", "Ahmedabad", "Pune", "Jaipur", "Lucknow",
  "Kanpur", "Nagpur", "Indore", "Thane", "Bhopal",
  "Visakhapatnam", "Patna", "Vadodara", "Ghaziabad", "Ludhiana",
  "Agra", "Nashik", "Faridabad", "Meerut", "Rajkot",
  "Varanasi", "Srinagar", "Aurangabad", "Dhanbad", "Amritsar",
  "Allahabad", "Ranchi", "Howrah", "Coimbatore", "Jabalpur",
  "Gwalior", "Vijayawada", "Jodhpur", "Madurai", "Raipur",
  "Kota", "Chandigarh", "Guwahati", "Solapur", "Hubli–Dharwad",
  "Mysore", "Tiruchirappalli", "Bareilly", "Aligarh", "Tiruppur",
  "Gurugram", "Moradabad", "Jalandhar", "Bhubaneswar", "Salem",
  "Warangal", "Mira-Bhayandar", "Jalgaon", "Guntur", "Bhiwandi",
  "Saharanpur", "Gorakhpur", "Bikaner", "Amravati", "Noida",
  "Jamshedpur", "Bhilai", "Cuttack", "Firozabad", "Kochi",
  "Nellore", "Bhavnagar", "Dehradun", "Durgapur", "Asansol",
  "Rourkela", "Nanded", "Kolhapur", "Ajmer", "Akola",
  "Gulbarga", "Jamnagar", "Ujjain", "Loni", "Siliguri",
  "Jhansi", "Ulhasnagar", "Jammu", "Sangli-Miraj & Kupwad", "Mangalore"
].sort();

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
  // Filter cities to only include Indian cities from our predefined list
  const filteredCities = React.useMemo(() => {
    // Create a set from our INDIAN_CITIES list
    const indianCitiesSet = new Set(INDIAN_CITIES);
    
    // Filter the provided cities to only include those in our Indian cities list
    const validCities = cities.filter(city => indianCitiesSet.has(city));
    
    // Combine with our standard list and remove duplicates
    const combinedCities = new Set([...validCities, ...INDIAN_CITIES]);
    
    // Return sorted array with "Select City" at the beginning
    return ["Select City", ...Array.from(combinedCities).sort()];
  }, [cities]);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg flex items-center">
          <MapPin className="h-5 w-5 mr-2" /> 
          Location
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {/* Dropdown select for Indian cities only */}
          <Select 
            value={selectedCity} 
            onValueChange={onCityChange}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select city" />
            </SelectTrigger>
            <SelectContent className="max-h-[300px] bg-popover">
              {filteredCities.map(city => (
                <SelectItem key={city} value={city}>
                  {city}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
};

export default CitySelector;
