import type { VegetationDataResponse } from '../types/vegetation';

const DEFAULT_SETUP_INSTRUCTIONS = [
  "1. Register a free account at Copernicus Data Space Ecosystem (https://dataspace.copernicus.eu).",
  "2. Go to User Dashboard -> OAuth Clients and create an API Client ID and Secret.",
  "3. Set environment variables COPERNICUS_CLIENT_ID and COPERNICUS_CLIENT_SECRET in your backend environment or .env file.",
  "4. Restart the FastAPI server (cd backend && python -m uvicorn app.main:app --reload --port 8000)."
];

/**
 * Fetch genuine satellite vegetation metrics and NDVI observations.
 * Queries the backend service interface /api/vegetation.
 * If unconfigured or offline, returns a clean unconfigured response avoiding mock/fake values.
 */
export async function fetchVegetationData(
  lat?: number,
  lng?: number,
  locationName?: string,
  signal?: AbortSignal
): Promise<VegetationDataResponse> {
  const params = new URLSearchParams();
  if (lat !== undefined && lat !== null) params.append('lat', lat.toString());
  if (lng !== undefined && lng !== null) params.append('lng', lng.toString());
  if (locationName) params.append('location_name', locationName);

  const url = `/api/vegetation?${params.toString()}`;

  try {
    const response = await fetch(url, { signal });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: Failed to retrieve vegetation data from backend`);
    }

    const data: VegetationDataResponse = await response.json();
    return data;
  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw error;
    }

    console.info('Vegetation service check notice:', error.message);
    
    // Honest response when backend API is offline or credentials unconfigured
    return {
      status: 'unconfigured',
      message: 'Copernicus Sentinel-2 API credentials not configured in backend environment. Set COPERNICUS_CLIENT_ID and COPERNICUS_CLIENT_SECRET to enable live satellite telemetry.',
      location_name: locationName,
      latitude: lat,
      longitude: lng,
      provider: 'Copernicus Data Space Ecosystem (Sentinel-2 MSI L2A)',
      is_configured: false,
      latest_observation: undefined,
      observations: [],
      setup_instructions: DEFAULT_SETUP_INSTRUCTIONS
    };
  }
}
