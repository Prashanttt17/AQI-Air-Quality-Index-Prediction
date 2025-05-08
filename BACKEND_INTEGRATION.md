
# Connecting the AQI Prediction Frontend and Backend

This document explains how to set up and connect the AQI Prediction frontend application with the Python backend server for more accurate predictions.

## Overview

The AQI Prediction application consists of two parts:
1. **Frontend**: A React.js application that displays AQI data and predictions
2. **Backend**: A Python/FastAPI server that fetches data and generates predictions using machine learning models

## Running the Backend

### Option 1: Google Colab (Recommended for Testing)

1. **Open the Notebook**:
   - Upload `backend/colab_run.ipynb` to Google Colab
   - Or create a new notebook and copy the code from that file

2. **Run All Cells**: 
   - Execute all cells in sequence
   - The last cell will output a public ngrok URL that looks like: `https://1234-abc-xyz.ngrok.io`
   - Copy this URL - you'll need it to connect the frontend

### Option 2: Local Machine

1. **Install Dependencies**:
   ```
   cd backend
   pip install -r requirements.txt
   ```

2. **Run the Server**:
   ```
   uvicorn main:app --reload
   ```

3. **Access the Server**:
   - The server will run at `http://localhost:8000`
   - You can check the API documentation at `http://localhost:8000/docs`

## Connecting the Frontend to the Backend

1. **Access the Frontend Application**:
   - Open the AQI Prediction Dashboard in your browser

2. **Navigate to Backend Settings**:
   - Go to the "API Access" tab
   - Scroll down to the "Backend Integration" card

3. **Configure Backend Connection**:
   - Toggle "Enable Backend Integration" to ON
   - Enter your backend URL:
     - If using Colab: Paste the ngrok URL (e.g., `https://1234-abc-xyz.ngrok.io`)
     - If running locally: Enter `http://localhost:8000`
   - Click "Test Connection" to verify connectivity
   - Click "Save Settings" to apply changes

4. **Use the Connected System**:
   - Return to the "Dashboard" tab
   - The application will now use the backend's machine learning models for predictions
   - Any data fetched through the API will be routed through the backend

## Verifying the Connection

To verify that the backend is being used:

1. **Check the Console**: Open browser developer tools (F12) and check the console for backend-related messages
2. **Compare Predictions**: Notice that predictions may differ from the frontend-only mode, especially with the LSTM and RandomForest models
3. **View API Requests**: In the Network tab of developer tools, you'll see requests going to your backend server

## Troubleshooting

### Connection Issues:
- **Colab URL Not Working**: Colab ngrok URLs expire after a few hours. Re-run the notebook to get a new URL
- **CORS Errors**: The backend is configured to allow all origins. If you experience CORS issues, check your browser extensions or network settings

### Prediction Problems:
- **No Predictions Appear**: Ensure historical data is available by selecting a city and fetching data
- **Errors in Prediction**: Check the browser console for error messages
- **Backend Server Errors**: Check the backend server logs for detailed error information

## Extending the System

### Adding New Models:
1. Implement your model using scikit-learn, TensorFlow, PyTorch, or any other Python ML library
2. Save the trained model as a .pkl file in the backend/models directory
3. Update the generate_predictions function in main.py to handle your new model

### Changing APIs:
1. Add new API endpoints to main.py
2. Update the backend-integration.ts file in the frontend to call these new endpoints

## Security Considerations

This implementation is intended for educational and demonstration purposes. For production use, consider:

1. **API Authentication**: Add proper authentication to protect your backend API
2. **HTTPS**: Ensure all communications are encrypted using HTTPS
3. **Input Validation**: Add more robust validation for all inputs
4. **Rate Limiting**: Implement rate limiting to prevent abuse

## Need Help?

If you encounter issues with the backend integration:
1. Check the backend server logs for detailed error messages
2. Look at the browser console for frontend error information
3. Verify your API keys are correctly set for both platforms
4. Ensure your internet connection allows outbound connections to the APIs

For more advanced features like custom model integration, refer to the documentation in the backend/README.md file.
