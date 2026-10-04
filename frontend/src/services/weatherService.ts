import type { GeocodingLocation, OpenMeteoForecastResponse, WeatherData } from '../types/weather';

// WMO Weather Interpretation Codes according to Open-Meteo documentation
export const WMO_WEATHER_CODES: Record<number, string> = {
  0: 'Clear sky',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Fog',
  48: 'Depositing rime fog',
  51: 'Light drizzle',
  53: 'Moderate drizzle',
  55: 'Dense drizzle',
  56: 'Light freezing drizzle',
  57: 'Dense freezing drizzle',
  61: 'Slight rain',
  63: 'Moderate rain',
  65: 'Heavy rain',
  66: 'Light freezing rain',
  67: 'Heavy freezing rain',
  71: 'Slight snow fall',
  73: 'Moderate snow fall',
  75: 'Heavy snow fall',
  77: 'Snow grains',
  80: 'Slight rain showers',
  81: 'Moderate rain showers',
  82: 'Violent rain showers',
  85: 'Slight snow showers',
  86: 'Heavy snow showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm with slight hail',
  99: 'Thunderstorm with heavy hail',
};

export function getWmoWeatherDescription(code?: number): string {
  if (code === undefined || code === null || isNaN(code)) return 'Unknown weather condition';
  return WMO_WEATHER_CODES[code] || `WMO Code ${code}`;
}

export function getWindDirectionText(deg?: number): string {
  if (deg === undefined || deg === null || isNaN(deg)) return 'N/A';
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(deg / 22.5) % 16;
  return directions[index];
}

// Default weather location centered around Bandipur Forest Region, Karnataka, India
export const DEFAULT_WEATHER_LOCATION: GeocodingLocation = {
  id: 1277333,
  name: 'Bandipur',
  country: 'India',
  admin1: 'Karnataka',
  latitude: 11.6667,
  longitude: 76.6333,
  timezone: 'Asia/Kolkata',
};

// In-memory weather cache to prevent redundant API calls for the same location within 2 minutes
interface CacheEntry {
  data: WeatherData;
  timestamp: number;
}
const weatherCache = new Map<string, CacheEntry>();
const CACHE_DURATION_MS = 2 * 60 * 1000; // 2 minutes

/**
 * Geocoding Search: Search locations via Open-Meteo Geocoding API
 */
export async function searchLocations(query: string, signal?: AbortSignal): Promise<GeocodingLocation[]> {
  const trimmedQuery = query.trim();
  if (trimmedQuery.length < 2) {
    return [];
  }

  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(trimmedQuery)}&count=8&language=en&format=json`;

  try {
    const response = await fetch(url, { signal });
    if (!response.ok) {
      throw new Error(`Geocoding request failed with status ${response.status}`);
    }

    const json = await response.json();
    if (!json.results || !Array.isArray(json.results)) {
      return [];
    }

    return json.results.map((item: any) => ({
      id: item.id,
      name: item.name,
      latitude: item.latitude,
      longitude: item.longitude,
      elevation: item.elevation,
      country_code: item.country_code,
      country: item.country,
      admin1: item.admin1,
      admin2: item.admin2,
      timezone: item.timezone,
    }));
  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw error;
    }
    console.error('Open-Meteo Geocoding Search Error:', error);
    throw new Error(error.message || 'Failed to search locations via Open-Meteo API');
  }
}

/**
 * Fetch current weather data from Open-Meteo Forecast API
 */
export async function fetchCurrentWeather(
  location: GeocodingLocation,
  signal?: AbortSignal,
  bypassCache = false
): Promise<WeatherData> {
  const cacheKey = `${location.latitude.toFixed(4)},${location.longitude.toFixed(4)}`;
  const now = Date.now();

  if (!bypassCache && weatherCache.has(cacheKey)) {
    const entry = weatherCache.get(cacheKey)!;
    if (now - entry.timestamp < CACHE_DURATION_MS) {
      return entry.data;
    }
  }

  const params = new URLSearchParams({
    latitude: location.latitude.toString(),
    longitude: location.longitude.toString(),
    current: 'temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,wind_speed_10m,wind_direction_10m,weather_code,is_day',
    wind_speed_unit: 'kmh',
    timeformat: 'iso8601',
  });

  const url = `https://api.open-meteo.com/v1/forecast?${params.toString()}`;

  try {
    const response = await fetch(url, { signal });
    if (!response.ok) {
      throw new Error(`Weather API request failed with status ${response.status}`);
    }

    const json: OpenMeteoForecastResponse = await response.json();

    if (!json.current) {
      throw new Error('Open-Meteo API response is missing current weather data field.');
    }

    const weatherData: WeatherData = {
      locationName: location.name,
      region: location.admin1,
      country: location.country,
      latitude: json.latitude ?? location.latitude,
      longitude: json.longitude ?? location.longitude,
      timezone: json.timezone ?? location.timezone ?? 'UTC',
      current: {
        time: json.current.time ?? new Date().toISOString(),
        interval: json.current.interval,
        temperature_2m: json.current.temperature_2m ?? 0,
        relative_humidity_2m: json.current.relative_humidity_2m ?? 0,
        apparent_temperature: json.current.apparent_temperature,
        precipitation: json.current.precipitation ?? 0,
        wind_speed_10m: json.current.wind_speed_10m ?? 0,
        wind_direction_10m: json.current.wind_direction_10m,
        weather_code: json.current.weather_code ?? 0,
        is_day: json.current.is_day,
      },
      wmoDescription: getWmoWeatherDescription(json.current.weather_code),
      units: {
        temperature: json.current_units?.temperature_2m || '°C',
        humidity: json.current_units?.relative_humidity_2m || '%',
        windSpeed: json.current_units?.wind_speed_10m || 'km/h',
        precipitation: json.current_units?.precipitation || 'mm',
        windDirection: json.current_units?.wind_direction_10m || '°',
      },
      fetchedAtIso: new Date().toISOString(),
    };

    weatherCache.set(cacheKey, { data: weatherData, timestamp: now });
    return weatherData;
  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw error;
    }
    console.error('Open-Meteo Weather Fetch Error:', error);
    throw new Error(error.message || 'Failed to fetch live weather observations from Open-Meteo');
  }
}
