
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from statsmodels.tsa.arima.model import ARIMA
from statsmodels.tsa.statespace.sarimax import SARIMAX
import pmdarima as pm
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional, Union
import joblib
import os

# Create models directory if it doesn't exist
os.makedirs("models", exist_ok=True)

class TimeSeriesModels:
    """
    Class containing implementation of various time series models
    for AQI prediction
    """
    
    @staticmethod
    def prepare_data_for_ts(data_df: pd.DataFrame, target_col: str = 'aqi') -> pd.DataFrame:
        """
        Prepare data for time series modeling
        """
        # Ensure date is in datetime format and set as index
        df = data_df.copy()
        if 'date' in df.columns:
            df['date'] = pd.to_datetime(df['date'])
            df = df.sort_values('date')
            df = df.set_index('date')
        
        # If we have very few data points, we cannot build a good model
        # So we add some synthetic data points based on existing data trends
        if len(df) < 14:
            print(f"Warning: Only {len(df)} data points provided. Adding synthetic data for better modeling.")
            
            # Get the earliest date and add synthetic data before it
            if isinstance(df.index, pd.DatetimeIndex):
                earliest_date = df.index.min()
                
                # Calculate average change between consecutive values
                avg_change = 0
                if len(df) > 1:
                    changes = []
                    for i in range(1, len(df)):
                        changes.append(df.iloc[i][target_col] - df.iloc[i-1][target_col])
                    avg_change = sum(changes) / len(changes) if changes else 0
                
                # Add synthetic data
                synthetic_data = []
                for i in range(1, 15 - len(df) + 1):
                    synthetic_date = earliest_date - timedelta(days=i)
                    
                    # Calculate synthetic values using the average change (with some noise)
                    base_val = df.iloc[0][target_col]
                    synthetic_val = max(0, base_val - (avg_change * i) + np.random.normal(0, 5))
                    
                    # Create row with the same columns as the original data
                    row = {col: 0 for col in df.columns}
                    row[target_col] = synthetic_val
                    
                    synthetic_data.append((synthetic_date, row))
                
                # Add the synthetic data to the dataframe
                for date, row in synthetic_data:
                    df.loc[date] = row
                
                # Sort again after adding synthetic data
                df = df.sort_index()
        
        return df
    
    @staticmethod
    def fit_arima_model(data: pd.DataFrame, target_col: str = 'aqi', order: tuple = (5, 1, 0)):
        """
        Fit an ARIMA model to the data
        
        Parameters:
        -----------
        data : pd.DataFrame
            Time series data with date as index
        target_col : str
            Column name of the target variable
        order : tuple
            ARIMA order (p, d, q) parameters
            
        Returns:
        --------
        fitted_model : ARIMA model
        """
        # Prepare data
        df = TimeSeriesModels.prepare_data_for_ts(data, target_col)
        
        # Fit ARIMA model
        model = ARIMA(df[target_col], order=order)
        fitted_model = model.fit()
        
        # Save the model
        joblib.dump(fitted_model, "models/arima_model.pkl")
        
        return fitted_model
    
    @staticmethod
    def predict_arima(model, steps: int = 7):
        """
        Generate predictions using the fitted ARIMA model
        
        Parameters:
        -----------
        model : ARIMA model
            Fitted ARIMA model
        steps : int
            Number of steps to forecast
            
        Returns:
        --------
        forecast : pd.Series
            Forecast values
        """
        forecast = model.forecast(steps=steps)
        return forecast
    
    @staticmethod
    def auto_arima_forecast(data: pd.DataFrame, target_col: str = 'aqi', forecast_steps: int = 7):
        """
        Automatically find the best ARIMA parameters and forecast
        
        Parameters:
        -----------
        data : pd.DataFrame
            Time series data with datetime index
        target_col : str
            Column name of the target variable
        forecast_steps : int
            Number of steps to forecast
            
        Returns:
        --------
        forecast : pd.Series
            Forecast values
        model : ARIMA model
            Fitted ARIMA model
        """
        # Prepare data
        df = TimeSeriesModels.prepare_data_for_ts(data, target_col)
        
        # Use auto_arima to find the best parameters
        model = pm.auto_arima(
            df[target_col],
            seasonal=False,
            stepwise=True,
            suppress_warnings=True,
            error_action="ignore",
            max_order=6,
            trace=False
        )
        
        # Save model
        joblib.dump(model, "models/auto_arima_model.pkl")
        
        # Generate forecast
        forecast = model.predict(n_periods=forecast_steps)
        
        return forecast, model
    
    @staticmethod
    def fit_sarimax_model(data: pd.DataFrame, target_col: str = 'aqi', 
                          order: tuple = (1, 1, 1), seasonal_order: tuple = (1, 1, 1, 7)):
        """
        Fit a SARIMAX model to the data
        
        Parameters:
        -----------
        data : pd.DataFrame
            Time series data with date as index
        target_col : str
            Column name of the target variable
        order : tuple
            ARIMA order (p, d, q) parameters
        seasonal_order : tuple
            Seasonal order (P, D, Q, s) parameters
            
        Returns:
        --------
        fitted_model : SARIMAX model
        """
        # Prepare data
        df = TimeSeriesModels.prepare_data_for_ts(data, target_col)
        
        # If we have too few data points for seasonal modeling
        if len(df) < seasonal_order[3]:
            print(f"Warning: Not enough data points for seasonal modeling with period={seasonal_order[3]}.")
            # Adjust the seasonal period
            seasonal_order = (seasonal_order[0], seasonal_order[1], seasonal_order[2], min(7, len(df) // 2))
            
        # Fit SARIMAX model
        model = SARIMAX(df[target_col], order=order, seasonal_order=seasonal_order)
        
        try:
            fitted_model = model.fit(disp=False)
            
            # Save the model
            joblib.dump(fitted_model, "models/sarimax_model.pkl")
            
            return fitted_model
        except Exception as e:
            print(f"Error fitting SARIMAX model: {e}")
            # Fall back to ARIMA if SARIMAX fails
            print("Falling back to ARIMA model")
            arima_model = TimeSeriesModels.fit_arima_model(data, target_col)
            return arima_model
    
    @staticmethod
    def predict_sarimax(model, steps: int = 7):
        """
        Generate predictions using the fitted SARIMAX model
        
        Parameters:
        -----------
        model : SARIMAX model
            Fitted SARIMAX model
        steps : int
            Number of steps to forecast
            
        Returns:
        --------
        forecast : pd.Series
            Forecast values
        """
        forecast = model.forecast(steps=steps)
        return forecast
    
    @staticmethod
    def get_best_model_for_data(data: pd.DataFrame, target_col: str = 'aqi'):
        """
        Determine the best model for the given data
        """
        # If we have at least 14 data points, we can try SARIMAX
        if len(data) >= 14:
            try:
                # Try SARIMAX model
                return TimeSeriesModels.fit_sarimax_model(data, target_col)
            except Exception as e:
                print(f"SARIMAX failed: {e}")
                # Fall back to auto ARIMA
                try:
                    _, model = TimeSeriesModels.auto_arima_forecast(data, target_col)
                    return model
                except Exception as e2:
                    print(f"Auto ARIMA failed: {e2}")
                    # Fall back to basic ARIMA
                    return TimeSeriesModels.fit_arima_model(data, target_col)
        else:
            # For small datasets, auto ARIMA is better
            try:
                _, model = TimeSeriesModels.auto_arima_forecast(data, target_col)
                return model
            except Exception as e:
                print(f"Auto ARIMA failed: {e}")
                # Fall back to basic ARIMA
                return TimeSeriesModels.fit_arima_model(data, target_col)
    
    @staticmethod
    def load_model(model_name: str):
        """
        Load a saved model
        """
        model_path = f"models/{model_name}_model.pkl"
        
        if os.path.exists(model_path):
            return joblib.load(model_path)
        else:
            return None

    @staticmethod
    def forecast_with_model(model_name: str, data: pd.DataFrame, steps: int = 7, target_col: str = 'aqi'):
        """
        Generate forecasts using the specified model
        """
        # Prepare data
        df = TimeSeriesModels.prepare_data_for_ts(data, target_col)
        last_date = df.index[-1]
        
        # Load or fit model
        model = TimeSeriesModels.load_model(model_name)
        
        if model is None:
            # Model not found, fit a new one
            if model_name.lower() == 'arima':
                model = TimeSeriesModels.fit_arima_model(df, target_col)
            elif model_name.lower() == 'sarimax':
                model = TimeSeriesModels.fit_sarimax_model(df, target_col)
            else:
                # Default to auto ARIMA
                _, model = TimeSeriesModels.auto_arima_forecast(df, target_col)
        
        # Generate forecast
        try:
            forecast = model.forecast(steps=steps)
        except Exception as e:
            print(f"Error generating forecast with {model_name}: {e}")
            # Try to refit the model
            if model_name.lower() == 'arima':
                model = TimeSeriesModels.fit_arima_model(df, target_col)
            elif model_name.lower() == 'sarimax':
                model = TimeSeriesModels.fit_sarimax_model(df, target_col)
            else:
                # Default to auto ARIMA
                _, model = TimeSeriesModels.auto_arima_forecast(df, target_col)
            
            forecast = model.forecast(steps=steps)
        
        # Convert forecast to DataFrame with dates
        dates = [last_date + timedelta(days=i+1) for i in range(steps)]
        forecast_df = pd.DataFrame({
            'date': dates,
            target_col: forecast.values if hasattr(forecast, 'values') else forecast
        })
        
        # Convert values to positive numbers and round
        forecast_df[target_col] = forecast_df[target_col].apply(lambda x: max(0, round(x)))
        
        return forecast_df

    @staticmethod
    def process_csv_data(csv_file_path: str, target_col: str = 'aqi', date_col: str = 'date'):
        """
        Process CSV data for time series modeling
        """
        try:
            # Read CSV
            df = pd.read_csv(csv_file_path)
            
            # Check if required columns exist
            if date_col not in df.columns:
                raise ValueError(f"Date column '{date_col}' not found in CSV file")
            if target_col not in df.columns:
                raise ValueError(f"Target column '{target_col}' not found in CSV file")
            
            # Process date column
            df[date_col] = pd.to_datetime(df[date_col])
            
            # Sort by date
            df = df.sort_values(date_col)
            
            return df
        except Exception as e:
            print(f"Error processing CSV file: {e}")
            return None
