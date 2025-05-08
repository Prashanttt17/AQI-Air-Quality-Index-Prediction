
from fastapi import FastAPI, HTTPException, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional, Dict, Any
import pandas as pd
import numpy as np
import joblib
from datetime import datetime, timedelta
import os
import requests
from pydantic import BaseModel

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

# Load ML models
MODEL_PATH = "models/"
os.makedirs(MODEL_PATH, exist_ok=True)

# Helper function to ensure models are loaded
def load_model(model_name: str):
    model_file = f"{MODEL_PATH}{model_name.lower()}_model.pkl"
    
    # For demonstration, we'll create dummy models if they don't exist
    if not os.path.exists(model_file):
        # In production, you'd want to train and save actual models
        # For now, we'll just create a simple dummy model
        from sklearn.linear_model import LinearRegression
        model = LinearRegression()
        model.fit(np.array([[1], [2], [3]]), np.array([10, 20, 30]))
        joblib.dump(model, model_file)
    
    return joblib.load(model_file)

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
            df['date'] = pd.to_datetime(df['date'])
            df = df.sort_values('date')
        
        # Make predictions
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
            
            result.append(AQIDataPoint(
                date=row["date"].strftime("%Y-%m-%d"),
                city=row["city"],
                location=row["location"] if "location" in row else None,
                aqi=float(row["aqi"]),
                pollutants=pollutants,
                predicted=bool(row["predicted"])
            ))
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating predictions: {str(e)}")

# Helper functions for data fetching and predictions
async def fetch_airvisual_data(city: str, state: Optional[str], country: str, api_key: str) -> List[AQIDataPoint]:
    """
    Fetch data from AirVisual API
    """
    # Define base URL and parameters
    base_url = "https://api.airvisual.com/v2/city"
    params = {
        "city": city,
        "state": state if state and state != "All States" else "Delhi",  # Default to Delhi if not specified
        "country": country,
        "key": api_key
    }
    
    # Make API request
    response = requests.get(base_url, params=params)
    
    if not response.ok:
        raise HTTPException(status_code=response.status_code, 
                           detail=f"AirVisual API error: {response.text}")
    
    data = response.json()
    
    # Process API response
    if data["status"] == "success":
        current_date = datetime.now().strftime("%Y-%m-%d")
        city_name = city
        
        # Create current data point
        current_aqi = data["data"]["current"]["pollution"]["aqius"]
        pollutants = PollutantData(
            pm25=data["data"]["current"]["pollution"].get("pm25", 0),
            pm10=data["data"]["current"]["pollution"].get("pm10", 0),
            no2=0,  # AirVisual free API doesn't provide these values
            o3=0,
            co=0,
            so2=0,
            nh3=0
        )
        
        current_point = AQIDataPoint(
            date=current_date,
            city=city_name,
            aqi=current_aqi,
            pollutants=pollutants,
            predicted=False
        )
        
        # Generate historical data (simulated)
        result = [current_point]
        for i in range(1, 15):
            past_date = (datetime.now() - timedelta(days=i)).strftime("%Y-%m-%d")
            variation = np.random.randint(-10, 11)
            historical_aqi = max(0, current_aqi + variation)
            
            pollutants_variation = {
                "pm25": max(0, pollutants.pm25 + np.random.randint(-5, 6)),
                "pm10": max(0, pollutants.pm10 + np.random.randint(-7, 8)),
                "no2": 0,
                "o3": 0,
                "co": 0,
                "so2": 0,
                "nh3": 0
            }
            
            result.append(AQIDataPoint(
                date=past_date,
                city=city_name,
                aqi=historical_aqi,
                pollutants=PollutantData(**pollutants_variation),
                predicted=False
            ))
        
        # Sort by date
        result.sort(key=lambda x: x.date)
        return result
    else:
        raise HTTPException(status_code=400, detail="Failed to get data from AirVisual")

async def fetch_aqicn_data(city: str, api_key: str) -> List[AQIDataPoint]:
    """
    Fetch data from AQICN API
    """
    # Extract base city name for API query
    if "," in city:
        base_city = city.split(",")[-1].strip()
    else:
        base_city = city
    
    # Make API request
    base_url = f"https://api.waqi.info/feed/{base_city}/"
    params = {"token": api_key}
    
    response = requests.get(base_url, params=params)
    
    if not response.ok:
        raise HTTPException(status_code=response.status_code, 
                           detail=f"AQICN API error: {response.text}")
    
    data = response.json()
    
    # Process API response
    if data["status"] == "ok":
        current_date = datetime.now().strftime("%Y-%m-%d")
        
        # Extract location info
        full_location = data["data"]["city"]["name"]
        location_parts = full_location.split(",")
        specific_location = location_parts[0].strip() if len(location_parts) > 1 else ""
        
        # Determine city from location
        city_name = base_city
        if len(location_parts) > 1:
            city_name = location_parts[-1].strip()
        
        # Extract current AQI and pollutants
        current_aqi = data["data"]["aqi"]
        iaqi = data["data"]["iaqi"]
        pollutants = PollutantData(
            pm25=iaqi.get("pm25", {}).get("v", 0),
            pm10=iaqi.get("pm10", {}).get("v", 0),
            no2=iaqi.get("no2", {}).get("v", 0),
            o3=iaqi.get("o3", {}).get("v", 0),
            co=iaqi.get("co", {}).get("v", 0),
            so2=iaqi.get("so2", {}).get("v", 0),
            nh3=0  # AQICN doesn't provide NH3 typically
        )
        
        # Create current data point
        current_point = AQIDataPoint(
            date=current_date,
            city=city_name,
            location=specific_location,
            aqi=current_aqi,
            pollutants=pollutants,
            predicted=False
        )
        
        # Generate historical data (simulated)
        result = [current_point]
        for i in range(1, 15):
            past_date = (datetime.now() - timedelta(days=i)).strftime("%Y-%m-%d")
            variation = np.random.randint(-10, 11)
            historical_aqi = max(0, current_aqi + variation)
            
            pollutants_variation = {
                "pm25": max(0, pollutants.pm25 + np.random.randint(-5, 6)),
                "pm10": max(0, pollutants.pm10 + np.random.randint(-7, 8)),
                "no2": max(0, pollutants.no2 + np.random.randint(-4, 5)),
                "o3": max(0, pollutants.o3 + np.random.randint(-3, 4)),
                "co": max(0, pollutants.co + np.random.randint(-2, 3)),
                "so2": max(0, pollutants.so2 + np.random.randint(-1, 2)),
                "nh3": 0
            }
            
            result.append(AQIDataPoint(
                date=past_date,
                city=city_name,
                location=specific_location,
                aqi=historical_aqi,
                pollutants=PollutantData(**pollutants_variation),
                predicted=False
            ))
        
        # Sort by date
        result.sort(key=lambda x: x.date)
        return result
    else:
        raise HTTPException(status_code=400, detail="Failed to get data from AQICN")

def generate_predictions(df: pd.DataFrame, model_name: str) -> pd.DataFrame:
    """
    Generate AQI predictions using the specified model
    """
    if df.empty:
        return pd.DataFrame(columns=["date", "city", "location", "aqi", "predicted"])
    
    # Extract basic info that we'll need for predictions
    city = df.iloc[-1]["city"] 
    location = df.iloc[-1]["location"] if "location" in df.columns else None
    
    # Get the latest actual data point
    current_date = datetime.now().date()
    current_date_str = current_date.strftime("%Y-%m-%d")
    
    # Find the latest non-predicted data point
    actual_data = df[~df.get("predicted", False)].copy()
    actual_data = actual_data.sort_values("date", ascending=False)
    
    current_aqi_point = None
    if not actual_data.empty:
        current_aqi_point = actual_data.iloc[0].to_dict()
    
    # Prepare for predictions
    forecast_df = pd.DataFrame()
    
    try:
        # Here we would typically:
        # 1. Pre-process data
        # 2. Load the appropriate ML model
        # 3. Make predictions
        
        # For simplicity, we'll simulate the forecast with a basic approach
        # based on the model name
        
        # Start with today's date
        forecast_dates = [current_date + timedelta(days=i) for i in range(7)]
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
        
        if model_name == "ARIMA":
            # Simulate ARIMA-like behavior with autoregression 
            for i in range(7):
                if i == 0 and current_aqi_point:
                    # For today, use the actual current AQI
                    aqi_values.append(current_aqi_point["aqi"])
                else:
                    # AR(1) process with some noise
                    prev = aqi_values[-1] if aqi_values else last_aqi
                    aqi_values.append(max(0, 0.8 * prev + np.random.normal(0, 5)))
                    
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
        
        elif model_name == "RandomForest":
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
                    
        else:  # Default or any other model
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
                
                for i in range(7):
                    if i == 0 and current_aqi_point and pollutant in current_aqi_point:
                        # For today, use actual value if available
                        pollutant_vals.append(current_aqi_point[pollutant])
                    else:
                        # Generate reasonable prediction based on base value and AQI trend
                        aqi_ratio = aqi_values[i] / last_aqi if last_aqi > 0 else 1
                        predicted_val = base_val * aqi_ratio * (0.95 + np.random.random() * 0.1)
                        pollutant_vals.append(max(0, round(predicted_val)))
                
                forecast_df[pollutant] = pollutant_vals
        
        # Convert date column to string format
        forecast_df["date"] = forecast_df["date"].dt.strftime("%Y-%m-%d")
        
    except Exception as e:
        print(f"Error generating predictions: {str(e)}")
        # Return empty dataframe if prediction fails
        return pd.DataFrame(columns=["date", "city", "location", "aqi", "predicted"])
    
    return forecast_df

# Run the server with: uvicorn main:app --reload
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
