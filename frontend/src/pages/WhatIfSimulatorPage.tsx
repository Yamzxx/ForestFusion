import React, { useState, useEffect, useMemo } from 'react';
import { 
  RotateCcw, 
  Play, 
  Info, 
  MapPin, 
  AlertTriangle, 
  BarChart2, 
  History,
  ChevronRight,
  ChevronLeft,
  RefreshCw,
  Check,
  Thermometer,
  Droplets,
  Wind,
  CloudRain,
  Leaf,
  Layers,
  Sparkles
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
  // Stepper state: 1: Sector, 2: Conditions, 3: Parameters, 4: Execute, 5: Results
  const [currentStep, setCurrentStep] = useState<number>(1);

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
  const [scenarioMonth, setScenarioMonth] = useState<number>(currentMonth);

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
      Math.abs(scenarioNdmi - baselineNdmi) > 0.005 ||
      scenarioMonth !== currentMonth
    );
  }, [
    scenarioTemp, baselineTemp,
    scenarioHumidity, baselineHumidity,
    scenarioWind, baselineWind,
    scenarioPrecip, baselinePrecip,
    scenarioNdvi, baselineNdvi,
    scenarioNdmi, baselineNdmi,
    scenarioMonth, currentMonth
  ]);

  // Reset scenario back to observed baseline
  const handleResetToObserved = () => {
    setScenarioTemp(baselineTemp);
    setScenarioHumidity(baselineHumidity);
    setScenarioWind(baselineWind);
    setScenarioPrecip(baselinePrecip);
    setScenarioNdvi(baselineNdvi);
    setScenarioNdmi(baselineNdmi);
    setScenarioMonth(currentMonth);
    setSimulationResult(null);
    setSimulationError(null);
  };

  // Quick preset handlers
  const handleApplyPreset = (preset: 'heatwave' | 'gale' | 'monsoon' | 'drought') => {
    switch (preset) {
      case 'heatwave':
        setScenarioTemp(Math.min(46, baselineTemp + 6));
        setScenarioHumidity(Math.max(15, baselineHumidity - 20));
        setScenarioWind(baselineWind + 6);
        setScenarioPrecip(0);
        break;
      case 'gale':
        setScenarioTemp(baselineTemp + 2.5);
        setScenarioHumidity(Math.max(20, baselineHumidity - 10));
        setScenarioWind(Math.min(55, baselineWind + 25));
        break;
      case 'monsoon':
        setScenarioTemp(Math.max(18, baselineTemp - 4));
        setScenarioHumidity(Math.min(95, baselineHumidity + 35));
        setScenarioPrecip(baselinePrecip + 18);
        setScenarioNdvi(Math.min(0.85, baselineNdvi + 0.12));
        setScenarioNdmi(Math.min(0.40, baselineNdmi + 0.20));
        break;
      case 'drought':
        setScenarioNdvi(Math.max(0.18, baselineNdvi - 0.18));
        setScenarioNdmi(Math.max(-0.25, baselineNdmi - 0.20));
        setScenarioHumidity(Math.max(15, baselineHumidity - 18));
        break;
    }
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
        month: scenarioMonth,
        latitude: selectedLocation.latitude,
        longitude: selectedLocation.longitude
      }
    };

    try {
      const response = await fetchScenarioSimulation(requestPayload);
      setSimulationResult(response);
      setCurrentStep(5); // Advance to results step

      // Append to local session history
      const modSummary = [
        scenarioTemp !== baselineTemp ? `T: ${scenarioTemp > baselineTemp ? '+' : ''}${(scenarioTemp - baselineTemp).toFixed(1)}°C` : null,
        scenarioHumidity !== baselineHumidity ? `RH: ${(scenarioHumidity - baselineHumidity).toFixed(0)}%` : null,
        scenarioWind !== baselineWind ? `W: ${(scenarioWind - baselineWind).toFixed(1)}km/h` : null,
        scenarioNdvi !== baselineNdvi ? `NDVI: ${(scenarioNdvi - baselineNdvi).toFixed(2)}` : null
      ].filter(Boolean).join(', ') || 'Default baseline';

      const historyItem: LocalHistoryItem = {
        id: `sim-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        locationName: selectedLocation.name,
        modifiedSummary: modSummary,
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

      setHistoryList(prev => [historyItem, ...prev.slice(0, 9)]);
    } catch (err: any) {
      console.error('Scenario simulation failed:', err);
      setSimulationError(err.message || 'Simulation execution failed. Please verify inputs and backend connection.');
    } finally {
      setIsSimulating(false);
    }
  };

  const getRiskCategoryStyle = (cat: string) => {
    switch (cat.toUpperCase()) {
      case 'EXTREME': return { bg: '#FEE2E2', text: '#B91C1C', border: '#FECACA' };
      case 'HIGH': return { bg: '#FEF3C7', text: '#92400E', border: '#FDE68A' };
      case 'MODERATE': return { bg: '#FEF9C3', text: '#854D0E', border: '#FEF08A' };
      default: return { bg: '#EBF3EF', text: '#17452F', border: '#C2DBCD' };
    }
  };

  const STEPS = [
    { number: 1, label: 'Sector Context' },
    { number: 2, label: 'Environmental Inputs' },
    { number: 3, label: 'Seasonal Modifiers' },
    { number: 4, label: 'Execute Simulation' },
    { number: 5, label: 'Comparative Outcomes' },
  ];

  return (
    <div className="page-container what-if-simulator-page" style={{ maxWidth: '1240px', margin: '0 auto', padding: '24px 20px' }}>
      {/* 1. Main Header with Full-Width Dense Forest Canopy Photography */}
      <div 
        style={{
          position: 'relative',
          borderRadius: '6px',
          overflow: 'hidden',
          marginBottom: '22px',
          border: '1px solid #DCE3DD',
          minHeight: '200px',
          display: 'flex',
          alignItems: 'center',
          backgroundImage: 'linear-gradient(90deg, rgba(23, 69, 47, 0.94) 0%, rgba(23, 69, 47, 0.85) 60%, rgba(23, 69, 47, 0.60) 100%), url(/assets/images/canopy_aerial.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center 35%',
          padding: '28px 32px',
          boxShadow: '0 2px 6px rgba(0, 0, 0, 0.05)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ maxWidth: '680px' }}>
            <h1 style={{ 
              fontSize: '1.6rem', 
              fontWeight: 800, 
              color: '#FFFFFF', 
              margin: '0 0 6px 0', 
              letterSpacing: '-0.01em', 
              lineHeight: 1.25 
            }}>
              What-If Environmental Scenario Simulator
            </h1>
            <p style={{ 
              fontSize: '0.90rem', 
              color: '#EBF3EF', 
              margin: 0, 
              lineHeight: 1.5, 
              fontWeight: 400 
            }}>
              Counterfactual analysis of wildfire susceptibility under changing environmental conditions.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              onClick={handleResetToObserved}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.16)',
                color: '#FFFFFF',
                border: '1px solid rgba(255, 255, 255, 0.35)',
                borderRadius: '4px',
                padding: '8px 14px',
                fontSize: '0.80rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                backdropFilter: 'blur(4px)',
                transition: 'background-color 0.15s ease'
              }}
            >
              <RotateCcw size={13} />
              <span>Reset to Baseline</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Professional Five-Step Horizontal Progress Indicator */}
      <div style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid #DCE3DD',
        borderRadius: '6px',
        padding: '14px 20px',
        marginBottom: '22px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          overflowX: 'auto',
          gap: '8px'
        }}>
          {STEPS.map((s, idx) => {
            const isActive = currentStep === s.number;
            const isCompleted = currentStep > s.number;

            return (
              <React.Fragment key={s.number}>
                <button
                  type="button"
                  onClick={() => setCurrentStep(s.number)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    backgroundColor: isActive ? '#EBF3EF' : 'transparent',
                    border: `1px solid ${isActive ? '#17452F' : 'transparent'}`,
                    borderRadius: '4px',
                    padding: '6px 12px',
                    cursor: 'pointer',
                    color: isActive ? '#17452F' : isCompleted ? '#347653' : '#55635C',
                    transition: 'all 0.15s ease',
                    flexShrink: 0
                  }}
                >
                  <div style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '4px',
                    backgroundColor: isActive ? '#17452F' : isCompleted ? '#347653' : '#F5F7F4',
                    border: `1px solid ${isActive ? '#17452F' : isCompleted ? '#347653' : '#DCE3DD'}`,
                    color: isActive || isCompleted ? '#FFFFFF' : '#55635C',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.74rem',
                    fontWeight: 700
                  }}>
                    {isCompleted ? <Check size={14} /> : s.number}
                  </div>
                  <span style={{ 
                    fontSize: '0.80rem', 
                    fontWeight: isActive ? 800 : isCompleted ? 600 : 500, 
                    whiteSpace: 'nowrap' 
                  }}>
                    {s.label}
                  </span>
                </button>

                {idx < STEPS.length - 1 && (
                  <div style={{ 
                    flex: 1, 
                    height: '2px', 
                    backgroundColor: isCompleted ? '#347653' : '#DCE3DD', 
                    minWidth: '16px' 
                  }} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* 3. STEP CONTENT AREAS */}

      {/* STEP 1: Sector Context (Balanced Two-Column Layout with Indian Tropical Forest Landscape) */}
      {currentStep === 1 && (
        <div style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #DCE3DD',
          borderRadius: '6px',
          padding: '24px',
          marginBottom: '22px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px', borderBottom: '1px solid #E2E8F0', paddingBottom: '12px' }}>
            <MapPin size={20} style={{ color: '#17452F' }} />
            <div>
              <h3 style={{ fontSize: '1.08rem', fontWeight: 800, color: '#17452F', margin: 0 }}>
                1. Target Forest Sector & Coordinates
              </h3>
              <span style={{ fontSize: '0.76rem', color: '#55635C' }}>
                Verify spatial coordinates and live baseline telemetry ingested from environmental monitoring nodes
              </span>
            </div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '24px',
            alignItems: 'stretch',
            marginBottom: '20px'
          }}>
            {/* Left Column: Sector Information */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ backgroundColor: '#F5F7F4', padding: '16px', borderRadius: '4px', border: '1px solid #DCE3DD' }}>
                <div style={{ fontSize: '0.70rem', color: '#55635C', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
                  Selected Forest Sector
                </div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#17452F', marginTop: '2px' }}>
                  {selectedLocation.name}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#55635C', marginTop: '4px' }}>
                  Administrative Region: {selectedLocation.admin1 || 'Biosphere Reserve'}, {selectedLocation.country || 'India'}
                </div>
              </div>

              <div style={{ backgroundColor: '#F5F7F4', padding: '16px', borderRadius: '4px', border: '1px solid #DCE3DD' }}>
                <div style={{ fontSize: '0.70rem', color: '#55635C', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
                  Spatial Coordinates & Projection
                </div>
                <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#252B28', fontFamily: 'monospace', marginTop: '2px' }}>
                  {selectedLocation.latitude.toFixed(4)}°N, {selectedLocation.longitude.toFixed(4)}°E
                </div>
                <div style={{ fontSize: '0.76rem', color: '#55635C', marginTop: '4px' }}>
                  Cartographic Standard: EPSG:4326 (WGS 84 Geographic)
                </div>
              </div>

              <div style={{ backgroundColor: '#F5F7F4', padding: '16px', borderRadius: '4px', border: '1px solid #DCE3DD' }}>
                <div style={{ fontSize: '0.70rem', color: '#55635C', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
                  Current Telemetry Baseline (Observed)
                </div>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(3, 1fr)', 
                  gap: '10px', 
                  marginTop: '8px' 
                }}>
                  <div>
                    <span style={{ fontSize: '0.70rem', color: '#55635C' }}>Air Temp (2m):</span>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#252B28', fontFamily: 'monospace' }}>
                      {baselineTemp.toFixed(1)} °C
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.70rem', color: '#55635C' }}>Rel. Humidity:</span>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#252B28', fontFamily: 'monospace' }}>
                      {baselineHumidity.toFixed(0)} %
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.70rem', color: '#55635C' }}>Wind (10m):</span>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#252B28', fontFamily: 'monospace' }}>
                      {baselineWind.toFixed(1)} km/h
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.70rem', color: '#55635C' }}>Rainfall:</span>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#252B28', fontFamily: 'monospace' }}>
                      {baselinePrecip.toFixed(1)} mm
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.70rem', color: '#55635C' }}>Canopy NDVI:</span>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#17452F', fontFamily: 'monospace' }}>
                      {baselineNdvi.toFixed(3)}
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.70rem', color: '#55635C' }}>Canopy NDMI:</span>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#17452F', fontFamily: 'monospace' }}>
                      {baselineNdmi.toFixed(3)}
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: '0.72rem', color: '#347653', marginTop: '10px', fontWeight: 600 }}>
                  ● Ingested via Open-Meteo & Copernicus Sentinel-2 MSI
                </div>
              </div>
            </div>

            {/* Right Column: High-Quality Forest Sector Photography */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              borderRadius: '4px',
              overflow: 'hidden',
              border: '1px solid #DCE3DD',
              backgroundColor: '#F5F7F4'
            }}>
              <div style={{
                position: 'relative',
                flex: 1,
                minHeight: '260px',
                backgroundImage: 'url(/assets/images/environmental_mist.jpg)',
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}>
                <div style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  backgroundColor: 'rgba(23, 69, 47, 0.88)',
                  color: '#FFFFFF',
                  padding: '3px 8px',
                  borderRadius: '3px',
                  fontSize: '0.70rem',
                  fontWeight: 700,
                  letterSpacing: '0.04em'
                }}>
                  FIELD TELEMETRY NODE
                </div>
              </div>
              <div style={{
                padding: '12px 14px',
                backgroundColor: '#FFFFFF',
                borderTop: '1px solid #DCE3DD',
                fontSize: '0.76rem',
                color: '#55635C',
                lineHeight: 1.45
              }}>
                <strong style={{ color: '#17452F' }}>Western Ghats Ecological Reserve:</strong> Continuous automated weather station (AWS) and flux tower monitoring canopy micro-meteorology across the Nilgiri-Wayanad sector.
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #E2E8F0', paddingTop: '16px' }}>
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              style={{
                backgroundColor: '#17452F',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '4px',
                padding: '10px 20px',
                fontSize: '0.84rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span>Configure Environmental Inputs</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Environmental Inputs (Organized Interface + Contextual Vegetation Photo Panel) */}
      {currentStep === 2 && (
        <div style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #DCE3DD',
          borderRadius: '6px',
          padding: '24px',
          marginBottom: '22px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', borderBottom: '1px solid #E2E8F0', paddingBottom: '12px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ fontSize: '1.08rem', fontWeight: 800, color: '#17452F', margin: 0 }}>
                2. Environmental Inputs & Parameter Controls
              </h3>
              <span style={{ fontSize: '0.76rem', color: '#55635C' }}>
                Adjust micro-meteorological variables and satellite canopy indices relative to real-time telemetry
              </span>
            </div>

            {hasChanges && (
              <span style={{ 
                fontSize: '0.74rem', 
                padding: '3px 10px', 
                borderRadius: '4px', 
                backgroundColor: '#FFFBEB', 
                color: '#C65A32', 
                border: '1px solid #FDE68A', 
                fontWeight: 700 
              }}>
                ▲ Active Scenario Modifiers Applied
              </span>
            )}
          </div>

          {/* Quick Scenario Presets */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px', 
            marginBottom: '20px', 
            flexWrap: 'wrap',
            padding: '10px 14px',
            backgroundColor: '#F5F7F4',
            borderRadius: '4px',
            border: '1px solid #DCE3DD'
          }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#17452F', textTransform: 'uppercase' }}>
              Scenario Presets:
            </span>
            <button
              type="button"
              onClick={() => handleApplyPreset('heatwave')}
              style={{
                backgroundColor: '#FFFFFF',
                color: '#C65A32',
                border: '1px solid #DCE3DD',
                borderRadius: '4px',
                padding: '4px 10px',
                fontSize: '0.76rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Heatwave & Aridity (+6°C, -20% RH)
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset('gale')}
              style={{
                backgroundColor: '#FFFFFF',
                color: '#252B28',
                border: '1px solid #DCE3DD',
                borderRadius: '4px',
                padding: '4px 10px',
                fontSize: '0.76rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              High Wind Desiccation (+25 km/h Wind)
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset('monsoon')}
              style={{
                backgroundColor: '#FFFFFF',
                color: '#347653',
                border: '1px solid #DCE3DD',
                borderRadius: '4px',
                padding: '4px 10px',
                fontSize: '0.76rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Monsoon Canopy Saturation (+18mm Rain, +35% RH)
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset('drought')}
              style={{
                backgroundColor: '#FFFFFF',
                color: '#92400E',
                border: '1px solid #DCE3DD',
                borderRadius: '4px',
                padding: '4px 10px',
                fontSize: '0.76rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Canopy Moisture Deficit (NDMI -0.20)
            </button>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '24px',
            marginBottom: '24px',
            alignItems: 'start'
          }}>
            {/* Left Section: 6 Parameter Controls */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
              {/* 1. Temperature */}
              <div style={{ backgroundColor: '#F5F7F4', padding: '16px', borderRadius: '4px', border: '1px solid #DCE3DD' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Thermometer size={16} style={{ color: '#C65A32' }} />
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#252B28' }}>Air Temperature (2m)</span>
                  </div>
                  <span style={{ fontSize: '0.90rem', fontWeight: 800, color: '#17452F', fontFamily: 'monospace' }}>
                    {scenarioTemp.toFixed(1)} °C
                    {scenarioTemp !== baselineTemp && (
                      <span style={{ fontSize: '0.72rem', marginLeft: '6px', color: scenarioTemp > baselineTemp ? '#C65A32' : '#347653' }}>
                        ({scenarioTemp > baselineTemp ? '+' : ''}{(scenarioTemp - baselineTemp).toFixed(1)}°C)
                      </span>
                    )}
                  </span>
                </div>
                <input 
                  type="range"
                  min={15}
                  max={48}
                  step={0.5}
                  value={scenarioTemp}
                  onChange={(e) => setScenarioTemp(Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#17452F', cursor: 'pointer' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.70rem', color: '#55635C', marginTop: '4px' }}>
                  <span>15 °C (Cool)</span>
                  <span style={{ fontWeight: 600 }}>Observed: {baselineTemp.toFixed(1)} °C</span>
                  <span>48 °C (Heatwave)</span>
                </div>
              </div>

              {/* 2. Relative Humidity */}
              <div style={{ backgroundColor: '#F5F7F4', padding: '16px', borderRadius: '4px', border: '1px solid #DCE3DD' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Droplets size={16} style={{ color: '#0284C7' }} />
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#252B28' }}>Relative Humidity (2m)</span>
                  </div>
                  <span style={{ fontSize: '0.90rem', fontWeight: 800, color: '#0284C7', fontFamily: 'monospace' }}>
                    {scenarioHumidity.toFixed(0)} %
                    {scenarioHumidity !== baselineHumidity && (
                      <span style={{ fontSize: '0.72rem', marginLeft: '6px', color: scenarioHumidity < baselineHumidity ? '#C65A32' : '#347653' }}>
                        ({scenarioHumidity > baselineHumidity ? '+' : ''}{(scenarioHumidity - baselineHumidity).toFixed(0)}%)
                      </span>
                    )}
                  </span>
                </div>
                <input 
                  type="range"
                  min={10}
                  max={95}
                  step={1}
                  value={scenarioHumidity}
                  onChange={(e) => setScenarioHumidity(Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#0284C7', cursor: 'pointer' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.70rem', color: '#55635C', marginTop: '4px' }}>
                  <span>10% (Arid Desiccation)</span>
                  <span style={{ fontWeight: 600 }}>Observed: {baselineHumidity.toFixed(0)}%</span>
                  <span>95% (Saturated)</span>
                </div>
              </div>

              {/* 3. Wind Speed */}
              <div style={{ backgroundColor: '#F5F7F4', padding: '16px', borderRadius: '4px', border: '1px solid #DCE3DD' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Wind size={16} style={{ color: '#347653' }} />
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#252B28' }}>Wind Velocity (10m)</span>
                  </div>
                  <span style={{ fontSize: '0.90rem', fontWeight: 800, color: '#252B28', fontFamily: 'monospace' }}>
                    {scenarioWind.toFixed(1)} km/h
                    {scenarioWind !== baselineWind && (
                      <span style={{ fontSize: '0.72rem', marginLeft: '6px', color: scenarioWind > baselineWind ? '#C65A32' : '#347653' }}>
                        ({scenarioWind > baselineWind ? '+' : ''}{(scenarioWind - baselineWind).toFixed(1)} km/h)
                      </span>
                    )}
                  </span>
                </div>
                <input 
                  type="range"
                  min={0}
                  max={60}
                  step={1}
                  value={scenarioWind}
                  onChange={(e) => setScenarioWind(Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#17452F', cursor: 'pointer' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.70rem', color: '#55635C', marginTop: '4px' }}>
                  <span>0 km/h (Calm)</span>
                  <span style={{ fontWeight: 600 }}>Observed: {baselineWind.toFixed(1)} km/h</span>
                  <span>60 km/h (Gale)</span>
                </div>
              </div>

              {/* 4. Precipitation */}
              <div style={{ backgroundColor: '#F5F7F4', padding: '16px', borderRadius: '4px', border: '1px solid #DCE3DD' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CloudRain size={16} style={{ color: '#0284C7' }} />
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#252B28' }}>Precipitation</span>
                  </div>
                  <span style={{ fontSize: '0.90rem', fontWeight: 800, color: '#0284C7', fontFamily: 'monospace' }}>
                    {scenarioPrecip.toFixed(1)} mm
                  </span>
                </div>
                <input 
                  type="range"
                  min={0}
                  max={50}
                  step={0.5}
                  value={scenarioPrecip}
                  onChange={(e) => setScenarioPrecip(Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#0284C7', cursor: 'pointer' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.70rem', color: '#55635C', marginTop: '4px' }}>
                  <span>0 mm (Dry)</span>
                  <span style={{ fontWeight: 600 }}>Observed: {baselinePrecip.toFixed(1)} mm</span>
                  <span>50 mm (Heavy Rain)</span>
                </div>
              </div>

              {/* 5. NDVI */}
              <div style={{ backgroundColor: '#F5F7F4', padding: '16px', borderRadius: '4px', border: '1px solid #DCE3DD' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Leaf size={16} style={{ color: '#17452F' }} />
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#252B28' }}>Canopy NDVI Index</span>
                  </div>
                  <span style={{ fontSize: '0.90rem', fontWeight: 800, color: '#17452F', fontFamily: 'monospace' }}>
                    {scenarioNdvi.toFixed(3)}
                  </span>
                </div>
                <input 
                  type="range"
                  min={0.1}
                  max={0.9}
                  step={0.01}
                  value={scenarioNdvi}
                  onChange={(e) => setScenarioNdvi(Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#17452F', cursor: 'pointer' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.70rem', color: '#55635C', marginTop: '4px' }}>
                  <span>0.10 (Severe Stress)</span>
                  <span style={{ fontWeight: 600 }}>Observed: {baselineNdvi.toFixed(3)}</span>
                  <span>0.90 (Lush Green)</span>
                </div>
              </div>

              {/* 6. NDMI */}
              <div style={{ backgroundColor: '#F5F7F4', padding: '16px', borderRadius: '4px', border: '1px solid #DCE3DD' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Layers size={16} style={{ color: '#347653' }} />
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#252B28' }}>Canopy NDMI Moisture</span>
                  </div>
                  <span style={{ fontSize: '0.90rem', fontWeight: 800, color: '#0284C7', fontFamily: 'monospace' }}>
                    {scenarioNdmi.toFixed(3)}
                  </span>
                </div>
                <input 
                  type="range"
                  min={-0.3}
                  max={0.5}
                  step={0.01}
                  value={scenarioNdmi}
                  onChange={(e) => setScenarioNdmi(Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#0284C7', cursor: 'pointer' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.70rem', color: '#55635C', marginTop: '4px' }}>
                  <span>-0.30 (Water Deficit)</span>
                  <span style={{ fontWeight: 600 }}>Observed: {baselineNdmi.toFixed(3)}</span>
                  <span>+0.50 (Hydrated)</span>
                </div>
              </div>
            </div>

            {/* Right Section: Contextual Vegetation Photo Panel */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              borderRadius: '4px',
              overflow: 'hidden',
              border: '1px solid #DCE3DD',
              backgroundColor: '#F5F7F4'
            }}>
              <div style={{
                position: 'relative',
                minHeight: '230px',
                backgroundImage: 'url(/assets/images/vegetation_moisture.jpg)',
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}>
                <div style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  backgroundColor: 'rgba(23, 69, 47, 0.90)',
                  color: '#FFFFFF',
                  padding: '3px 8px',
                  borderRadius: '3px',
                  fontSize: '0.70rem',
                  fontWeight: 700
                }}>
                  BOTANICAL FIELDWORK REFERENCE
                </div>
              </div>
              <div style={{
                padding: '14px',
                backgroundColor: '#FFFFFF',
                borderTop: '1px solid #DCE3DD',
                fontSize: '0.76rem',
                color: '#55635C',
                lineHeight: 1.5
              }}>
                <strong style={{ color: '#17452F' }}>Foliage Moisture & Ignition Dynamics:</strong> Sentinel-2 NDMI tracks spongy mesophyll water content in the tree canopy. When relative humidity drops below 30% and NDMI becomes negative, fine dead forest litter equilibrates rapidly to ambient dryness.
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #E2E8F0', paddingTop: '16px' }}>
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              style={{
                backgroundColor: '#FFFFFF',
                color: '#55635C',
                border: '1px solid #DCE3DD',
                borderRadius: '4px',
                padding: '9px 16px',
                fontSize: '0.82rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <ChevronLeft size={16} />
              <span>Back to Sector</span>
            </button>

            <button
              type="button"
              onClick={() => setCurrentStep(3)}
              style={{
                backgroundColor: '#17452F',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '4px',
                padding: '10px 20px',
                fontSize: '0.84rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span>Configure Seasonal Modifiers</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Seasonal Modifiers (Dedicated Section + 4 Real Forest Photographs) */}
      {currentStep === 3 && (
        <div style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #DCE3DD',
          borderRadius: '6px',
          padding: '24px',
          marginBottom: '22px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)'
        }}>
          <div style={{ marginBottom: '18px', borderBottom: '1px solid #E2E8F0', paddingBottom: '12px' }}>
            <h3 style={{ fontSize: '1.08rem', fontWeight: 800, color: '#17452F', margin: 0 }}>
              3. Seasonal Modifiers & Phenological Prior Cycles
            </h3>
            <span style={{ fontSize: '0.76rem', color: '#55635C' }}>
              Incorporate annual monsoon transitions, leaf senescence, and seasonal fuel bed curing
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            <div style={{ backgroundColor: '#F5F7F4', padding: '16px', borderRadius: '4px', border: '1px solid #DCE3DD' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#252B28', marginBottom: '6px' }}>
                Simulated Calendar Month
              </div>
              <select
                value={scenarioMonth}
                onChange={(e) => setScenarioMonth(Number(e.target.value))}
                style={{
                  backgroundColor: '#FFFFFF',
                  color: '#252B28',
                  border: '1px solid #DCE3DD',
                  borderRadius: '4px',
                  padding: '8px 12px',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  width: '100%',
                  cursor: 'pointer'
                }}
              >
                {[
                  'January (Post-Monsoon Drying Phase)', 
                  'February (Dry Season Begins — Fuel Curing)', 
                  'March (Peak Fire Weather & High Flammability)',
                  'April (Pre-Monsoon Arid Solar Loading)', 
                  'May (Extreme Heatwave Window)', 
                  'June (Southwest Monsoon Onset)',
                  'July (Heavy Monsoon Deluge — Complete Quenching)', 
                  'August (Saturated Canopy Phase)', 
                  'September (Late Monsoon Recession)',
                  'October (Post-Monsoon Transition)', 
                  'November (Northeast Monsoon Influx)', 
                  'December (Cool Dry Winter Regime)'
                ].map((name, i) => (
                  <option key={i + 1} value={i + 1}>Month {i + 1}: {name}</option>
                ))}
              </select>
              <div style={{ fontSize: '0.74rem', color: '#55635C', marginTop: '6px' }}>
                Simulates seasonal prior weighting for natural biomass moisture cycles and solar incidence angles.
              </div>
            </div>

            <div style={{ backgroundColor: '#F5F7F4', padding: '16px', borderRadius: '4px', border: '1px solid #DCE3DD' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#252B28', marginBottom: '6px' }}>
                Model Pipeline Specification
              </div>
              <div style={{ fontSize: '0.90rem', fontWeight: 800, color: '#17452F', marginTop: '2px' }}>
                XGBoost v1.0 + Platt Sigmoid Calibration
              </div>
              <div style={{ fontSize: '0.74rem', color: '#55635C', marginTop: '6px' }}>
                Probability values are rigorously calibrated against empirical out-of-fold fire validation samples.
              </div>
            </div>
          </div>

          {/* Real Forest Photography Grid: 4 Seasonal Conditions */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#17452F', textTransform: 'uppercase', marginBottom: '12px' }}>
              Ecological Phenology & Canopy Fuel States
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '14px'
            }}>
              {/* Photo 1: Dry Season */}
              <div style={{
                borderRadius: '4px',
                overflow: 'hidden',
                border: '1px solid #DCE3DD',
                backgroundColor: '#F5F7F4'
              }}>
                <div style={{
                  height: '130px',
                  backgroundImage: 'url(/assets/images/dry_season_forest.jpg)',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }} />
                <div style={{ padding: '10px 12px' }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#17452F' }}>
                    Dry Season Forest
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#55635C', marginTop: '2px' }}>
                    Thinned canopy, desiccated ground leaf litter, and low fuel moisture.
                  </div>
                </div>
              </div>

              {/* Photo 2: Monsoon Forest */}
              <div style={{
                borderRadius: '4px',
                overflow: 'hidden',
                border: '1px solid #DCE3DD',
                backgroundColor: '#F5F7F4'
              }}>
                <div style={{
                  height: '130px',
                  backgroundImage: 'url(/assets/images/monsoon_forest.jpg)',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }} />
                <div style={{ padding: '10px 12px' }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#17452F' }}>
                    Monsoon Rain Forest
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#55635C', marginTop: '2px' }}>
                    Saturated leaf layers, high humidity, and fire ignition suppression.
                  </div>
                </div>
              </div>

              {/* Photo 3: Continuous Canopy */}
              <div style={{
                borderRadius: '4px',
                overflow: 'hidden',
                border: '1px solid #DCE3DD',
                backgroundColor: '#F5F7F4'
              }}>
                <div style={{
                  height: '130px',
                  backgroundImage: 'url(/assets/images/canopy_aerial.jpg)',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }} />
                <div style={{ padding: '10px 12px' }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#17452F' }}>
                    Forest Canopy Architecture
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#55635C', marginTop: '2px' }}>
                    Continuous tree crown density dictating wind spread corridors.
                  </div>
                </div>
              </div>

              {/* Photo 4: Vegetation Moisture */}
              <div style={{
                borderRadius: '4px',
                overflow: 'hidden',
                border: '1px solid #DCE3DD',
                backgroundColor: '#F5F7F4'
              }}>
                <div style={{
                  height: '130px',
                  backgroundImage: 'url(/assets/images/vegetation_moisture.jpg)',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }} />
                <div style={{ padding: '10px 12px' }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#17452F' }}>
                    Vegetation Moisture Status
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#55635C', marginTop: '2px' }}>
                    Live Fuel Moisture Content (LFMC) measured via Sentinel-2 NDMI.
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #E2E8F0', paddingTop: '16px' }}>
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              style={{
                backgroundColor: '#FFFFFF',
                color: '#55635C',
                border: '1px solid #DCE3DD',
                borderRadius: '4px',
                padding: '9px 16px',
                fontSize: '0.82rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <ChevronLeft size={16} />
              <span>Back to Conditions</span>
            </button>

            <button
              type="button"
              onClick={() => setCurrentStep(4)}
              style={{
                backgroundColor: '#17452F',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '4px',
                padding: '10px 20px',
                fontSize: '0.84rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span>Proceed to Simulation Execution</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: Execute Simulation (Summary + Supporting Wildfire Photography) */}
      {currentStep === 4 && (
        <div style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #DCE3DD',
          borderRadius: '6px',
          padding: '24px',
          marginBottom: '22px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)'
        }}>
          <div style={{ marginBottom: '18px', borderBottom: '1px solid #E2E8F0', paddingBottom: '12px' }}>
            <h3 style={{ fontSize: '1.08rem', fontWeight: 800, color: '#17452F', margin: 0 }}>
              4. Execute Scenario Inference Pipeline
            </h3>
            <span style={{ fontSize: '0.76rem', color: '#55635C' }}>
              Confirm your modified input vector and run the counterfactual scenario through the calibrated XGBoost model
            </span>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '24px',
            marginBottom: '24px',
            alignItems: 'stretch'
          }}>
            {/* Left Column: Comprehensive Scenario Vector Summary */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ overflowX: 'auto', border: '1px solid #DCE3DD', borderRadius: '4px' }}>
                <table className="scientific-data-table" style={{ width: '100%', fontSize: '0.80rem' }}>
                  <thead>
                    <tr>
                      <th style={{ backgroundColor: '#17452F', color: '#FFFFFF', padding: '8px 12px' }}>Parameter</th>
                      <th style={{ backgroundColor: '#17452F', color: '#FFFFFF', padding: '8px 12px' }}>Observed Baseline</th>
                      <th style={{ backgroundColor: '#17452F', color: '#FFFFFF', padding: '8px 12px' }}>Configured Scenario</th>
                      <th style={{ backgroundColor: '#17452F', color: '#FFFFFF', padding: '8px 12px' }}>Delta</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ fontWeight: 600 }}>Air Temperature</td>
                      <td>{baselineTemp.toFixed(1)} °C</td>
                      <td style={{ fontWeight: 700, color: '#17452F' }}>{scenarioTemp.toFixed(1)} °C</td>
                      <td style={{ fontWeight: 700, color: scenarioTemp > baselineTemp ? '#C65A32' : '#347653' }}>
                        {scenarioTemp > baselineTemp ? '+' : ''}{(scenarioTemp - baselineTemp).toFixed(1)} °C
                      </td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 600 }}>Relative Humidity</td>
                      <td>{baselineHumidity.toFixed(0)} %</td>
                      <td style={{ fontWeight: 700, color: '#0284C7' }}>{scenarioHumidity.toFixed(0)} %</td>
                      <td style={{ fontWeight: 700, color: scenarioHumidity < baselineHumidity ? '#C65A32' : '#347653' }}>
                        {scenarioHumidity > baselineHumidity ? '+' : ''}{(scenarioHumidity - baselineHumidity).toFixed(0)} %
                      </td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 600 }}>Wind Velocity</td>
                      <td>{baselineWind.toFixed(1)} km/h</td>
                      <td style={{ fontWeight: 700 }}>{scenarioWind.toFixed(1)} km/h</td>
                      <td style={{ fontWeight: 700, color: scenarioWind > baselineWind ? '#C65A32' : '#55635C' }}>
                        {scenarioWind > baselineWind ? '+' : ''}{(scenarioWind - baselineWind).toFixed(1)} km/h
                      </td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 600 }}>Precipitation</td>
                      <td>{baselinePrecip.toFixed(1)} mm</td>
                      <td style={{ fontWeight: 700 }}>{scenarioPrecip.toFixed(1)} mm</td>
                      <td>{(scenarioPrecip - baselinePrecip).toFixed(1)} mm</td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 600 }}>Canopy NDVI</td>
                      <td>{baselineNdvi.toFixed(3)}</td>
                      <td style={{ fontWeight: 700, color: '#17452F' }}>{scenarioNdvi.toFixed(3)}</td>
                      <td>{(scenarioNdvi - baselineNdvi).toFixed(3)}</td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 600 }}>Canopy NDMI</td>
                      <td>{baselineNdmi.toFixed(3)}</td>
                      <td style={{ fontWeight: 700, color: '#0284C7' }}>{scenarioNdmi.toFixed(3)}</td>
                      <td>{(scenarioNdmi - baselineNdmi).toFixed(3)}</td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 600 }}>Calendar Month</td>
                      <td>Month {currentMonth}</td>
                      <td style={{ fontWeight: 700 }}>Month {scenarioMonth}</td>
                      <td>{scenarioMonth !== currentMonth ? 'Modified' : 'Unchanged'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div style={{
                backgroundColor: '#F5F7F4',
                padding: '14px',
                borderRadius: '4px',
                border: '1px solid #DCE3DD',
                fontSize: '0.78rem',
                color: '#55635C'
              }}>
                <strong style={{ color: '#17452F' }}>Target Sector:</strong> {selectedLocation.name} ({selectedLocation.latitude.toFixed(4)}°N, {selectedLocation.longitude.toFixed(4)}°E)
              </div>
            </div>

            {/* Right Column: Supporting Wildfire Risk Photography */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              borderRadius: '4px',
              overflow: 'hidden',
              border: '1px solid #DCE3DD',
              backgroundColor: '#F5F7F4'
            }}>
              <div style={{
                position: 'relative',
                flex: 1,
                minHeight: '240px',
                backgroundImage: 'url(/assets/images/wildfire_aerial_hazard.jpg)',
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}>
                <div style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  backgroundColor: 'rgba(198, 90, 50, 0.92)',
                  color: '#FFFFFF',
                  padding: '3px 8px',
                  borderRadius: '3px',
                  fontSize: '0.70rem',
                  fontWeight: 700
                }}>
                  WILDFIRE HAZARD BENCHMARK
                </div>
              </div>
              <div style={{
                padding: '12px 14px',
                backgroundColor: '#FFFFFF',
                borderTop: '1px solid #DCE3DD',
                fontSize: '0.76rem',
                color: '#55635C',
                lineHeight: 1.45
              }}>
                <strong style={{ color: '#17452F' }}>Sensitivity Mechanics:</strong> Gradient boosted decision trees evaluate multiple micro-climate thresholds simultaneously. Rapid drops in humidity combined with thermal heating exponentially elevate fire ignition favorability.
              </div>
            </div>
          </div>

          {simulationError && (
            <div style={{
              backgroundColor: '#FEF2F2',
              border: '1px solid #FECACA',
              borderRadius: '4px',
              padding: '12px 16px',
              marginBottom: '20px',
              color: '#B91C1C',
              fontSize: '0.80rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <AlertTriangle size={16} />
              <span>{simulationError}</span>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #E2E8F0', paddingTop: '16px' }}>
            <button
              type="button"
              onClick={() => setCurrentStep(3)}
              style={{
                backgroundColor: '#FFFFFF',
                color: '#55635C',
                border: '1px solid #DCE3DD',
                borderRadius: '4px',
                padding: '9px 16px',
                fontSize: '0.82rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <ChevronLeft size={16} />
              <span>Back to Seasonal Modifiers</span>
            </button>

            <button
              type="button"
              onClick={handleRunScenario}
              disabled={isSimulating}
              style={{
                backgroundColor: '#17452F',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '4px',
                padding: '10px 24px',
                fontSize: '0.86rem',
                fontWeight: 700,
                cursor: isSimulating ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 1px 3px rgba(23, 69, 47, 0.2)'
              }}
            >
              {isSimulating ? (
                <>
                  <RefreshCw size={16} className="spinner" />
                  <span>Computing Inference Pipeline...</span>
                </>
              ) : (
                <>
                  <Play size={16} />
                  <span>Run Scenario Simulation Now</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* STEP 5: Comparative Outcomes (Core Scientific Result Stage) */}
      {currentStep === 5 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
          {simulationResult ? (
            <>
              {/* Top Level Summary Comparison */}
              <div style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #DCE3DD',
                borderRadius: '6px',
                padding: '24px',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', borderBottom: '1px solid #E2E8F0', paddingBottom: '12px', flexWrap: 'wrap', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <BarChart2 size={20} style={{ color: '#17452F' }} />
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#17452F', margin: 0 }}>
                      5. Comparative Simulation Outcomes
                    </h3>
                  </div>

                  <span style={{ fontSize: '0.78rem', color: '#55635C' }}>
                    Sector Evaluation: <strong style={{ color: '#252B28' }}>{selectedLocation.name}</strong>
                  </span>
                </div>

                {/* Big Metric Comparison Cards */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                  gap: '16px',
                  marginBottom: '22px'
                }}>
                  {/* Baseline Risk Card */}
                  <div style={{
                    backgroundColor: '#F5F7F4',
                    padding: '18px',
                    borderRadius: '4px',
                    border: '1px solid #DCE3DD',
                    borderLeft: '4px solid #55635C'
                  }}>
                    <div style={{ fontSize: '0.72rem', color: '#55635C', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
                      Observed Baseline Risk
                    </div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#252B28', fontFamily: 'monospace', marginTop: '4px' }}>
                      {(simulationResult.baseline_prediction.calibrated_probability * 100).toFixed(1)}%
                    </div>
                    {(() => {
                      const style = getRiskCategoryStyle(simulationResult.baseline_prediction.risk_category);
                      return (
                        <span style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '3px',
                          backgroundColor: style.bg,
                          color: style.text,
                          border: `1px solid ${style.border}`,
                          display: 'inline-block',
                          marginTop: '6px'
                        }}>
                          {simulationResult.baseline_prediction.risk_category} Hazard
                        </span>
                      );
                    })()}
                    <div style={{ fontSize: '0.70rem', color: '#55635C', marginTop: '6px' }}>
                      Based on real-time satellite & AWS telemetry
                    </div>
                  </div>

                  {/* Scenario Predicted Risk Card */}
                  <div style={{
                    backgroundColor: '#F5F7F4',
                    padding: '18px',
                    borderRadius: '4px',
                    border: '1px solid #DCE3DD',
                    borderLeft: '4px solid #17452F'
                  }}>
                    <div style={{ fontSize: '0.72rem', color: '#17452F', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
                      Scenario Predicted Risk
                    </div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#17452F', fontFamily: 'monospace', marginTop: '4px' }}>
                      {(simulationResult.scenario_prediction.calibrated_probability * 100).toFixed(1)}%
                    </div>
                    {(() => {
                      const style = getRiskCategoryStyle(simulationResult.scenario_prediction.risk_category);
                      return (
                        <span style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '3px',
                          backgroundColor: style.bg,
                          color: style.text,
                          border: `1px solid ${style.border}`,
                          display: 'inline-block',
                          marginTop: '6px'
                        }}>
                          {simulationResult.scenario_prediction.risk_category} Hazard
                        </span>
                      );
                    })()}
                    <div style={{ fontSize: '0.70rem', color: '#55635C', marginTop: '6px' }}>
                      XGBoost Platt Calibrated Probability
                    </div>
                  </div>

                  {/* Delta Difference Card */}
                  <div style={{
                    backgroundColor: '#F5F7F4',
                    padding: '18px',
                    borderRadius: '4px',
                    border: '1px solid #DCE3DD',
                    borderLeft: `4px solid ${simulationResult.probability_delta_pp > 0 ? '#C65A32' : '#17452F'}`
                  }}>
                    <div style={{ fontSize: '0.72rem', color: '#55635C', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
                      Probability Shift (Delta)
                    </div>
                    <div style={{
                      fontSize: '1.75rem',
                      fontWeight: 800,
                      fontFamily: 'monospace',
                      marginTop: '4px',
                      color: simulationResult.probability_delta_pp > 0 ? '#C65A32' : simulationResult.probability_delta_pp < 0 ? '#17452F' : '#55635C'
                    }}>
                      {simulationResult.probability_delta_pp > 0 ? '+' : ''}{simulationResult.probability_delta_pp.toFixed(1)} pp
                    </div>
                    <span style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      color: simulationResult.probability_delta_pp > 0 ? '#C65A32' : '#17452F',
                      display: 'inline-block',
                      marginTop: '6px'
                    }}>
                      {simulationResult.probability_delta_pp > 0 ? '▲ Increased Wildfire Susceptibility' : simulationResult.probability_delta_pp < 0 ? '▼ Reduced Wildfire Susceptibility' : 'No Statistical Delta'}
                    </span>
                  </div>
                </div>

                {/* Visual Comparative Probability Bars */}
                <div style={{
                  backgroundColor: '#F5F7F4',
                  padding: '18px',
                  borderRadius: '4px',
                  border: '1px solid #DCE3DD',
                  marginBottom: '20px'
                }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#17452F', textTransform: 'uppercase', marginBottom: '14px' }}>
                    Comparative Susceptibility Gauge
                  </div>

                  {/* Baseline bar */}
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', marginBottom: '4px' }}>
                      <span style={{ color: '#55635C', fontWeight: 600 }}>Observed Baseline</span>
                      <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#252B28' }}>
                        {(simulationResult.baseline_prediction.calibrated_probability * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div style={{ height: '10px', backgroundColor: '#DCE3DD', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${Math.min(100, Math.max(0, simulationResult.baseline_prediction.calibrated_probability * 100))}%`,
                        backgroundColor: '#55635C',
                        borderRadius: '4px'
                      }} />
                    </div>
                  </div>

                  {/* Scenario bar */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', marginBottom: '4px' }}>
                      <span style={{ color: '#17452F', fontWeight: 700 }}>Simulated Counterfactual Scenario</span>
                      <span style={{ fontFamily: 'monospace', fontWeight: 800, color: simulationResult.probability_delta_pp > 0 ? '#C65A32' : '#17452F' }}>
                        {(simulationResult.scenario_prediction.calibrated_probability * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div style={{ height: '12px', backgroundColor: '#DCE3DD', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${Math.min(100, Math.max(0, simulationResult.scenario_prediction.calibrated_probability * 100))}%`,
                        backgroundColor: simulationResult.probability_delta_pp > 0 ? '#C65A32' : '#17452F',
                        borderRadius: '4px',
                        transition: 'width 0.3s ease'
                      }} />
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: '#55635C', marginTop: '6px' }}>
                    <span>0% (Low)</span>
                    <span>35% (Moderate)</span>
                    <span>55% (High)</span>
                    <span>75% (Extreme)</span>
                    <span>100%</span>
                  </div>
                </div>

                {/* Analytical Sensitivity Summary Statement */}
                <div style={{
                  backgroundColor: '#EBF3EF',
                  borderLeft: '4px solid #17452F',
                  padding: '14px 18px',
                  borderRadius: '4px',
                  fontSize: '0.84rem',
                  color: '#17452F',
                  lineHeight: 1.5,
                  border: '1px solid #C2DBCD'
                }}>
                  {simulationResult.interpretation || (simulationResult as any).summary_statement}
                </div>
              </div>

              {/* Influential Variables Breakdown (SHAP Contributions) */}
              {simulationResult.scenario_prediction.shap_explanation?.feature_contributions && (
                <div style={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #DCE3DD',
                  borderRadius: '6px',
                  padding: '24px',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', borderBottom: '1px solid #E2E8F0', paddingBottom: '10px' }}>
                    <Sparkles size={18} style={{ color: '#17452F' }} />
                    <h4 style={{ fontSize: '1.02rem', fontWeight: 800, color: '#17452F', margin: 0 }}>
                      Influential Variables Breakdown (Scenario TreeSHAP Attribution)
                    </h4>
                  </div>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: '14px'
                  }}>
                    {simulationResult.scenario_prediction.shap_explanation.feature_contributions.map((fc, idx) => {
                      const isElevating = fc.shap_value > 0;
                      return (
                        <div key={idx} style={{
                          backgroundColor: '#F5F7F4',
                          border: `1px solid ${isElevating ? '#FECACA' : '#DCE3DD'}`,
                          borderLeft: `4px solid ${isElevating ? '#C65A32' : '#347653'}`,
                          borderRadius: '4px',
                          padding: '14px'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#252B28' }}>
                              {fc.feature_name.replace(/_/g, ' ')}
                            </span>
                            <span style={{ 
                              fontSize: '0.80rem', 
                              fontWeight: 800, 
                              fontFamily: 'monospace', 
                              color: isElevating ? '#C65A32' : '#17452F' 
                            }}>
                              {fc.shap_value > 0 ? `+${fc.shap_value.toFixed(3)}` : fc.shap_value.toFixed(3)}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.74rem', color: '#55635C' }}>
                            Simulated Value: <strong style={{ color: '#252B28' }}>{fc.feature_value}</strong>
                          </div>
                          <p style={{ fontSize: '0.74rem', color: '#55635C', margin: '6px 0 0 0', lineHeight: 1.45 }}>
                            {fc.human_explanation}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Navigation Actions */}
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  style={{
                    backgroundColor: '#FFFFFF',
                    color: '#55635C',
                    border: '1px solid #DCE3DD',
                    borderRadius: '4px',
                    padding: '9px 18px',
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <ChevronLeft size={16} />
                  <span>Modify Scenario Inputs</span>
                </button>

                <button
                  type="button"
                  onClick={handleResetToObserved}
                  style={{
                    backgroundColor: '#17452F',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '10px 20px',
                    fontSize: '0.84rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <RotateCcw size={14} />
                  <span>Start New Scenario</span>
                </button>
              </div>
            </>
          ) : (
            <div style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #DCE3DD',
              borderRadius: '6px',
              padding: '40px',
              textAlign: 'center',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)'
            }}>
              <Info size={28} style={{ color: '#C65A32', marginBottom: '10px' }} />
              <h4 style={{ fontSize: '1.05rem', color: '#17452F', margin: '0 0 8px 0', fontWeight: 700 }}>
                No Simulation Executed Yet
              </h4>
              <p style={{ fontSize: '0.82rem', color: '#55635C', margin: '0 0 16px 0' }}>
                Please proceed to Step 4 to run the counterfactual scenario through the XGBoost inference engine.
              </p>
              <button
                type="button"
                onClick={() => setCurrentStep(4)}
                style={{
                  backgroundColor: '#17452F',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '9px 18px',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Go to Step 4: Run Simulation
              </button>
            </div>
          )}
        </div>
      )}

      {/* 4. Scenario History Log */}
      {historyList.length > 0 && (
        <div style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #DCE3DD',
          borderRadius: '6px',
          padding: '20px',
          marginTop: '22px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', borderBottom: '1px solid #E2E8F0', paddingBottom: '8px' }}>
            <History size={16} style={{ color: '#17452F' }} />
            <h4 style={{ fontSize: '0.94rem', fontWeight: 800, color: '#17452F', margin: 0 }}>
              Recent Simulation Iterations ({historyList.length})
            </h4>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {historyList.map(item => (
              <div key={item.id} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: '#F5F7F4',
                border: '1px solid #DCE3DD',
                padding: '10px 14px',
                borderRadius: '4px',
                fontSize: '0.80rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ color: '#55635C' }}>{item.timestamp}</span>
                  <span style={{ fontWeight: 700, color: '#252B28' }}>{item.locationName}</span>
                  <span style={{ color: '#55635C' }}>({item.modifiedSummary})</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <span style={{ fontWeight: 800, color: '#17452F', fontFamily: 'monospace' }}>
                    {(item.scenarioProbability * 100).toFixed(1)}% P(Calib)
                  </span>
                  <span style={{ color: item.probDeltaPp > 0 ? '#C65A32' : '#17452F', fontWeight: 700, fontFamily: 'monospace' }}>
                    {item.probDeltaPp > 0 ? '+' : ''}{item.probDeltaPp.toFixed(1)} pp
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default WhatIfSimulatorPage;
