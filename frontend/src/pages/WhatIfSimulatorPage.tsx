import React, { useState, useEffect, useMemo } from 'react';
import { 
  Sliders, 
  RotateCcw, 
  Play, 
  Sparkles, 
  Info, 
  MapPin, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  Activity, 
  BarChart2, 
  History,
  Layers
} from 'lucide-react';
import type { GeocodingLocation, WeatherState } from '../types/weather';
import type { VegetationState } from '../types/vegetation';
import type { ScenarioSimulationRequest, ScenarioSimulationResponse } from '../types/spatial';
import { fetchScenarioSimulation } from '../services/spatialService';

interface WhatIfSimulatorPageProps {
  selectedLocation: GeocodingLocation;
  weatherState: WeatherState;
  vegetationState: VegetationState;
}

interface LocalHistoryItem {
  id: string;
  timestamp: string;
  locationName: string;
  modifiedSummary: string;
  scenarioProbability: number;
  probDeltaPp: number;
  scenarioInputs: {
    temperature_2m: number;
    relative_humidity_2m: number;
    wind_speed_10m: number;
    precipitation: number;
    ndvi: number;
    ndmi: number;
  };
}

export const WhatIfSimulatorPage: React.FC<WhatIfSimulatorPageProps> = ({
  selectedLocation,
  weatherState,
  vegetationState
}) => {
  // Extract real baseline telemetry from props or verified defaults
  const baselineTemp = weatherState.data?.current.temperature_2m ?? 24.5;
  const baselineHumidity = weatherState.data?.current.relative_humidity_2m ?? 45.0;
  const baselineWind = weatherState.data?.current.wind_speed_10m ?? 12.0;
  const baselinePrecip = weatherState.data?.current.precipitation ?? 0.0;
  const baselineNdvi = vegetationState.data?.latest_observation?.ndvi ?? 0.48;
  const baselineNdmi = vegetationState.data?.latest_observation?.ndmi ?? -0.05;
  const currentMonth = new Date().getMonth() + 1;

  // Scenario Editable Input State
  const [scenarioTemp, setScenarioTemp] = useState<number>(baselineTemp);
  const [scenarioHumidity, setScenarioHumidity] = useState<number>(baselineHumidity);
  const [scenarioWind, setScenarioWind] = useState<number>(baselineWind);
  const [scenarioPrecip, setScenarioPrecip] = useState<number>(baselinePrecip);
  const [scenarioNdvi, setScenarioNdvi] = useState<number>(baselineNdvi);
  const [scenarioNdmi, setScenarioNdmi] = useState<number>(baselineNdmi);

  // Sync scenario fields when location/weather baseline changes
  useEffect(() => {
    setScenarioTemp(baselineTemp);
    setScenarioHumidity(baselineHumidity);
    setScenarioWind(baselineWind);
    setScenarioPrecip(baselinePrecip);
    setScenarioNdvi(baselineNdvi);
    setScenarioNdmi(baselineNdmi);
    setSimulationResult(null);
    setSimulationError(null);
  }, [
    selectedLocation.name,
    baselineTemp,
    baselineHumidity,
    baselineWind,
    baselinePrecip,
    baselineNdvi,
    baselineNdmi
  ]);

  // Simulation execution state
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simulationResult, setSimulationResult] = useState<ScenarioSimulationResponse | null>(null);
  const [simulationError, setSimulationError] = useState<string | null>(null);
  const [historyList, setHistoryList] = useState<LocalHistoryItem[]>([]);

  // Check if scenario inputs have modifications compared to baseline
  const hasChanges = useMemo(() => {
    return (
      Math.abs(scenarioTemp - baselineTemp) > 0.05 ||
      Math.abs(scenarioHumidity - baselineHumidity) > 0.05 ||
      Math.abs(scenarioWind - baselineWind) > 0.05 ||
      Math.abs(scenarioPrecip - baselinePrecip) > 0.05 ||
      Math.abs(scenarioNdvi - baselineNdvi) > 0.005 ||
      Math.abs(scenarioNdmi - baselineNdmi) > 0.005
    );
  }, [
    scenarioTemp, baselineTemp,
    scenarioHumidity, baselineHumidity,
    scenarioWind, baselineWind,
    scenarioPrecip, baselinePrecip,
    scenarioNdvi, baselineNdvi,
    scenarioNdmi, baselineNdmi
  ]);

  // Reset scenario back to observed baseline
  const handleResetToObserved = () => {
    setScenarioTemp(baselineTemp);
    setScenarioHumidity(baselineHumidity);
    setScenarioWind(baselineWind);
    setScenarioPrecip(baselinePrecip);
    setScenarioNdvi(baselineNdvi);
    setScenarioNdmi(baselineNdmi);
    setSimulationResult(null);
    setSimulationError(null);
  };

  // Run scenario through canonical backend pipeline
  const handleRunScenario = async () => {
    setIsSimulating(true);
    setSimulationError(null);

    const requestPayload: ScenarioSimulationRequest = {
      latitude: selectedLocation.latitude,
      longitude: selectedLocation.longitude,
      location_name: selectedLocation.name,
      baseline_inputs: {
        temperature_2m: baselineTemp,
        relative_humidity_2m: baselineHumidity,
        wind_speed_10m: baselineWind,
        precipitation: baselinePrecip,
        ndvi: baselineNdvi,
        ndmi: baselineNdmi,
        month: currentMonth,
        latitude: selectedLocation.latitude,
        longitude: selectedLocation.longitude
      },
      scenario_inputs: {
        temperature_2m: scenarioTemp,
        relative_humidity_2m: scenarioHumidity,
        wind_speed_10m: scenarioWind,
        precipitation: scenarioPrecip,
        ndvi: scenarioNdvi,
        ndmi: scenarioNdmi,
        month: currentMonth,
        latitude: selectedLocation.latitude,
        longitude: selectedLocation.longitude
      }
    };

    try {
      const response = await fetchScenarioSimulation(requestPayload);
      setSimulationResult(response);

      // Add to local history list (max 5 items)
      const diffSummaryList: string[] = [];
      if (Math.abs(scenarioTemp - baselineTemp) > 0.05) diffSummaryList.push(`${scenarioTemp > baselineTemp ? '+' : ''}${(scenarioTemp - baselineTemp).toFixed(1)}°C`);
      if (Math.abs(scenarioHumidity - baselineHumidity) > 0.05) diffSummaryList.push(`${scenarioHumidity > baselineHumidity ? '+' : ''}${(scenarioHumidity - baselineHumidity).toFixed(0)}% RH`);
      if (Math.abs(scenarioWind - baselineWind) > 0.05) diffSummaryList.push(`${scenarioWind > baselineWind ? '+' : ''}${(scenarioWind - baselineWind).toFixed(1)} km/h`);
      
      const newHistoryItem: LocalHistoryItem = {
        id: Date.now().toString(),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        locationName: selectedLocation.name,
        modifiedSummary: diffSummaryList.length > 0 ? diffSummaryList.join(', ') : 'No Delta',
        scenarioProbability: response.scenario_prediction.calibrated_probability,
        probDeltaPp: response.probability_delta_pp,
        scenarioInputs: {
          temperature_2m: scenarioTemp,
          relative_humidity_2m: scenarioHumidity,
          wind_speed_10m: scenarioWind,
          precipitation: scenarioPrecip,
          ndvi: scenarioNdvi,
          ndmi: scenarioNdmi
        }
      };

      setHistoryList(prev => [newHistoryItem, ...prev.slice(0, 4)]);
    } catch (err: any) {
      console.error('Scenario simulation request failed:', err);
      setSimulationError(err.message || 'Unable to evaluate scenario. Please verify backend service availability.');
    } finally {
      setIsSimulating(false);
    }
  };

  const getRiskCategoryStyle = (category: string) => {
    switch (category.toUpperCase()) {
      case 'EXTREME':
      case 'VERY HIGH':
        return { bg: '#fee2e2', text: '#991b1b', border: '#fca5a5' };
      case 'HIGH':
        return { bg: '#ffedd5', text: '#c2410c', border: '#fdba74' };
      case 'MODERATE':
        return { bg: '#fef3c7', text: '#b45309', border: '#fcd34d' };
      case 'LOW':
      default:
        return { bg: '#dcfce7', text: '#166534', border: '#86efac' };
    }
  };

  return (
    <div className="page-container what-if-simulator-page">
      {/* Page Header Banner */}
      <div className="map-panel-card" style={{ marginBottom: '20px' }}>
        <div className="panel-header">
          <div className="panel-header-title">
            <Sliders className="panel-header-icon" style={{ color: '#059669' }} />
            <div>
              <h3>What-If Risk Simulator</h3>
              <span className="panel-subtitle">
                Explore how modified environmental conditions affect the model's output.
              </span>
            </div>
          </div>

          <div className="panel-controls">
            <span className="status-badge-pill configured">
              <Layers className="pill-icon" /> CANONICAL INFERENCE PIPELINE
            </span>
          </div>
        </div>

        {/* Location Context Bar */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          marginTop: '12px',
          padding: '10px 14px',
          backgroundColor: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '8px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MapPin size={16} style={{ color: '#059669' }} />
            <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#0f172a' }}>
              {selectedLocation.name}
            </span>
            <span style={{ fontSize: '0.74rem', color: '#64748b' }}>
              ({selectedLocation.latitude.toFixed(4)}°N, {selectedLocation.longitude.toFixed(4)}°E)
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.74rem', color: '#64748b' }}>
            <Clock size={14} />
            <span>Observation Reference: {new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} (Month {currentMonth})</span>
          </div>
        </div>

        {/* Scientific Non-Causal Notice */}
        <div style={{
          marginTop: '10px',
          padding: '8px 12px',
          backgroundColor: '#f0fdf4',
          border: '1px solid #bbf7d0',
          borderRadius: '6px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Info size={16} style={{ color: '#16a34a', flexShrink: 0 }} />
          <span style={{ fontSize: '0.74rem', color: '#166534', lineHeight: 1.4 }}>
            <strong>Scientific Notice:</strong> Scenario results represent model response to modified inputs and should not be interpreted as physical causation or operational wildfire forecasts.
          </span>
        </div>
      </div>

      {/* Two-Column Editor Layout: CURRENT CONDITIONS vs SCENARIO CONDITIONS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px', marginBottom: '20px' }}>
        
        {/* LEFT COLUMN: CURRENT CONDITIONS (Observed Baseline) */}
        <div className="map-panel-card">
          <div className="panel-header-title" style={{ marginBottom: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
            <Activity size={18} style={{ color: '#0284c7' }} />
            <div>
              <h4 style={{ margin: 0, fontSize: '0.92rem', color: '#0f172a' }}>CURRENT CONDITIONS</h4>
              <span style={{ fontSize: '0.70rem', color: '#64748b' }}>Observed telemetry baseline (Read-only)</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Air Temp */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', backgroundColor: '#f8fafc', borderRadius: '6px' }}>
              <span style={{ fontSize: '0.78rem', color: '#475569', fontWeight: 600 }}>Air Temperature</span>
              <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0f172a' }}>{baselineTemp.toFixed(1)} °C</span>
            </div>

            {/* Relative Humidity */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', backgroundColor: '#f8fafc', borderRadius: '6px' }}>
              <span style={{ fontSize: '0.78rem', color: '#475569', fontWeight: 600 }}>Relative Humidity</span>
              <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0f172a' }}>{baselineHumidity.toFixed(0)} %</span>
            </div>

            {/* Wind Speed */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', backgroundColor: '#f8fafc', borderRadius: '6px' }}>
              <span style={{ fontSize: '0.78rem', color: '#475569', fontWeight: 600 }}>Wind Speed</span>
              <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0f172a' }}>{baselineWind.toFixed(1)} km/h</span>
            </div>

            {/* Precipitation */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', backgroundColor: '#f8fafc', borderRadius: '6px' }}>
              <span style={{ fontSize: '0.78rem', color: '#475569', fontWeight: 600 }}>Precipitation</span>
              <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0f172a' }}>{baselinePrecip.toFixed(1)} mm</span>
            </div>

            {/* NDVI */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', backgroundColor: '#f8fafc', borderRadius: '6px' }}>
              <span style={{ fontSize: '0.78rem', color: '#475569', fontWeight: 600 }}>NDVI (Canopy Vigor)</span>
              <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0f172a' }}>{baselineNdvi.toFixed(3)}</span>
            </div>

            {/* NDMI */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', backgroundColor: '#f8fafc', borderRadius: '6px' }}>
              <span style={{ fontSize: '0.78rem', color: '#475569', fontWeight: 600 }}>NDMI (Canopy Moisture)</span>
              <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0f172a' }}>{baselineNdmi.toFixed(3)}</span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: SCENARIO CONDITIONS (Editable Modifiers) */}
        <div className="map-panel-card" style={{ border: '1.5px solid #059669' }}>
          <div className="panel-header-title" style={{ marginBottom: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sliders size={18} style={{ color: '#059669' }} />
              <div>
                <h4 style={{ margin: 0, fontSize: '0.92rem', color: '#0f172a' }}>SCENARIO CONDITIONS</h4>
                <span style={{ fontSize: '0.70rem', color: '#64748b' }}>Modify variables to simulate model response</span>
              </div>
            </div>

            <button
              type="button"
              className="retry-weather-btn"
              onClick={handleResetToObserved}
              title="Reset all scenario values to observed baseline"
              style={{ padding: '4px 8px', fontSize: '0.72rem' }}
            >
              <RotateCcw size={12} />
              <span>Reset to Observed</span>
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Air Temp Control */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#334155' }}>
                  Air Temperature (°C)
                </label>
                <span style={{ fontSize: '0.84rem', fontWeight: 800, color: '#059669' }}>
                  {scenarioTemp.toFixed(1)} °C
                  {scenarioTemp !== baselineTemp && (
                    <span style={{ fontSize: '0.70rem', marginLeft: '6px', color: scenarioTemp > baselineTemp ? '#dc2626' : '#2563eb' }}>
                      ({scenarioTemp > baselineTemp ? '+' : ''}{(scenarioTemp - baselineTemp).toFixed(1)}°C)
                    </span>
                  )}
                </span>
              </div>
              <input
                type="range"
                min="-5.0"
                max="50.0"
                step="0.5"
                value={scenarioTemp}
                onChange={(e) => setScenarioTemp(parseFloat(e.target.value))}
                style={{ width: '100%', accentColor: '#059669', cursor: 'pointer' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.66rem', color: '#94a3b8' }}>
                <span>-5.0°C</span>
                <span>25.0°C</span>
                <span>50.0°C</span>
              </div>
            </div>

            {/* Relative Humidity Control */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#334155' }}>
                  Relative Humidity (%)
                </label>
                <span style={{ fontSize: '0.84rem', fontWeight: 800, color: '#059669' }}>
                  {scenarioHumidity.toFixed(0)} %
                  {scenarioHumidity !== baselineHumidity && (
                    <span style={{ fontSize: '0.70rem', marginLeft: '6px', color: scenarioHumidity > baselineHumidity ? '#2563eb' : '#dc2626' }}>
                      ({scenarioHumidity > baselineHumidity ? '+' : ''}{(scenarioHumidity - baselineHumidity).toFixed(0)} pp)
                    </span>
                  )}
                </span>
              </div>
              <input
                type="range"
                min="5"
                max="100"
                step="1"
                value={scenarioHumidity}
                onChange={(e) => setScenarioHumidity(parseFloat(e.target.value))}
                style={{ width: '100%', accentColor: '#059669', cursor: 'pointer' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.66rem', color: '#94a3b8' }}>
                <span>5%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>

            {/* Wind Speed Control */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#334155' }}>
                  Wind Speed (km/h)
                </label>
                <span style={{ fontSize: '0.84rem', fontWeight: 800, color: '#059669' }}>
                  {scenarioWind.toFixed(1)} km/h
                  {scenarioWind !== baselineWind && (
                    <span style={{ fontSize: '0.70rem', marginLeft: '6px', color: scenarioWind > baselineWind ? '#dc2626' : '#2563eb' }}>
                      ({scenarioWind > baselineWind ? '+' : ''}{(scenarioWind - baselineWind).toFixed(1)} km/h)
                    </span>
                  )}
                </span>
              </div>
              <input
                type="range"
                min="0.0"
                max="80.0"
                step="0.5"
                value={scenarioWind}
                onChange={(e) => setScenarioWind(parseFloat(e.target.value))}
                style={{ width: '100%', accentColor: '#059669', cursor: 'pointer' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.66rem', color: '#94a3b8' }}>
                <span>0.0 km/h</span>
                <span>40.0 km/h</span>
                <span>80.0 km/h</span>
              </div>
            </div>

            {/* Precipitation Control */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#334155' }}>
                  Precipitation (mm)
                </label>
                <span style={{ fontSize: '0.84rem', fontWeight: 800, color: '#059669' }}>
                  {scenarioPrecip.toFixed(1)} mm
                </span>
              </div>
              <input
                type="range"
                min="0.0"
                max="50.0"
                step="0.5"
                value={scenarioPrecip}
                onChange={(e) => setScenarioPrecip(parseFloat(e.target.value))}
                style={{ width: '100%', accentColor: '#059669', cursor: 'pointer' }}
              />
            </div>

            {/* NDVI Control */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#334155' }}>
                  NDVI Vegetation Index [-0.2 to 1.0]
                </label>
                <span style={{ fontSize: '0.84rem', fontWeight: 800, color: '#059669' }}>
                  {scenarioNdvi.toFixed(3)}
                </span>
              </div>
              <input
                type="range"
                min="-0.2"
                max="1.0"
                step="0.01"
                value={scenarioNdvi}
                onChange={(e) => setScenarioNdvi(parseFloat(e.target.value))}
                style={{ width: '100%', accentColor: '#059669', cursor: 'pointer' }}
              />
            </div>

            {/* NDMI Control */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#334155' }}>
                  NDMI Canopy Moisture Index [-0.8 to 0.8]
                </label>
                <span style={{ fontSize: '0.84rem', fontWeight: 800, color: '#059669' }}>
                  {scenarioNdmi.toFixed(3)}
                </span>
              </div>
              <input
                type="range"
                min="-0.8"
                max="0.8"
                step="0.01"
                value={scenarioNdmi}
                onChange={(e) => setScenarioNdmi(parseFloat(e.target.value))}
                style={{ width: '100%', accentColor: '#059669', cursor: 'pointer' }}
              />
            </div>
          </div>

          {/* Run Scenario Button */}
          <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button
              type="button"
              onClick={handleRunScenario}
              disabled={isSimulating}
              style={{
                width: '100%',
                padding: '12px 16px',
                backgroundColor: '#059669',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '0.90rem',
                fontWeight: 700,
                cursor: isSimulating ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 2px 4px rgba(5, 150, 105, 0.25)',
                transition: 'background-color 0.2s ease'
              }}
            >
              <Play size={16} className={isSimulating ? 'spinner' : ''} />
              <span>{isSimulating ? 'Evaluating Canonical Model Response...' : 'RUN SCENARIO'}</span>
            </button>

            {!hasChanges && !simulationResult && (
              <span style={{ fontSize: '0.72rem', color: '#64748b', textAlign: 'center' }}>
                Scenario has no changes (matches observed baseline).
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Simulation States: Loading / Error / Empty / Results */}
      {isSimulating && (
        <div className="weather-state-box loading-state" style={{ marginBottom: '20px' }}>
          <Sparkles className="state-icon spinner" style={{ color: '#059669' }} />
          <div className="state-text">
            <strong>Running scenario through the canonical prediction pipeline...</strong>
            <p>Evaluating XGBoost decision trees, Platt sigmoid calibration, and TreeSHAP attribution for modified inputs.</p>
          </div>
        </div>
      )}

      {simulationError && (
        <div className="weather-state-box error-state" style={{ marginBottom: '20px' }}>
          <AlertTriangle className="state-icon error-color" />
          <div className="state-text">
            <strong>Unable to evaluate scenario</strong>
            <p>{simulationError}</p>
          </div>
        </div>
      )}

      {/* Results View */}
      {simulationResult && !isSimulating && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Main Comparison KPI Card */}
          <div className="map-panel-card">
            <div className="panel-header-title" style={{ marginBottom: '14px', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BarChart2 size={18} style={{ color: '#059669' }} />
                <h4>SCENARIO RESULT — MODEL RESPONSE COMPARISON</h4>
              </div>

              <span style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                padding: '3px 8px',
                borderRadius: '4px',
                backgroundColor: simulationResult.modified_features_count > 0 ? '#f0fdf4' : '#f1f5f9',
                color: simulationResult.modified_features_count > 0 ? '#166534' : '#64748b',
                border: '1px solid #cbd5e1'
              }}>
                {simulationResult.modified_features_count} {simulationResult.modified_features_count === 1 ? 'feature' : 'features'} modified
              </span>
            </div>

            {/* Probability & Risk Level Metric Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
              
              {/* Current Probability */}
              <div style={{ padding: '14px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.70rem', color: '#64748b', fontWeight: 600 }}>CURRENT CALIBRATED PROBABILITY</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', margin: '4px 0' }}>
                  {(simulationResult.baseline_prediction.calibrated_probability * 100).toFixed(2)}%
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{
                    fontSize: '0.66rem',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontWeight: 700,
                    ...getRiskCategoryStyle(simulationResult.baseline_prediction.risk_category)
                  }}>
                    {simulationResult.baseline_prediction.risk_category}
                  </span>
                  <span style={{ fontSize: '0.66rem', color: '#64748b' }}>Raw: {(simulationResult.baseline_prediction.raw_model_probability * 100).toFixed(1)}%</span>
                </div>
              </div>

              {/* Scenario Probability */}
              <div style={{ padding: '14px', backgroundColor: '#f0fdf4', borderRadius: '8px', border: '1.5px solid #86efac' }}>
                <div style={{ fontSize: '0.70rem', color: '#166534', fontWeight: 600 }}>SCENARIO CALIBRATED PROBABILITY</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#059669', margin: '4px 0' }}>
                  {(simulationResult.scenario_prediction.calibrated_probability * 100).toFixed(2)}%
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{
                    fontSize: '0.66rem',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontWeight: 700,
                    ...getRiskCategoryStyle(simulationResult.scenario_prediction.risk_category)
                  }}>
                    {simulationResult.scenario_prediction.risk_category}
                  </span>
                  <span style={{ fontSize: '0.66rem', color: '#166534' }}>Raw: {(simulationResult.scenario_prediction.raw_model_probability * 100).toFixed(1)}%</span>
                </div>
              </div>

              {/* Delta in Percentage Points */}
              <div style={{
                padding: '14px',
                backgroundColor: simulationResult.probability_delta_pp > 0 ? '#fff1f2' : simulationResult.probability_delta_pp < 0 ? '#f0fdf4' : '#f8fafc',
                borderRadius: '8px',
                border: `1.5px solid ${simulationResult.probability_delta_pp > 0 ? '#fca5a5' : simulationResult.probability_delta_pp < 0 ? '#bbf7d0' : '#e2e8f0'}`
              }}>
                <div style={{ fontSize: '0.70rem', color: '#64748b', fontWeight: 600 }}>CHANGE IN CALIBRATED PROBABILITY</div>
                <div style={{
                  fontSize: '1.6rem',
                  fontWeight: 800,
                  margin: '4px 0',
                  color: simulationResult.probability_delta_pp > 0 ? '#dc2626' : simulationResult.probability_delta_pp < 0 ? '#16a34a' : '#475569',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  {simulationResult.probability_delta_pp > 0 ? <TrendingUp size={20} /> : simulationResult.probability_delta_pp < 0 ? <TrendingDown size={20} /> : null}
                  <span>{simulationResult.probability_delta_pp > 0 ? '+' : ''}{simulationResult.probability_delta_pp.toFixed(2)} pp</span>
                </div>
                <span style={{ fontSize: '0.66rem', color: '#64748b' }}>
                  Raw Margin $\Delta$: {simulationResult.raw_margin_delta > 0 ? '+' : ''}{simulationResult.raw_margin_delta.toFixed(3)}
                </span>
              </div>
            </div>

            {/* Model Response Interpretation */}
            <div style={{
              marginTop: '14px',
              padding: '12px 14px',
              backgroundColor: '#f8fafc',
              borderLeft: '4px solid #059669',
              borderRadius: '4px'
            }}>
              <strong style={{ fontSize: '0.78rem', color: '#0f172a' }}>Model Interpretation:</strong>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.76rem', color: '#334155', lineHeight: 1.45 }}>
                {simulationResult.interpretation}
              </p>
            </div>
          </div>

          {/* Feature Modifications Summary Table */}
          {simulationResult.modified_features.length > 0 && (
            <div className="map-panel-card">
              <div className="panel-header-title" style={{ marginBottom: '12px' }}>
                <Sliders size={18} style={{ color: '#0284c7' }} />
                <h4>SCENARIO MODIFICATIONS ({simulationResult.modified_features_count} Changed)</h4>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                {simulationResult.modified_features.map((feat, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '10px 12px',
                      backgroundColor: '#f8fafc',
                      borderRadius: '6px',
                      border: '1px solid #e2e8f0',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px'
                    }}
                  >
                    <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#334155' }}>
                      {feat.display_name}
                    </span>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.80rem', color: '#64748b' }}>
                        {feat.baseline_value} {feat.unit} → <strong>{feat.scenario_value} {feat.unit}</strong>
                      </span>
                      <span style={{
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        color: feat.delta_value > 0 ? '#dc2626' : '#2563eb'
                      }}>
                        {feat.delta_value > 0 ? '+' : ''}{feat.delta_value} {feat.unit === '%' ? 'pp' : feat.unit}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TreeSHAP Explanation Comparison */}
          <div className="map-panel-card">
            <div className="panel-header-title" style={{ marginBottom: '12px' }}>
              <Sparkles size={18} style={{ color: '#d97706' }} />
              <div>
                <h4>TreeSHAP Attribution Comparison</h4>
                <span className="panel-subtitle">Current Model Explanation vs Scenario Model Explanation</span>
              </div>
            </div>

            {simulationResult.baseline_prediction.shap_explanation && simulationResult.scenario_prediction.shap_explanation ? (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.76rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left', color: '#475569' }}>
                      <th style={{ padding: '8px 10px' }}>Feature</th>
                      <th style={{ padding: '8px 10px' }}>Current Contribution ($\phi$)</th>
                      <th style={{ padding: '8px 10px' }}>Scenario Contribution ($\phi$)</th>
                      <th style={{ padding: '8px 10px' }}>Contribution Shift ($\Delta\phi$)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {simulationResult.scenario_prediction.shap_explanation.feature_contributions.map((sItem, idx) => {
                      const bItem = simulationResult.baseline_prediction.shap_explanation?.feature_contributions.find(
                        (b) => b.feature_name === sItem.feature_name
                      );
                      const bVal = bItem ? bItem.shap_value : 0;
                      const sVal = sItem.shap_value;
                      const diff = sVal - bVal;

                      return (
                        <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '8px 10px', fontWeight: 600, color: '#1e293b' }}>
                            {sItem.feature_name}
                          </td>
                          <td style={{ padding: '8px 10px', color: bVal >= 0 ? '#dc2626' : '#16a34a' }}>
                            {bVal >= 0 ? '+' : ''}{bVal.toFixed(3)}
                          </td>
                          <td style={{ padding: '8px 10px', fontWeight: 700, color: sVal >= 0 ? '#dc2626' : '#16a34a' }}>
                            {sVal >= 0 ? '+' : ''}{sVal.toFixed(3)}
                          </td>
                          <td style={{ padding: '8px 10px', fontWeight: 700, color: diff > 0 ? '#dc2626' : diff < 0 ? '#2563eb' : '#64748b' }}>
                            {diff > 0 ? '+' : ''}{diff.toFixed(3)} ({diff > 0 ? '↑ risk impact' : diff < 0 ? '↓ risk impact' : 'unchanged'})
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ padding: '16px', textAlign: 'center', color: '#64748b', fontSize: '0.78rem' }}>
                Scenario SHAP comparison unavailable for current feature vector.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Local Scenario History */}
      {historyList.length > 0 && (
        <div className="map-panel-card" style={{ marginTop: '20px' }}>
          <div className="panel-header-title" style={{ marginBottom: '12px' }}>
            <History size={18} style={{ color: '#475569' }} />
            <h4>RECENT SCENARIO RUNS (Session History)</h4>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
            {historyList.map((item) => (
              <div
                key={item.id}
                style={{
                  padding: '10px 12px',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ fontSize: '0.78rem', color: '#0f172a' }}>{item.locationName}</strong>
                  <span style={{ fontSize: '0.68rem', color: '#64748b' }}>{item.timestamp}</span>
                </div>

                <div style={{ fontSize: '0.72rem', color: '#475569' }}>
                  Changes: <strong>{item.modifiedSummary}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                  <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#059669' }}>
                    {(item.scenarioProbability * 100).toFixed(2)}%
                  </span>
                  <span style={{
                    fontSize: '0.70rem',
                    fontWeight: 700,
                    color: item.probDeltaPp > 0 ? '#dc2626' : item.probDeltaPp < 0 ? '#16a34a' : '#64748b'
                  }}>
                    {item.probDeltaPp > 0 ? '+' : ''}{item.probDeltaPp.toFixed(2)} pp
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setScenarioTemp(item.scenarioInputs.temperature_2m);
                    setScenarioHumidity(item.scenarioInputs.relative_humidity_2m);
                    setScenarioWind(item.scenarioInputs.wind_speed_10m);
                    setScenarioPrecip(item.scenarioInputs.precipitation);
                    setScenarioNdvi(item.scenarioInputs.ndvi);
                    setScenarioNdmi(item.scenarioInputs.ndmi);
                  }}
                  style={{
                    marginTop: '4px',
                    padding: '4px 8px',
                    fontSize: '0.68rem',
                    backgroundColor: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    color: '#334155'
                  }}
                >
                  Reload Scenario Inputs
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default WhatIfSimulatorPage;
