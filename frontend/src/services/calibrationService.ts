import type { ModelValidationCalibrationReport, CalibrateProbabilityResponse } from '../types/calibration';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

export async function fetchCalibrationReport(signal?: AbortSignal): Promise<ModelValidationCalibrationReport> {
  const response = await fetch(`${API_BASE_URL}/ml/calibration-report`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    signal,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch calibration report: ${response.status} ${errorText}`);
  }

  return response.json();
}

export async function calibrateProbability(
  raw_prob?: number,
  raw_margin?: number,
  signal?: AbortSignal
): Promise<CalibrateProbabilityResponse> {
  const response = await fetch(`${API_BASE_URL}/ml/calibrate-probability`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      raw_probability: raw_prob,
      raw_margin: raw_margin,
    }),
    signal,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to calibrate probability: ${response.status} ${errorText}`);
  }

  return response.json();
}
