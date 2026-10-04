import type { VegetationDataResponse } from '../types/vegetation';

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
    
    // Honest fallback response when backend API is offline or unconfigured
    return {
      status: 'unconfigured',
      message: 'Satellite vegetation data source not configured. Connect Sentinel-2 or Google Earth Engine API credentials.',
      location_name: locationName,
      latitude: lat,
      longitude: lng,
      provider: 'Sentinel-2 / Copernicus (GEE Target)',
      is_configured: false,
      latest_observation: undefined,
      observations: [],
    };
  }
}
