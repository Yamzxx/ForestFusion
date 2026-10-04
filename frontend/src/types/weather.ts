export interface GeocodingLocation {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  elevation?: number;
  feature_code?: string;
  country_code?: string;
  country?: string;
  admin1?: string;
  admin2?: string;
  timezone?: string;
}

export interface OpenMeteoCurrentWeather {
  time: string;
  interval?: number;
  temperature_2m: number;
  relative_humidity_2m: number;
  apparent_temperature?: number;
  precipitation: number;
  wind_speed_10m: number;
  wind_direction_10m?: number;
  weather_code: number;
  is_day?: number;
}

export interface OpenMeteoCurrentUnits {
  time?: string;
  temperature_2m?: string;
  relative_humidity_2m?: string;
  apparent_temperature?: string;
  precipitation?: string;
  wind_speed_10m?: string;
  wind_direction_10m?: string;
  weather_code?: string;
  is_day?: string;
}

export interface OpenMeteoForecastResponse {
  latitude: number;
  longitude: number;
  generationtime_ms: number;
  utc_offset_seconds: number;
  timezone: string;
  timezone_abbreviation: string;
  elevation: number;
  current_units?: OpenMeteoCurrentUnits;
  current?: OpenMeteoCurrentWeather;
}

export interface WeatherData {
  locationName: string;
  region?: string;
  country?: string;
  latitude: number;
  longitude: number;
  timezone: string;
  current: OpenMeteoCurrentWeather;
  wmoDescription: string;
  units: {
    temperature: string;
    humidity: string;
    windSpeed: string;
    precipitation: string;
    windDirection: string;
  };
  fetchedAtIso: string;
}

export interface WeatherState {
  data: WeatherData | null;
  loading: boolean;
  error: string | null;
  selectedLocation: GeocodingLocation;
}
