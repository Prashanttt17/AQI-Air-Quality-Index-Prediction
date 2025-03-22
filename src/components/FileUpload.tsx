
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { Upload, FileUp } from "lucide-react";

interface FileUploadProps {
  onDataLoaded: (data: any[]) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onDataLoaded }) => {
  const [isUploading, setIsUploading] = useState(false);
  
  const parseCSV = (text: string) => {
    const lines = text.split('\n');
    if (lines.length <= 1) {
      return [];
    }
    
    const headers = lines[0].split(',').map(header => header.trim());
    
    // Extract the most likely column candidates for each data type
    let dateColumn = -1;
    let cityColumn = -1;
    let aqiColumn = -1;
    let pollutantColumns: { [key: string]: number } = {};
    
    // Find the most appropriate columns
    headers.forEach((header, index) => {
      const headerLower = header.toLowerCase();
      
      if (dateColumn === -1 && (headerLower.includes('date') || headerLower.includes('time'))) {
        dateColumn = index;
      }
      
      if (cityColumn === -1 && (headerLower.includes('city') || headerLower.includes('location') || headerLower.includes('place'))) {
        cityColumn = index;
      }
      
      if (aqiColumn === -1 && (headerLower === 'aqi' || headerLower.includes('air quality') || headerLower.includes('index'))) {
        aqiColumn = index;
      }
      
      // Check for pollutant columns
      if (headerLower.includes('pm2.5') || headerLower.includes('pm25')) {
        pollutantColumns['pm25'] = index;
      } else if (headerLower.includes('pm10')) {
        pollutantColumns['pm10'] = index;
      } else if (headerLower.includes('no2')) {
        pollutantColumns['no2'] = index;
      } else if (headerLower.includes('o3') || headerLower === 'ozone') {
        pollutantColumns['o3'] = index;
      } else if (headerLower.includes('co')) {
        pollutantColumns['co'] = index;
      } else if (headerLower.includes('so2')) {
        pollutantColumns['so2'] = index;
      } else if (headerLower.includes('nh3') || headerLower.includes('ammonia')) {
        pollutantColumns['nh3'] = index;
      }
    });
    
    // If no specific columns were identified, make educated guesses
    if (dateColumn === -1) dateColumn = 0; // Assume first column is date
    if (cityColumn === -1) cityColumn = 1; // Assume second column is city/location
    if (aqiColumn === -1) {
      // Look for a numeric column that could be AQI (avoid pollutant columns)
      for (let i = 0; i < headers.length; i++) {
        if (i !== dateColumn && i !== cityColumn && !Object.values(pollutantColumns).includes(i)) {
          // Check first few rows to ensure it contains numeric values
          let isNumeric = true;
          for (let j = 1; j < Math.min(5, lines.length); j++) {
            const values = lines[j].split(',');
            if (values.length > i && isNaN(parseFloat(values[i]))) {
              isNumeric = false;
              break;
            }
          }
          if (isNumeric) {
            aqiColumn = i;
            break;
          }
        }
      }
    }
    
    // If still no AQI column, use the third column or another available column
    if (aqiColumn === -1) {
      aqiColumn = 2;
      if (aqiColumn === dateColumn || aqiColumn === cityColumn) {
        aqiColumn = 3;
      }
    }
    
    console.log(`Detected columns - Date: ${dateColumn}, City: ${cityColumn}, AQI: ${aqiColumn}, Pollutants:`, pollutantColumns);
    
    const data = [];
    const cities = new Set<string>();
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const values = line.split(',').map(value => value.trim());
      if (values.length <= Math.max(dateColumn, cityColumn, aqiColumn)) {
        continue; // Skip lines that don't have enough columns
      }
      
      const entry: Record<string, any> = {};
      
      // Process date
      try {
        const dateStr = values[dateColumn];
        const dateObj = new Date(dateStr);
        if (!isNaN(dateObj.getTime())) {
          entry.date = dateObj.toISOString().split('T')[0];
        } else {
          // Attempt alternative date formats
          const parts = dateStr.split(/[-/.]/);
          if (parts.length === 3) {
            // Try different combinations of day/month/year
            const possibleFormats = [
              new Date(`${parts[2]}-${parts[1]}-${parts[0]}`), // DD-MM-YYYY
              new Date(`${parts[2]}-${parts[0]}-${parts[1]}`), // MM-DD-YYYY
              new Date(`${parts[0]}-${parts[1]}-${parts[2]}`), // YYYY-MM-DD
            ];
            
            for (const date of possibleFormats) {
              if (!isNaN(date.getTime())) {
                entry.date = date.toISOString().split('T')[0];
                break;
              }
            }
            
            // If still no valid date, use current date
            if (!entry.date) {
              entry.date = new Date().toISOString().split('T')[0];
            }
          } else {
            entry.date = new Date().toISOString().split('T')[0];
          }
        }
      } catch (e) {
        console.error("Date parsing error:", e);
        entry.date = new Date().toISOString().split('T')[0];
      }
      
      // Process city
      entry.city = values[cityColumn] || 'Unknown City';
      cities.add(entry.city);
      
      // Process AQI
      const aqiValue = parseFloat(values[aqiColumn]);
      entry.aqi = isNaN(aqiValue) ? 50 : aqiValue; // Default to moderate AQI if invalid
      
      // Process pollutants
      const pollutants: Record<string, number> = {};
      Object.entries(pollutantColumns).forEach(([pollutant, index]) => {
        if (values.length > index) {
          const value = parseFloat(values[index]);
          pollutants[pollutant] = isNaN(value) ? 0 : value;
        } else {
          pollutants[pollutant] = 0;
        }
      });
      
      // If no pollutants were found but there are extra numeric columns, try to use them as pollutants
      if (Object.keys(pollutants).length === 0) {
        const standardPollutants = ['pm25', 'pm10', 'no2', 'o3', 'co', 'so2', 'nh3'];
        let pollutantIdx = 0;
        
        for (let j = 0; j < values.length; j++) {
          if (j !== dateColumn && j !== cityColumn && j !== aqiColumn && pollutantIdx < standardPollutants.length) {
            const value = parseFloat(values[j]);
            if (!isNaN(value)) {
              pollutants[standardPollutants[pollutantIdx]] = value;
              pollutantIdx++;
            }
          }
        }
      }
      
      if (Object.keys(pollutants).length > 0) {
        entry.pollutants = pollutants;
      }
      
      data.push(entry);
    }
    
    console.log(`Parsed ${data.length} entries with ${cities.size} cities`);
    return data;
  };
  
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setIsUploading(true);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const data = parseCSV(text);
        
        if (data.length === 0) {
          toast({
            title: "Error",
            description: "No valid data found in the file.",
            variant: "destructive"
          });
          setIsUploading(false);
          return;
        }
        
        // Make sure all entries have required fields
        const validData = data.filter(item => {
          return item.date && item.city && item.aqi !== undefined && 
                 !isNaN(item.aqi) && typeof item.aqi === 'number';
        });
        
        if (validData.length === 0) {
          toast({
            title: "Error",
            description: "No valid data entries found in the file.",
            variant: "destructive"
          });
          setIsUploading(false);
          return;
        }
        
        onDataLoaded(validData);
        toast({
          title: "Success",
          description: `Loaded ${validData.length} data points across ${new Set(validData.map(item => item.city)).size} locations.`,
        });
      } catch (error) {
        console.error("Parsing error:", error);
        toast({
          title: "Error",
          description: "Failed to parse the file. Please check the format.",
          variant: "destructive"
        });
      } finally {
        setIsUploading(false);
      }
    };
    
    reader.onerror = () => {
      toast({
        title: "Error",
        description: "Failed to read the file.",
        variant: "destructive"
      });
      setIsUploading(false);
    };
    
    reader.readAsText(file);
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Upload AQI Data</CardTitle>
        <CardDescription>
          Upload a CSV file with your AQI data in any format
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center">
          <FileUp className="h-8 w-8 text-gray-400 mb-2" />
          <p className="text-sm text-gray-500 mb-4">The system will automatically detect columns for date, location, AQI and pollutants</p>
          <Input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            disabled={isUploading}
            className="max-w-xs"
          />
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={() => document.querySelector<HTMLInputElement>('input[type="file"]')?.click()}
          disabled={isUploading}
        >
          <Upload className="h-4 w-4 mr-2" />
          Select File
        </Button>
      </CardFooter>
    </Card>
  );
};

export default FileUpload;
