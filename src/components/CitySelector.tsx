
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// List of major Indian cities for the dropdown
const INDIAN_CITIES = [
  "New Delhi", "Mumbai", "Kolkata", "Chennai", "Bangalore", 
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
  // Combine provided cities with the standard list of Indian cities
  // Remove duplicates and sort alphabetically
  const allCities = React.useMemo(() => {
    const citySet = new Set(["Select City",...cities, ...INDIAN_CITIES]);
    return Array.from(citySet).sort();
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
          {/* Dropdown select for all cities */}
          <Select 
            value={selectedCity} 
            onValueChange={onCityChange}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select city" />
            </SelectTrigger>
            <SelectContent className="max-h-[300px] bg-popover">
              {allCities.map(city => (
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
