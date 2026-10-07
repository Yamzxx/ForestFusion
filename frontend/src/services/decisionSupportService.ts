import type { SpatialPredictionRequest } from '../types/spatial';
import type {
  DecisionSupportSummary,
  DecisionSupportAttentionListResponse
} from '../types/decisionSupport';

export const fetchDecisionSupportSummary = async (
  request: SpatialPredictionRequest
): Promise<DecisionSupportSummary> => {
  try {
    const response = await fetch('/api/ml/decision-support/evaluate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: DecisionSupportSummary = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to fetch decision support summary:', error);
    return {
      location_name: request.location_name || `Point (${request.latitude.toFixed(3)}°, ${request.longitude.toFixed(3)}°)`,
      latitude: request.latitude,
      longitude: request.longitude,
      prediction_timestamp: new Date().toISOString(),
      model_name_version: 'XGBoost v1.0 (Calibrated)',
      predicted_class: 0,
      calibrated_probability: 0,
      raw_model_probability: 0,
      risk_category: 'Unavailable',
      attention_status_code: 'UNAVAILABLE',
      attention_status_label: 'Service Unavailable',
      attention_highlight_reason: 'Decision support endpoint unreachable or backend service unavailable.',
      shap_contributors: [],
      environmental_evidence: {},
      vegetation_evidence: {},
      historical_context: {},
      decision_support_recommendations: ['Check backend connection.'],
      data_freshness: { prediction_timestamp: new Date().toISOString() },
      is_available: false,
      error_message: 'Decision support service offline.',
      scientific_disclaimer: 'SCIENTIFIC NOTICE: Connect backend service.'
    };
  }
};

export const fetchAttentionList = async (): Promise<DecisionSupportAttentionListResponse> => {
  try {
    const response = await fetch('/api/ml/decision-support/attention-list');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data: DecisionSupportAttentionListResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to fetch attention list:', error);
    return {
      total_locations: 0,
      elevated_attention_count: 0,
      attention_items: [],
      data_freshness_notes: 'Failed to retrieve attention list from backend service.'
    };
  }
};
