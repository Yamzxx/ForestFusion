import { useState, useEffect, useCallback, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DemoNoticeBanner } from './components/DemoNoticeBanner';
import { OverviewPage } from './pages/OverviewPage';
import { RiskMapPage } from './pages/RiskMapPage';
import { ForestHealthPage } from './pages/ForestHealthPage';
import { HistoricalFiresPage } from './pages/HistoricalFiresPage';
import { 
  AnalyticsPage, 
  AlertsPage, 
  SettingsPage 
} from './pages/PlaceholderPages';
import { fetchHealthStatus } from './services/apiService';
import { fetchCurrentWeather, DEFAULT_WEATHER_LOCATION } from './services/weatherService';
import { fetchVegetationData } from './services/vegetationService';
import { fetchFireDetections } from './services/fireService';
import type { NavigationTab, HealthStatus, GeocodingLocation, WeatherState, VegetationState, FireState } from './types';
import './App.css';

export function App() {
  const [activeTab, setActiveTab] = useState<NavigationTab>('overview');
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);
  const [healthLoading, setHealthLoading] = useState<boolean>(true);

  // Day 3 Open-Meteo Real Weather Data State
  const [selectedLocation, setSelectedLocation] = useState<GeocodingLocation>(DEFAULT_WEATHER_LOCATION);
  const [weatherState, setWeatherState] = useState<WeatherState>({
    data: null,
    loading: true,
    error: null,
    selectedLocation: DEFAULT_WEATHER_LOCATION,
  });

  // Day 4 Vegetation Monitoring State
  const [vegetationState, setVegetationState] = useState<VegetationState>({
    data: null,
    loading: true,
    error: null,
  });

  // Day 6 NASA FIRMS Historical Wildfire / Active Fire Detection State
  const [fireDays, setFireDays] = useState<number>(7);
  const [fireSource, setFireSource] = useState<string>('VIIRS_SNPP_NRT');
  const [fireState, setFireState] = useState<FireState>({
    data: null,
    loading: true,
    error: null,
  });

  const weatherAbortControllerRef = useRef<AbortController | null>(null);
  const vegAbortControllerRef = useRef<AbortController | null>(null);
  const fireAbortControllerRef = useRef<AbortController | null>(null);

  // Fetch live weather data whenever selectedLocation changes
  const loadWeather = useCallback(async (location: GeocodingLocation, bypassCache = false) => {
    if (weatherAbortControllerRef.current) {
      weatherAbortControllerRef.current.abort();
    }
    const controller = new AbortController();
    weatherAbortControllerRef.current = controller;

    setWeatherState((prev) => ({
      ...prev,
      loading: true,
      error: null,
      selectedLocation: location,
    }));

    try {
      const data = await fetchCurrentWeather(location, controller.signal, bypassCache);
      setWeatherState({
        data,
        loading: false,
        error: null,
        selectedLocation: location,
      });
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setWeatherState({
          data: null,
          loading: false,
          error: err.message || 'Failed to fetch weather data from Open-Meteo API',
          selectedLocation: location,
        });
      }
    }
  }, []);

  // Fetch satellite vegetation data whenever selectedLocation changes
  const loadVegetation = useCallback(async (location: GeocodingLocation) => {
    if (vegAbortControllerRef.current) {
      vegAbortControllerRef.current.abort();
    }
    const controller = new AbortController();
    vegAbortControllerRef.current = controller;

    setVegetationState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const data = await fetchVegetationData(location.latitude, location.longitude, location.name, controller.signal);
      setVegetationState({ data, loading: false, error: null });
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setVegetationState({
          data: null,
          loading: false,
          error: err.message || 'Failed to query vegetation service',
        });
      }
    }
  }, []);

  // Fetch NASA FIRMS historical active-fire detections
  const loadFireDetections = useCallback(async (days: number, source: string) => {
    if (fireAbortControllerRef.current) {
      fireAbortControllerRef.current.abort();
    }
    const controller = new AbortController();
    fireAbortControllerRef.current = controller;

    setFireState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const data = await fetchFireDetections(days, source, controller.signal);
      setFireState({ data, loading: false, error: null });
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setFireState({
          data: null,
          loading: false,
          error: err.message || 'Failed to query historical fire detection service',
        });
      }
    }
  }, []);

  useEffect(() => {
    loadWeather(selectedLocation);
    loadVegetation(selectedLocation);
  }, [selectedLocation, loadWeather, loadVegetation]);

  useEffect(() => {
    loadFireDetections(fireDays, fireSource);
  }, [fireDays, fireSource, loadFireDetections]);

  const handleRetryWeather = () => {
    loadWeather(selectedLocation, true);
  };

  const handleRetryVegetation = () => {
    loadVegetation(selectedLocation);
  };

  const handleRetryFires = () => {
    loadFireDetections(fireDays, fireSource);
  };

  useEffect(() => {
    let isMounted = true;
    const checkHealth = async () => {
      setHealthLoading(true);
      const data = await fetchHealthStatus();
      if (isMounted) {
        setHealthStatus(data);
        setHealthLoading(false);
      }
    };

    checkHealth();
    // Poll backend health every 30 seconds
    const interval = setInterval(checkHealth, 30000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const renderActivePage = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <OverviewPage 
            weatherState={weatherState} 
            vegetationState={vegetationState}
            onRetryWeather={handleRetryWeather}
            onSelectLocation={setSelectedLocation}
          />
        );
      case 'risk-map':
        return (
          <RiskMapPage 
            onSelectWeatherLocation={setSelectedLocation}
            activeWeatherLocationName={selectedLocation.name}
            fireDetections={fireState.data?.detections || []}
            weatherState={weatherState}
            vegetationState={vegetationState}
          />
        );
      case 'forest-health':
        return (
          <ForestHealthPage 
            vegetationState={vegetationState}
            selectedLocation={selectedLocation}
            onRetryVegetation={handleRetryVegetation}
          />
        );
      case 'historical-fires':
        return (
          <HistoricalFiresPage 
            fireState={fireState}
            days={fireDays}
            source={fireSource}
            onChangeDays={setFireDays}
            onChangeSource={setFireSource}
            onRetryFire={handleRetryFires}
          />
        );
      case 'analytics':
        return <AnalyticsPage />;
      case 'alerts':
        return <AlertsPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return (
          <OverviewPage 
            weatherState={weatherState} 
            vegetationState={vegetationState}
            onRetryWeather={handleRetryWeather}
            onSelectLocation={setSelectedLocation}
          />
        );
    }
  };

  return (
    <div className="app-shell">
      {/* Dark Forest-Green Navigation Sidebar */}
      <Sidebar activeTab={activeTab} onSelectTab={setActiveTab} />

      {/* Main Content Area */}
      <main className="app-main-content">
        {/* Top Header */}
        <Header 
          activeTab={activeTab} 
          healthStatus={healthStatus} 
          healthLoading={healthLoading}
          onSelectLocation={setSelectedLocation}
          selectedLocationName={selectedLocation.name}
        />

        {/* Demo Disclaimer Banner */}
        <DemoNoticeBanner />

        {/* Dynamic Page View */}
        <div className="content-container">
          {renderActivePage()}
        </div>
      </main>
    </div>
  );
}

export default App;


