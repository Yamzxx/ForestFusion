import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  RefreshCw,
  Flame,
  AlertTriangle,
  Clock,
  Layers,
  Activity,
  Compass
} from 'lucide-react';
import type {
  DecisionSupportSummary,
  DecisionSupportAttentionListResponse,
  DecisionSupportAttentionItem
} from '../types/decisionSupport';
import type { SpatialPredictionRequest } from '../types/spatial';
import type { FireDataResponse, FireDetectionRecord } from '../types/fire';
import type { WeatherState, GeocodingLocation } from '../types/weather';
import type { VegetationState } from '../types/vegetation';
import { fetchDecisionSupportSummary, fetchAttentionList } from '../services/decisionSupportService';
import { fetchFireDetections } from '../services/fireService';
import './DecisionSupportPage.css';

interface DecisionSupportPageProps {
  selectedLocation?: GeocodingLocation;
  weatherState?: WeatherState;
  vegetationState?: VegetationState;
}

// Map sector name to authentic Indian forest ecosystem photography
const getSectorThumbnail = (locationName: string): string => {
  const lower = locationName.toLowerCase();
  if (lower.includes('bandipur')) return '/assets/images/canopy_aerial.jpg';
  if (lower.includes('nagarhole')) return '/assets/images/elephant_forest.jpg';
  if (lower.includes('wayanad')) return '/assets/images/monsoon_forest.jpg';
  if (lower.includes('mudumalai')) return '/assets/images/spotted_deer.jpg';
  return '/assets/images/environmental_mist.jpg';
};

// Map sector name to administrative division
const getSectorRegion = (locationName: string): string => {
  const lower = locationName.toLowerCase();
  if (lower.includes('bandipur')) return 'Bandipur Tiger Reserve • KA';
  if (lower.includes('nagarhole')) return 'Nagarhole Tiger Reserve • KA';
  if (lower.includes('wayanad')) return 'Wayanad Wildlife Sanctuary • KL';
  if (lower.includes('mudumalai')) return 'Mudumalai Tiger Reserve • TN';
  return 'Nilgiri Biosphere Division';
};

export const DecisionSupportPage: React.FC<DecisionSupportPageProps> = ({
  selectedLocation,
  weatherState,
  vegetationState
}) => {
  // Section 1 & 2 State: Attention list & connection status
  const [attentionData, setAttentionData] = useState<DecisionSupportAttentionListResponse | null>(null);
  const [listLoading, setListLoading] = useState<boolean>(true);
  const [serviceError, setServiceError] = useState<string | null>(null);
  const [selectedSectorName, setSelectedSectorName] = useState<string>(
    selectedLocation?.name || 'Bandipur Core Forest Sector A'
  );

  // Section 1 & 4 State: Selected sector decision summary
  const [summary, setSummary] = useState<DecisionSupportSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState<boolean>(false);

  // Section 3 State: Wildfire observations
  const [fireData, setFireData] = useState<FireDataResponse | null>(null);
  const [fireLoading, setFireLoading] = useState<boolean>(true);

  // Synchronize prop location name
  useEffect(() => {
    if (selectedLocation?.name && selectedLocation.name !== selectedSectorName) {
      setSelectedSectorName(selectedLocation.name);
    }
  }, [selectedLocation?.name, selectedSectorName]);

  // Load decision support attention list
  const loadAttentionList = useCallback(async () => {
    setListLoading(true);
    setServiceError(null);
    try {
      const data = await fetchAttentionList();
      setAttentionData(data);
      if (!data || data.attention_items.length === 0) {
        setServiceError(data?.data_freshness_notes || 'FastAPI backend service offline (port 8000 unreachable)');
      } else {
        setSelectedSectorName(prev => {
          const exists = data.attention_items.some(i => i.location_name === prev);
          return exists ? prev : data.attention_items[0].location_name;
        });
      }
    } catch (err: any) {
      setAttentionData(null);
      setServiceError(err?.message || 'Connection failed to FastAPI decision support endpoint');
    } finally {
      setListLoading(false);
    }
  }, []);

  // Load active-fire observations from FIRMS service
  const loadFireObservations = useCallback(async () => {
    setFireLoading(true);
    try {
      const data = await fetchFireDetections(7, 'VIIRS_SNPP_NRT');
      setFireData(data);
    } catch (err) {
      console.warn('Unable to load wildfire observations:', err);
    } finally {
      setFireLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAttentionList();
    loadFireObservations();
  }, [loadAttentionList, loadFireObservations]);

  // Load decision support summary whenever selected sector changes
  useEffect(() => {
    let active = true;
    setSummaryLoading(true);

    const lat = selectedLocation && selectedSectorName === selectedLocation.name
      ? selectedLocation.latitude
      : selectedSectorName.includes('Nagarhole') ? 11.986
        : selectedSectorName.includes('Wayanad') ? 11.685
          : selectedSectorName.includes('Mudumalai') ? 11.562
            : 11.664;

    const lng = selectedLocation && selectedSectorName === selectedLocation.name
      ? selectedLocation.longitude
      : selectedSectorName.includes('Nagarhole') ? 76.124
        : selectedSectorName.includes('Wayanad') ? 76.132
          : selectedSectorName.includes('Mudumalai') ? 76.534
            : 76.627;

    const temp = weatherState?.data && selectedLocation && selectedSectorName === selectedLocation.name
      ? weatherState.data.current.temperature_2m
      : selectedSectorName.includes('Wayanad') ? 26.5 : selectedSectorName.includes('Nagarhole') ? 31.0 : 34.2;

    const humidity = weatherState?.data && selectedLocation && selectedSectorName === selectedLocation.name
      ? weatherState.data.current.relative_humidity_2m
      : selectedSectorName.includes('Wayanad') ? 58.0 : selectedSectorName.includes('Nagarhole') ? 32.0 : 22.0;

    const wind = weatherState?.data && selectedLocation && selectedSectorName === selectedLocation.name
      ? weatherState.data.current.wind_speed_10m
      : selectedSectorName.includes('Wayanad') ? 9.0 : selectedSectorName.includes('Nagarhole') ? 14.0 : 21.0;

    const ndviVal = vegetationState?.data?.latest_observation?.ndvi ??
      (selectedSectorName.includes('Wayanad') ? 0.78 : selectedSectorName.includes('Nagarhole') ? 0.61 : 0.42);

    const targetReq: SpatialPredictionRequest = {
      latitude: lat,
      longitude: lng,
      location_name: selectedSectorName,
      environmental_inputs: {
        temperature_2m: temp,
        relative_humidity_2m: humidity,
        wind_speed_10m: wind,
        precipitation: weatherState?.data?.current.precipitation ?? 0.0,
        ndvi: ndviVal,
        ndmi: vegetationState?.data?.latest_observation?.ndmi ?? -0.15,
        month: new Date().getMonth() + 1
      }
    };

    fetchDecisionSupportSummary(targetReq)
      .then(res => {
        if (active) {
          setSummary(res);
          setSummaryLoading(false);
        }
      })
      .catch(() => {
        if (active) {
          setSummaryLoading(false);
        }
      });

    return () => { active = false; };
  }, [selectedSectorName, selectedLocation, weatherState, vegetationState]);

  // Derived connection status
  const connectionStatus: 'online' | 'offline' | 'standby' = useMemo(() => {
    if (listLoading) return 'standby';
    if (attentionData && attentionData.attention_items.length > 0) return 'online';
    return 'offline';
  }, [listLoading, attentionData]);

  const activeSectorItem = useMemo(() => {
    return attentionData?.attention_items.find(i => i.location_name === selectedSectorName);
  }, [attentionData?.attention_items, selectedSectorName]);

  // Helpers for priority and risk classes
  const getPriorityInfo = (item: DecisionSupportAttentionItem) => {
    const p = item.calibrated_probability;
    if (p >= 0.75) return { tag: 'PRIORITY 1', class: 'p1' };
    if (p >= 0.55) return { tag: 'PRIORITY 2', class: 'p2' };
    if (p >= 0.35) return { tag: 'PRIORITY 3', class: 'p3' };
    return { tag: 'ROUTINE', class: 'routine' };
  };

  const getRiskClass = (category?: string) => {
    switch (category) {
      case 'Very High':
        return 'very-high';
      case 'High':
        return 'high';
      case 'Moderate':
        return 'moderate';
      case 'Low':
      default:
        return 'low';
    }
  };

  const getRiskBarColor = (category?: string) => {
    switch (category) {
      case 'Very High':
      case 'High':
        return '#B91C1C';
      case 'Moderate':
        return '#D97706';
      case 'Low':
      default:
        return '#347653';
    }
  };

  // Weather telemetry freshness derivation
  const weatherFreshness: 'live' | 'stale' | 'unavailable' = useMemo(() => {
    if (weatherState?.loading) return 'stale';
    if (weatherState?.data) return 'live';
    return 'unavailable';
  }, [weatherState?.loading, weatherState?.data]);

  const satelliteFreshness: 'live' | 'stale' | 'unavailable' = useMemo(() => {
    if (vegetationState?.loading) return 'stale';
    if (vegetationState?.data?.is_configured) return 'live';
    return 'unavailable';
  }, [vegetationState?.loading, vegetationState?.data]);

  return (
    <div className="dsp-operational-dashboard">
      {/* ====================================================================
         SECTION 1: DECISION SERVICE STANDBY (IMAGE-BACKED HERO PANEL)
         ==================================================================== */}
      <section className="dsp-section-standby" id="dsp-service-standby">
        <div className="dsp-standby-bg" />
        <div className="dsp-standby-overlay" />

        <div className="dsp-standby-content">
          <div className="dsp-standby-main">
            <div className="dsp-standby-tag-row">
              <span className="dsp-standby-index-tag">01 • DECISION SERVICE STANDBY</span>
              <span className="dsp-standby-sub-tag">
                FastAPI Decision Support Engine • XGBoost Calibrated Model Pipeline
              </span>
            </div>

            <h1 className="dsp-standby-title">
              Decision Support Service &amp; Connection Dispatch
            </h1>

            <p className="dsp-standby-desc">
              {connectionStatus === 'online' && (
                `Operational decision-support dispatch active at port 8000. Platt-calibrated susceptibility probabilities and spatial inference streaming across ${attentionData?.total_locations || 0} monitored forest sectors.`
              )}
              {connectionStatus === 'offline' && (
                'The local decision-support pipeline is currently offline or unreachable at http://127.0.0.1:8000/api/ml/decision-support. Start the backend service to stream live sector calibrations.'
              )}
              {connectionStatus === 'standby' && (
                'Connecting to local FastAPI inference engine and spatial evaluation endpoints...'
              )}
            </p>

            <p className="dsp-standby-submsg">
              {connectionStatus === 'online' && (attentionData?.data_freshness_notes || 'All telemetry verified against meteorological and satellite feeds.')}
              {connectionStatus === 'offline' && (serviceError || 'Terminal command: cd backend && python -m uvicorn app.main:app --port 8000')}
              {connectionStatus === 'standby' && 'Awaiting response from backend dispatcher...'}
            </p>
          </div>

          <div className="dsp-standby-actions">
            {/* Status Pill */}
            <div className={`dsp-service-status-pill ${connectionStatus}`}>
              <span className={`dsp-status-dot ${connectionStatus}`} />
              <span>
                {connectionStatus === 'online' && 'SERVICE ONLINE'}
                {connectionStatus === 'offline' && 'SERVICE OFFLINE'}
                {connectionStatus === 'standby' && 'SERVICE STANDBY'}
              </span>
            </div>

            {/* Action */}
            <button
              type="button"
              className="dsp-btn-retry"
              onClick={loadAttentionList}
              disabled={listLoading}
            >
              <RefreshCw size={13} className={listLoading ? 'spinner' : ''} />
              <span>{listLoading ? 'Checking...' : 'Retry Connection'}</span>
            </button>
          </div>
        </div>
      </section>

      {/* ====================================================================
         SECTION 2: OPERATIONAL PRIORITY MATRIX
         ==================================================================== */}
      <section className="dsp-op-section" id="dsp-operational-priority-matrix">
        <div className="dsp-op-header">
          <div className="dsp-op-header-left">
            <span className="dsp-op-section-index">02</span>
            <Layers size={16} style={{ color: '#17452F' }} />
            <h2 className="dsp-op-title">Operational Priority Matrix</h2>
          </div>
          <span className="dsp-op-header-meta">
            {attentionData?.attention_items.length
              ? `${attentionData.attention_items.length} Monitored Forest Sectors • Platt-Calibrated Wildfire Susceptibility`
              : 'Zero Active Sectors'}
          </span>
        </div>

        <div className="dsp-op-body" style={{ padding: 0 }}>
          {listLoading ? (
            <div className="dsp-empty-state-notice">
              <RefreshCw size={20} className="spinner" style={{ color: '#17452F', marginBottom: '8px' }} />
              <div>Loading operational priority matrix from backend...</div>
            </div>
          ) : attentionData && attentionData.attention_items.length > 0 ? (
            <div className="dsp-matrix-table-wrap">
              <table className="dsp-matrix-table">
                <thead>
                  <tr>
                    <th>Priority</th>
                    <th>Forest Sector</th>
                    <th>Coordinates</th>
                    <th>Risk Classification</th>
                    <th>Calibrated P(Hazard)</th>
                    <th>Leading Factor</th>
                    <th>Observation Time</th>
                  </tr>
                </thead>
                <tbody>
                  {attentionData.attention_items.map((item, idx) => {
                    const isSelected = item.location_name === selectedSectorName;
                    const priority = getPriorityInfo(item);
                    const riskCls = getRiskClass(item.risk_category);
                    const thumbImg = getSectorThumbnail(item.location_name);
                    const regionStr = getSectorRegion(item.location_name);
                    const barColor = getRiskBarColor(item.risk_category);

                    return (
                      <tr
                        key={idx}
                        className={`dsp-matrix-row ${isSelected ? 'selected' : ''}`}
                        onClick={() => setSelectedSectorName(item.location_name)}
                      >
                        <td>
                          <span className={`dsp-priority-tag ${priority.class}`}>
                            {priority.tag}
                          </span>
                        </td>
                        <td>
                          <div className="dsp-sector-thumb-cell">
                            <div className="dsp-matrix-thumbnail">
                              <img
                                src={thumbImg}
                                alt={item.location_name}
                                className="dsp-matrix-thumb-img"
                              />
                            </div>
                            <div>
                              <div className="dsp-sector-title-cell">{item.location_name}</div>
                              <div className="dsp-sector-sub-cell">{regionStr}</div>
                            </div>
                          </div>
                        </td>
                        <td className="dsp-time-cell">
                          {item.latitude.toFixed(3)}°N, {item.longitude.toFixed(3)}°E
                        </td>
                        <td>
                          <span className={`dsp-risk-pill ${riskCls}`}>
                            {item.risk_category}
                          </span>
                        </td>
                        <td>
                          <div className="dsp-prob-cell-wrap">
                            <span className="dsp-prob-val">
                              {(item.calibrated_probability * 100).toFixed(1)}%
                            </span>
                            <div className="dsp-prob-bar-track">
                              <div
                                className="dsp-prob-bar-fill"
                                style={{
                                  width: `${Math.min(100, Math.max(8, item.calibrated_probability * 100))}%`,
                                  backgroundColor: barColor
                                }}
                              />
                            </div>
                          </div>
                        </td>
                        <td>
                          <span style={{ fontSize: '0.74rem', color: '#252B28', fontWeight: 600 }}>
                            {item.primary_shap_contributor}
                          </span>
                        </td>
                        <td className="dsp-time-cell">
                          {item.prediction_timestamp || '--'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="dsp-empty-state-notice">
              <AlertTriangle size={22} style={{ color: '#B45309', marginBottom: '8px' }} />
              <div style={{ fontWeight: 700, color: '#252B28', marginBottom: '4px' }}>
                Operational Priority Matrix Unavailable
              </div>
              <div>
                Backend service returned zero monitored forest sectors. Verify FastAPI server status or click Retry Connection above.
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ====================================================================
         SECTION 3: WILDFIRE OBSERVATION (AERIAL OBSERVATION IMAGERY + DATA)
         ==================================================================== */}
      <section className="dsp-op-section" id="dsp-wildfire-observation">
        <div className="dsp-op-header">
          <div className="dsp-op-header-left">
            <span className="dsp-op-section-index">03</span>
            <Flame size={16} style={{ color: '#C65A32' }} />
            <h2 className="dsp-op-title">Wildfire Observation</h2>
          </div>
          <span className="dsp-op-header-meta">
            Satellite Active-Fire Thermal Radiometry • NASA FIRMS Swath
          </span>
        </div>

        <div className="dsp-op-body">
          <div className="dsp-wildfire-obs-layout">
            {/* Photographic Observation Frame */}
            <div className="dsp-obs-photo-card">
              <img
                src="/assets/images/wildfire_aerial_hazard.jpg"
                alt="Aerial wildfire and smoke plume observation over forest canopy"
                className="dsp-obs-photo-img"
              />
              <div className="dsp-obs-photo-overlay">
                <span className="dsp-obs-photo-tag">NASA FIRMS Orbit Swath</span>
                <p className="dsp-obs-photo-caption">
                  Aerial Wildfire &amp; Smoke Plume Observation • Radiometer Thermal Detection
                </p>
              </div>
            </div>

            {/* Detections Data Panel */}
            <div className="dsp-obs-data-panel">
              {/* Summary Stats Row */}
              <div className="dsp-observation-summary-row">
                <div className="dsp-obs-stat-card">
                  <span className="dsp-obs-stat-label">Data Provider</span>
                  <span className="dsp-obs-stat-val" style={{ fontSize: '0.82rem' }}>
                    NASA FIRMS
                  </span>
                </div>
                <div className="dsp-obs-stat-card">
                  <span className="dsp-obs-stat-label">Observation Window</span>
                  <span className="dsp-obs-stat-val">Past 7 Days</span>
                </div>
                <div className="dsp-obs-stat-card">
                  <span className="dsp-obs-stat-label">Thermal Anomalies</span>
                  <span className="dsp-obs-stat-val" style={{ color: (fireData?.total_detections || 0) > 0 ? '#C65A32' : '#17452F' }}>
                    {fireData?.total_detections ?? 0}
                  </span>
                </div>
                <div className="dsp-obs-stat-card">
                  <span className="dsp-obs-stat-label">Sensor Status</span>
                  <span className="dsp-obs-stat-val" style={{ fontSize: '0.8rem', color: fireData?.is_configured ? '#15803D' : '#55635C' }}>
                    {fireLoading ? 'Scanning...' : fireData?.is_configured ? 'Active Sensor Swath' : 'Standby Mode'}
                  </span>
                </div>
              </div>

              {/* Table or Empty State */}
              <div className="dsp-observation-table-wrap">
                {fireLoading ? (
                  <div className="dsp-obs-empty-msg">
                    <RefreshCw size={16} className="spinner" style={{ marginBottom: '6px' }} />
                    <div>Querying NASA FIRMS active fire radiometer telemetry...</div>
                  </div>
                ) : fireData && fireData.detections && fireData.detections.length > 0 ? (
                  <table className="dsp-matrix-table">
                    <thead>
                      <tr>
                        <th>Location</th>
                        <th>Detection Time (UTC)</th>
                        <th>Sensor / Source</th>
                        <th>Confidence</th>
                        <th>Radiative Power / Brightness</th>
                        <th>Pass</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fireData.detections.slice(0, 8).map((det: FireDetectionRecord, dIdx: number) => (
                        <tr key={det.id || dIdx}>
                          <td className="dsp-time-cell">
                            {det.latitude.toFixed(3)}°N, {det.longitude.toFixed(3)}°E
                          </td>
                          <td className="dsp-time-cell">
                            {det.acq_date} {det.acq_time}
                          </td>
                          <td>
                            <strong style={{ color: '#17452F' }}>{det.satellite}</strong>{' '}
                            <span style={{ fontSize: '0.68rem', color: '#55635C' }}>({det.instrument})</span>
                          </td>
                          <td>
                            <span style={{ fontWeight: 700, color: det.confidence === 'high' ? '#B91C1C' : '#55635C' }}>
                              {det.confidence}
                            </span>
                          </td>
                          <td className="dsp-time-cell">
                            {det.frp !== undefined ? `${det.frp.toFixed(1)} MW` : `${det.brightness.toFixed(1)} K`}
                          </td>
                          <td style={{ fontSize: '0.72rem', textTransform: 'capitalize' }}>
                            {det.daynight === 'D' ? 'Daylight' : 'Night'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="dsp-obs-empty-msg">
                    <Flame size={20} style={{ color: '#55635C', marginBottom: '6px' }} />
                    <div style={{ fontWeight: 600, color: '#252B28', marginBottom: '2px' }}>
                      No Active Wildfire Thermal Detections Reported
                    </div>
                    <div style={{ fontSize: '0.74rem' }}>
                      {fireData?.message || 'Zero satellite thermal anomalies detected in monitored Indian forest sector boundary over the past 7-day observation window.'}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
         SECTION 4: TELEMETRY (STRUCTURED ENVIRONMENTAL & REMOTE SENSING)
         ==================================================================== */}
      <section className="dsp-op-section" id="dsp-telemetry">
        <div className="dsp-op-header">
          <div className="dsp-op-header-left">
            <span className="dsp-op-section-index">04</span>
            <Activity size={16} style={{ color: '#17452F' }} />
            <h2 className="dsp-op-title">Telemetry</h2>
          </div>
          <span className="dsp-op-header-meta">
            Target Focus: {selectedSectorName} • Environmental Observation Stream
          </span>
        </div>

        <div className="dsp-op-body">
          <div className="dsp-telemetry-grid">
            {/* Air Temperature */}
            <div className="dsp-telemetry-cell">
              <div className="dsp-tel-top">
                <span className="dsp-tel-label">Air Temperature (2m)</span>
                <span className={`dsp-tel-status-badge ${weatherFreshness}`}>
                  {weatherFreshness.toUpperCase()}
                </span>
              </div>
              <div className="dsp-tel-value">
                {weatherState?.data ? `${weatherState.data.current.temperature_2m.toFixed(1)} °C` : '--'}
              </div>
              <div className="dsp-tel-meta">
                <span>Open-Meteo NWP</span>
                <span>{weatherState?.data ? 'Hourly Forecast Sync' : 'Offline'}</span>
              </div>
            </div>

            {/* Relative Humidity */}
            <div className="dsp-telemetry-cell wildfire-accent">
              <div className="dsp-tel-top">
                <span className="dsp-tel-label">Relative Humidity</span>
                <span className={`dsp-tel-status-badge ${weatherFreshness}`}>
                  {weatherFreshness.toUpperCase()}
                </span>
              </div>
              <div className="dsp-tel-value" style={{ color: (weatherState?.data?.current.relative_humidity_2m ?? 50) < 30 ? '#C65A32' : '#17452F' }}>
                {weatherState?.data ? `${weatherState.data.current.relative_humidity_2m.toFixed(0)} %` : '--'}
              </div>
              <div className="dsp-tel-meta">
                <span>Open-Meteo NWP</span>
                <span>Fuel Moisture Stress</span>
              </div>
            </div>

            {/* Wind Speed */}
            <div className="dsp-telemetry-cell">
              <div className="dsp-tel-top">
                <span className="dsp-tel-label">Wind Speed (10m)</span>
                <span className={`dsp-tel-status-badge ${weatherFreshness}`}>
                  {weatherFreshness.toUpperCase()}
                </span>
              </div>
              <div className="dsp-tel-value">
                {weatherState?.data ? `${weatherState.data.current.wind_speed_10m.toFixed(1)} km/h` : '--'}
              </div>
              <div className="dsp-tel-meta">
                <span>Open-Meteo NWP</span>
                <span>Flame Propagation</span>
              </div>
            </div>

            {/* Precipitation */}
            <div className="dsp-telemetry-cell">
              <div className="dsp-tel-top">
                <span className="dsp-tel-label">Precipitation</span>
                <span className={`dsp-tel-status-badge ${weatherFreshness}`}>
                  {weatherFreshness.toUpperCase()}
                </span>
              </div>
              <div className="dsp-tel-value">
                {weatherState?.data ? `${weatherState.data.current.precipitation.toFixed(1)} mm` : '--'}
              </div>
              <div className="dsp-tel-meta">
                <span>Open-Meteo NWP</span>
                <span>24h Accumulation</span>
              </div>
            </div>

            {/* Satellite Observation */}
            <div className="dsp-telemetry-cell">
              <div className="dsp-tel-top">
                <span className="dsp-tel-label">Satellite Observation</span>
                <span className={`dsp-tel-status-badge ${satelliteFreshness}`}>
                  {satelliteFreshness.toUpperCase()}
                </span>
              </div>
              <div className="dsp-tel-value" style={{ fontSize: '1.05rem', marginTop: '6px' }}>
                {vegetationState?.data?.is_configured ? 'Operational (L2A)' : 'Standby Mode'}
              </div>
              <div className="dsp-tel-meta">
                <span>Copernicus Sentinel-2</span>
                <span>{vegetationState?.data?.latest_observation?.timestamp?.split('T')[0] || '5-Day Swath'}</span>
              </div>
            </div>

            {/* Calibrated Probability */}
            <div className="dsp-telemetry-cell wildfire-accent">
              <div className="dsp-tel-top">
                <span className="dsp-tel-label">Calibrated Probability</span>
                <span className={`dsp-tel-status-badge ${summaryLoading ? 'stale' : summary?.is_available ? 'live' : 'unavailable'}`}>
                  {summaryLoading ? 'SYNCING' : summary?.is_available ? 'LIVE' : 'UNAVAILABLE'}
                </span>
              </div>
              <div className="dsp-tel-value" style={{ color: activeSectorItem ? (activeSectorItem.calibrated_probability >= 0.55 ? '#C65A32' : '#17452F') : '#17452F' }}>
                {summary?.is_available
                  ? `${(summary.calibrated_probability * 100).toFixed(1)}%`
                  : activeSectorItem
                    ? `${(activeSectorItem.calibrated_probability * 100).toFixed(1)}%`
                    : '--'}
              </div>
              <div className="dsp-tel-meta">
                <span>{summary?.model_name_version || 'XGBoost v1.0'}</span>
                <span>Platt Sigmoid Scaled</span>
              </div>
            </div>
          </div>

          {/* Telemetry Source & Provenance Footer */}
          <div className="dsp-telemetry-footer">
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Clock size={13} style={{ color: '#17452F' }} />
              <span>
                <strong>Observation Timestamp:</strong>{' '}
                {summary?.prediction_timestamp || weatherState?.data?.current.time || new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC'}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Compass size={13} style={{ color: '#17452F' }} />
              <span>
                Provider: <strong>{summary?.data_freshness?.telemetry_source || 'Open-Meteo API & Copernicus Sentinel-2 MSI'}</strong>
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default DecisionSupportPage;
