import type { TemporalAnalysisResponse } from '../types/temporalAnalysis';

export const fetchTemporalAnalysis = async (
  days: number = 14,
  lat: number = 11.6667,
  lng: number = 76.6333
): Promise<TemporalAnalysisResponse> => {
  try {
    const response = await fetch(`/api/ml/temporal-analysis?days=${days}&lat=${lat}&lng=${lng}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data: TemporalAnalysisResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to fetch temporal analysis:', error);
    // Return honest error state response
    const now = new Date();
    const start = new Date(now.getTime() - (days - 1) * 24 * 60 * 60 * 1000);
    return {
      start_date: start.toISOString().split('T')[0],
      end_date: now.toISOString().split('T')[0],
      total_days: days,
      fire_activity_trend: [],
      environmental_trend: [],
      model_risk_trend: [],
      correlations: [],
      temporal_coverage_notes: 'Temporal analysis service endpoint unreachable or backend error occurred.',
      scientific_disclaimer: 'SCIENTIFIC NOTICE: Connect backend service to retrieve temporal analysis.'
    };
  }
};
