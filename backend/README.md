
# AQI Prediction Backend

This backend service provides API endpoints for fetching air quality data and generating predictions for the AQI Prediction Dashboard.

## Features

- Fetch AQI data from multiple platforms (AirVisual, AQICN)
- Generate AQI forecasts using various prediction models (ARIMA, LSTM, Random Forest)
- Return historical and predicted AQI data in a consistent format
- Cross-platform compatibility with the React frontend

## Running the Backend

### Option 1: Running in Google Colab (Recommended for Testing)

1. Upload the `colab_run.ipynb` notebook to Google Colab
2. Execute all cells in sequence
3. Copy the generated ngrok URL to connect your frontend

### Option 2: Running Locally

1. Install required dependencies:
   ```
   pip install -r requirements.txt
   ```

2. Run the FastAPI server:
   ```
   uvicorn main:app --reload
   ```

3. Access the API at `http://localhost:8000`

## API Documentation

Once the server is running, view the interactive API documentation at `/docs` endpoint (e.g., `http://localhost:8000/docs`).

### Main Endpoints

#### 1. Fetch AQI Data

**Endpoint:** `/api/fetch-aqi`  
**Method:** `POST`

Request body:
```json
{
  "city": "Delhi",
  "state": "Delhi",
  "country": "India", 
  "api_key": "your_api_key_here",
  "platform": "airvisual" // or "aqicn"
}
```

#### 2. Generate Predictions

**Endpoint:** `/api/predict`  
**Method:** `POST`

Request body:
```json
{
  "historical_data": [
    {
      "date": "2023-05-01",
      "city": "Delhi",
      "aqi": 150,
      "pollutants": {
        "pm25": 75,
        "pm10": 120,
        "no2": 40,
        "o3": 30,
        "co": 10,
        "so2": 5,
        "nh3": 0
      }
    }
    // ... more data points
  ],
  "model_name": "ARIMA" // or "LSTM", "RandomForest"
}
```

## Connecting to the Frontend

To connect this backend to your AQI Prediction frontend:

1. Get the backend URL (either local `http://localhost:8000` or the ngrok URL from Colab)
2. Update the frontend to make API calls to this backend instead of directly to AirVisual/AQICN 

## Available Models

- **ARIMA**: Autoregressive Integrated Moving Average prediction
- **LSTM**: Long Short-Term Memory neural network prediction
- **RandomForest**: Random Forest regression prediction

## Machine Learning Models

The system uses .pkl files to store trained models. For demonstration purposes, the backend creates simple dummy models, but you can replace them with your own trained models:

1. Train your models using historical AQI data
2. Save them as .pkl files in the `models/` directory using the naming convention `{model_name}_model.pkl`
3. The API will automatically use your trained models for predictions

## File Structure

```
backend/
├── main.py              # FastAPI application and endpoints
├── requirements.txt     # Python dependencies
├── colab_run.ipynb      # Notebook for running in Google Colab
├── models/              # Directory for machine learning model files
│   ├── arima_model.pkl  # ARIMA prediction model
│   ├── lstm_model.pkl   # LSTM prediction model
│   └── randomforest_model.pkl  # Random Forest prediction model
└── README.md            # This documentation file
```

## Customization

To extend this backend:

1. Add new prediction models by:
   - Adding a new model file in `models/`
   - Extending the `generate_predictions` function in `main.py`

2. Add support for additional data sources by:
   - Creating new fetch functions similar to `fetch_airvisual_data` and `fetch_aqicn_data`
   - Adding new endpoints or extending the `fetch_aqi_data` endpoint
