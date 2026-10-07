import type {
  SpatialPredictionRequest,
  SpatialPredictionResponse,
  SpatialBatchPredictionRequest,
  SpatialBatchPredictionResponse
} from '../types/spatial';

export const fetchSpatialPrediction = async (
  request: SpatialPredictionRequest
): Promise<SpatialPredictionResponse> => {
  try {
    const response = await fetch('/api/ml/spatial-prediction', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: SpatialPredictionResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to fetch spatial prediction:', error);
    return {
      latitude: request.latitude,
      longitude: request.longitude,
      location_name: request.location_name || `Point (${request.latitude.toFixed(3)}°, ${request.longitude.toFixed(3)}°)`,
      prediction_class: 0,
      calibrated_probability: 0,
      raw_model_probability: 0,
      raw_margin: 0,
      risk_category: 'Unavailable',
      risk_level_code: 'LOW',
      calibration_method: 'Platt Scaling (Sigmoid)',
      model_version: 'XGBoost v1.0 (Calibrated)',
      features_used: {
        temperature_2m: 0,
        relative_humidity_2m: 0,
        wind_speed_10m: 0,
        precipitation: 0,
        ndvi: 0,
        month: new Date().getMonth() + 1,
        telemetry_source: 'Error (Connection Failed)'
      },
      is_prediction_available: false,
      error_message: 'Spatial prediction API endpoint unreachable or backend service unavailable.',
      scientific_disclaimer: 'SCIENTIFIC NOTICE: Model predictions require connected backend API service.'
    };
  }
};

export const fetchSpatialBatchPredictions = async (
  request: SpatialBatchPredictionRequest
): Promise<SpatialBatchPredictionResponse> => {
  try {
    const response = await fetch('/api/ml/spatial-predictions-batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: SpatialBatchPredictionResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to fetch spatial batch predictions:', error);
    return {
      predictions: [],
      total_requested: request.locations.length,
      total_valid: 0,
      spatial_coverage_notes: 'Batch predictions failed due to API connectivity issue.'
    };
  }
};
