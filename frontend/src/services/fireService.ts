import type { FireDataResponse } from '../types/fire';

const FIRMS_DEFAULT_SETUP_INSTRUCTIONS = [
  "1. Request a free NASA FIRMS API Map Key at https://firms.modaps.eosdis.nasa.gov/api/map_key.",
  "2. Copy your unique NASA FIRMS MAP_KEY from the confirmation email.",
  "3. Set environment variable NASA_FIRMS_MAP_KEY='your_key' in your backend environment or backend/.env file.",
  "4. Restart the FastAPI server (cd backend && python -m uvicorn app.main:app --reload --port 8000)."
];

/**
 * Fetch genuine satellite active-fire thermal anomaly detections from backend API.
 * Handles missing credentials cleanly without fabricating records or random coordinates.
 */
export async function fetchFireDetections(
  days: number = 7,
  source: string = 'VIIRS_SNPP_NRT',
  signal?: AbortSignal
): Promise<FireDataResponse> {
  const params = new URLSearchParams({
    days: days.toString(),
    source: source,
  });

  const url = `/api/fire-detections?${params.toString()}`;

  try {
    const response = await fetch(url, { signal });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: Failed to retrieve active-fire detections`);
    }

    const data: FireDataResponse = await response.json();
    return data;
  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw error;
    }

    console.info('NASA FIRMS API service check notice:', error.message);

    return {
      status: 'unconfigured',
      message: 'NASA FIRMS Map Key not configured in backend environment. Set NASA_FIRMS_MAP_KEY to retrieve live satellite active-fire thermal anomaly detections.',
      provider: 'NASA FIRMS (EOSDIS / VIIRS & MODIS)',
      is_configured: false,
      total_detections: 0,
      detections: [],
      source_instrument: source,
      days_searched: days,
      data_provenance: 'NASA Fire Information for Resource Management System (FIRMS)',
      data_limitations: 'Satellite active-fire detections represent radiometer thermal anomalies (hotspots) at 375m/1km pixel resolution. They are not automatically confirmed ground wildfires or exact burn boundaries.',
      setup_instructions: FIRMS_DEFAULT_SETUP_INSTRUCTIONS,
    };
  }
}
