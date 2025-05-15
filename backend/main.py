
from fastapi import FastAPI, HTTPException, Depends, Query, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional, Dict, Any, Union
import pandas as pd
import numpy as np
import joblib
from datetime import datetime, timedelta
import os
import requests
from pydantic import BaseModel
import json
from time_series_models import TimeSeriesModels

# Models for request/response
class PollutantData(BaseModel):
    pm25: float
    pm10: float
    no2: float
    o3: float
    co: float
    so2: float
    nh3: float

class AQIDataPoint(BaseModel):
    date: str
    city: str
    location: Optional[str] = None
    aqi: float
    pollutants: Optional[PollutantData] = None
    predicted: Optional[bool] = False

class AQIRequest(BaseModel):
    city: str
    state: Optional[str] = None
    country: Optional[str] = "India"
    api_key: str
    platform: str = "airvisual"  # 'airvisual' or 'aqicn'

class PredictionRequest(BaseModel):
    historical_data: List[AQIDataPoint]
    model_name: str = "ARIMA"  # Default to ARIMA if not specified

class CSVDataRequest(BaseModel):
    target_column: str = "aqi"
    date_column: str = "date"
    city_column: Optional[str] = None
    model_name: str = "ARIMA"

# Create FastAPI app
app = FastAPI(title="AQI Prediction API")

# Add CORS middleware to allow requests from frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins (you should restrict this in production)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create upload directory if it doesn't exist
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs("models", exist_ok=True)

# API Endpoints
@app.get("/")
def read_root():
    return {"message": "AQI Prediction API is running"}

@app.post("/api/fetch-aqi", response_model=List[AQIDataPoint])
async def fetch_aqi_data(request: AQIRequest):
    """
    Fetch AQI data from the selected platform (airvisual or aqicn)
    """
    try:
        if request.platform == "airvisual":
            return await fetch_airvisual_data(request.city, request.state, request.country, request.api_key)
        else:
            return await fetch_aqicn_data(request.city, request.api_key)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching AQI data: {str(e)}")

@app.post("/api/predict", response_model=List[AQIDataPoint])
async def predict_aqi(request: PredictionRequest):
    """
    Generate AQI predictions based on historical data and chosen model
    """
    try:
        # Convert input data to pandas DataFrame for processing
        data_points = []
        for point in request.historical_data:
            data_dict = {
                "date": point.date,
                "city": point.city,
                "aqi": point.aqi
            }
            if point.pollutants:
                data_dict.update({
                    "pm25": point.pollutants.pm25,
                    "pm10": point.pollutants.pm10,
                    "no2": point.pollutants.no2,
                    "o3": point.pollutants.o3,
                    "co": point.pollutants.co,
                    "so2": point.pollutants.so2,
                    "nh3": point.pollutants.nh3
                })
            data_points.append(data_dict)
            
        df = pd.DataFrame(data_points)
        
        # Sort by date
        if not df.empty:
            # Convert all date strings to pandas datetime format
            df['date'] = pd.to_datetime(df['date'])
            df = df.sort_values('date')
        
        # Make predictions using appropriate model
        predictions = generate_predictions(df, request.model_name)
        
        # Convert predictions back to AQIDataPoint format
        result = []
        for index, row in predictions.iterrows():
            pollutants = None
            if all(col in row.index for col in ["pm25", "pm10", "no2", "o3", "co", "so2", "nh3"]):
                pollutants = PollutantData(
                    pm25=float(row["pm25"]),
                    pm10=float(row["pm10"]),
                    no2=float(row["no2"]),
                    o3=float(row["o3"]),
                    co=float(row["co"]),
                    so2=float(row["so2"]),
                    nh3=float(row["nh3"])
                )
            
            date_value = row["date"]
            # Ensure date is in string format YYYY-MM-DD
            if isinstance(date_value, (pd.Timestamp, datetime)):
                formatted_date = date_value.strftime("%Y-%m-%d")
            else:
                formatted_date = str(date_value)
            
            result.append(AQIDataPoint(
                date=formatted_date,
                city=row["city"],
                location=row["location"] if "location" in row else None,
                aqi=float(row["aqi"]),
                pollutants=pollutants,
                predicted=bool(row["predicted"])
            ))
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating predictions: {str(e)}")

@app.post("/api/predict-csv", response_model=List[AQIDataPoint])
async def predict_from_csv(
    file: UploadFile = File(...),
    target_column: str = Query("aqi"),
    date_column: str = Query("date"),
    city_column: Optional[str] = Query(None),
    model_name: str = Query("ARIMA")
):
    """
    Generate predictions from uploaded CSV data
    """
    try:
        # Save the uploaded file
        file_path = os.path.join(UPLOAD_DIR, file.filename)
        with open(file_path, "wb") as f:
            content = await file.read()
            f.write(content)
        
        # Process the CSV file
        df = TimeSeriesModels.process_csv_data(file_path, target_column, date_column)
        
        if df is None:
            raise HTTPException(status_code=400, detail="Failed to process CSV file")
        
        # Add city information if provided
        if city_column and city_column in df.columns:
            city = df[city_column].iloc[0]
        else:
            city = "Unknown"
            df['city'] = city
        
        # Generate predictions using the specified model
        predictions_df = generate_predictions_from_csv(df, model_name, target_column)
        
        # Convert to AQIDataPoint format
        result = []
        for _, row in predictions_df.iterrows():
            date_value = row["date"]
            # Ensure date is in string format YYYY-MM-DD
            if isinstance(date_value, (pd.Timestamp, datetime)):
                formatted_date = date_value.strftime("%Y-%m-%d")
            else:
                formatted_date = str(date_value)
                
            result.append(AQIDataPoint(
                date=formatted_date,
                city=row["city"] if "city" in row else city,
                aqi=float(row[target_column]),
                predicted=bool(row["predicted"])
            ))
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing CSV file: {str(e)}")

@app.get("/api/models")
async def list_available_models():
    """
    List all available prediction models
    """
    basic_models = ["ARIMA", "SARIMAX", "RandomForest", "LSTM"]
    
    # Check for custom trained models
    model_files = [f.replace("_model.pkl", "") for f in os.listdir("models") if f.endswith("_model.pkl")]
    
    # Combine lists and remove duplicates
    all_models = list(set(basic_models + model_files))
    
    return {"models": all_models}

# Helper functions for data fetching and predictions
async def fetch_airvisual_data(city: str, state: Optional[str], country: str, api_key: str) -> List[AQIDataPoint]:
    """
    Fetch data from AirVisual API
    """
    # ... keep existing code (function to fetch data from AirVisual API)

async def fetch_aqicn_data(city: str, api_key: str) -> List[AQIDataPoint]:
    """
    Fetch data from AQICN API
    """
    # ... keep existing code (function to fetch data from AQICN API)

def generate_predictions(df: pd.DataFrame, model_name: str) -> pd.DataFrame:
    """
    Generate AQI predictions using the specified model
    """
    if df.empty:
        return pd.DataFrame(columns=["date", "city", "location", "aqi", "predicted"])
    
    # Extract basic info that we'll need for predictions
    city = df.iloc[-1]["city"] 
    location = df.iloc[-1]["location"] if "location" in df.columns else None
    
    # Determine if we should use advanced time series models
    use_time_series = model_name.upper() in ["ARIMA", "SARIMAX"]
    
    # Get the latest actual data point
    current_date = datetime.now().date()
    
    # Find the latest non-predicted data point
    actual_data = df[~df.get("predicted", False)].copy() if "predicted" in df.columns else df.copy()
    actual_data = actual_data.sort_values("date", ascending=False)
    
    current_aqi_point = None
    if not actual_data.empty:
        current_aqi_point = actual_data.iloc[0].to_dict()
    
    # Prepare for predictions
    forecast_df = pd.DataFrame()
    
    try:
        # Generate 7-day forecast
        forecast_dates = [current_date + timedelta(days=i) for i in range(7)]
        
        # Use time series models for ARIMA and SARIMAX
        if use_time_series:
            # Prepare data for time series modeling
            ts_df = df[["date", "aqi"]].copy()
            # No need to convert to datetime again as we already did this above
            ts_df = ts_df.set_index('date')
            
            # Generate forecasts
            if model_name.upper() == "ARIMA":
                forecast = TimeSeriesModels.forecast_with_model("arima", df, 7)
            elif model_name.upper() == "SARIMAX":
                forecast = TimeSeriesModels.forecast_with_model("sarimax", df, 7)
            else:
                forecast = TimeSeriesModels.forecast_with_model("arima", df, 7)  # Default
                
            # Create forecast DataFrame with city and predicted flag
            forecast_df = forecast.copy()
            forecast_df['city'] = city
            forecast_df['predicted'] = True
            
            if location:
                forecast_df['location'] = location
                
            # Ensure the first day's AQI matches current if available
            if current_aqi_point and len(forecast_df) > 0:
                # The first prediction will be for tomorrow, so we insert today's actual value
                today_row = {
                    'date': current_date,
                    'aqi': current_aqi_point['aqi'],
                    'city': city,
                    'predicted': False
                }
                if location:
                    today_row['location'] = location
                
                # Add today's row and resort
                forecast_df = pd.concat([forecast_df, pd.DataFrame([today_row])])
                forecast_df = forecast_df.sort_values('date')
            
        else:
            # For other models, use the existing simulation-based approach
            # ... keep existing code (simulation-based prediction logic)
            
            # Start with today's date
            forecast_df = pd.DataFrame({
                "date": forecast_dates,
                "city": city,
                "predicted": True
            })
            
            if location:
                forecast_df["location"] = location
            
            # Use a different forecasting approach based on the model name
            last_aqi = df.iloc[-1]["aqi"] if not df.empty else 100
            aqi_values = []
            
            if model_name == "RandomForest":
                # Simulate Random Forest-like behavior with step-wise predictions
                for i in range(7):
                    if i == 0 and current_aqi_point:
                        # For today, use the actual current AQI
                        aqi_values.append(current_aqi_point["aqi"])
                    else:
                        # Each step is a bit less certain (increasing randomness)
                        prev = aqi_values[-1] if aqi_values else last_aqi
                        random_component = np.random.normal(0, 2 + i)
                        aqi_values.append(max(0, prev * 0.9 + random_component))
                        
            elif model_name == "LSTM":
                # Simulate LSTM-like behavior with trend and seasonality
                for i in range(7):
                    if i == 0 and current_aqi_point:
                        # For today, use the actual current AQI
                        aqi_values.append(current_aqi_point["aqi"])
                    else:
                        # Simulate trend + seasonality + residual
                        trend = -2  # Slight downward trend
                        seasonality = 5 * np.sin(i/7 * 2 * np.pi)  # Weekly cycle
                        residual = np.random.normal(0, 3)
                        
                        prev = aqi_values[-1] if aqi_values else last_aqi
                        aqi_values.append(max(0, prev + trend + seasonality + residual))
            else:
                # Simple linear trend with noise
                for i in range(7):
                    if i == 0 and current_aqi_point:
                        # For today, use the actual current AQI
                        aqi_values.append(current_aqi_point["aqi"])
                    else:
                        base = last_aqi - i * 2  # Linear decrease
                        noise = np.random.normal(0, 5)
                        aqi_values.append(max(0, base + noise))
            
            # Round AQI values
            forecast_df["aqi"] = [round(val) for val in aqi_values]
        
        # Generate pollutant predictions
        if "pollutants" in df.columns or any(col in df.columns for col in ["pm25", "pm10", "no2", "o3", "co", "so2", "nh3"]):
            # Get the latest pollutant values as base
            latest_pollutants = {}
            for pollutant in ["pm25", "pm10", "no2", "o3", "co", "so2", "nh3"]:
                if pollutant in df.columns:
                    latest_pollutants[pollutant] = df.iloc[-1].get(pollutant, 0)
                else:
                    latest_pollutants[pollutant] = 0
            
            # Add predictions for each pollutant
            for pollutant in ["pm25", "pm10", "no2", "o3", "co", "so2", "nh3"]:
                base_val = latest_pollutants[pollutant]
                pollutant_vals = []
                
                for i in range(len(forecast_df)):
                    if forecast_df.iloc[i].get('predicted', True) == False and pollutant in current_aqi_point:
                        # For actual data points, use actual value if available
                        pollutant_vals.append(current_aqi_point[pollutant])
                    else:
                        # Generate reasonable prediction based on base value and AQI trend
                        aqi_ratio = forecast_df.iloc[i]['aqi'] / last_aqi if last_aqi > 0 else 1
                        predicted_val = base_val * aqi_ratio * (0.95 + np.random.random() * 0.1)
                        pollutant_vals.append(max(0, round(predicted_val)))
                
                forecast_df[pollutant] = pollutant_vals
        
        # Convert date column to string format if it's not already
        if isinstance(forecast_df["date"].iloc[0], (datetime, pd.Timestamp)):
            forecast_df["date"] = forecast_df["date"].dt.strftime("%Y-%m-%d")
        
    except Exception as e:
        print(f"Error generating predictions: {str(e)}")
        # Return empty dataframe if prediction fails
        return pd.DataFrame(columns=["date", "city", "location", "aqi", "predicted"])
    
    return forecast_df

def generate_predictions_from_csv(df: pd.DataFrame, model_name: str, target_col: str = 'aqi') -> pd.DataFrame:
    """
    Generate predictions from CSV data
    """
    # Check if we have the minimum required columns
    required_cols = ['date', target_col]
    for col in required_cols:
        if col not in df.columns:
            raise ValueError(f"Required column {col} not found in CSV data")
    
    # Add city column if it doesn't exist
    if 'city' not in df.columns:
        df['city'] = 'Unknown'
    
    # Convert date to datetime
    df['date'] = pd.to_datetime(df['date'])
    
    # Sort by date
    df = df.sort_values('date')
    
    # Generate 7-day forecast using appropriate model
    if model_name.upper() in ["ARIMA", "SARIMAX"]:
        # Use time series model
        forecast = TimeSeriesModels.forecast_with_model(
            model_name.lower(), df, 7, target_col
        )
        
        # Add prediction flag
        forecast['predicted'] = True
        
        # Add city if it exists in original data
        if 'city' in df.columns:
            forecast['city'] = df['city'].iloc[0]
        else:
            forecast['city'] = 'Unknown'
            
        # Combine historical and forecast data
        last_date = df['date'].max()
        historical = df.copy()
        historical['predicted'] = False
        
        # Only keep historical data up to the last date to avoid overlap
        historical = historical[historical['date'] <= last_date]
        
        # Combine and sort
        combined = pd.concat([historical, forecast])
        combined = combined.sort_values('date')
        
        return combined
        
    else:
        # For other models, use a simpler approach
        # Get the last actual value
        last_actual = df[target_col].iloc[-1]
        
        # Generate dates for next 7 days
        last_date = df['date'].max()
        forecast_dates = [last_date + timedelta(days=i+1) for i in range(7)]
        
        # Create forecast DataFrame
        forecast = pd.DataFrame({'date': forecast_dates})
        forecast['city'] = df['city'].iloc[0] if 'city' in df.columns else 'Unknown'
        forecast['predicted'] = True
        
        # Generate values based on model type
        if model_name.upper() == "RANDOMFOREST":
            # Random forest tends to have less extreme predictions
            vals = [max(0, last_actual * (0.95 + 0.1 * np.random.randn()) - i * 2) for i in range(7)]
            forecast[target_col] = [round(val) for val in vals]
        elif model_name.upper() == "LSTM":
            # LSTM can capture patterns better
            vals = []
            prev = last_actual
            for i in range(7):
                # Add cyclical pattern + trend
                val = prev * 0.9 + last_actual * 0.1 + 5 * np.sin(i/7 * 2 * np.pi) - i
                vals.append(max(0, val + np.random.randn() * 5))
                prev = val
            forecast[target_col] = [round(val) for val in vals]
        else:
            # Default simple approach
            vals = [max(0, last_actual - i * 3 + np.random.randn() * 7) for i in range(7)]
            forecast[target_col] = [round(val) for val in vals]
        
        # Combine historical and forecast data
        historical = df.copy()
        historical['predicted'] = False
        combined = pd.concat([historical, forecast])
        combined = combined.sort_values('date')
        
        return combined

# Run the server with: uvicorn main:app --reload
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

