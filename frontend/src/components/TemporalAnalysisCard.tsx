import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  TrendingUp, 
  Flame, 
  Thermometer, 
  Droplets, 
  Wind, 
  CloudRain, 
  Activity, 
  BarChart2, 
  ShieldAlert, 
  Info, 
  RefreshCw,
  Sparkles,
  Layers,
  HelpCircle
} from 'lucide-react';
import type { TemporalAnalysisResponse, FireActivityPoint, EnvironmentalTrendPoint, ModelRiskTrendPoint, CorrelationMetric } from '../types/temporalAnalysis';
import { fetchTemporalAnalysis } from '../services/temporalAnalysisService';

interface TemporalAnalysisCardProps {
  initialDays?: number;
  latitude?: number;
  longitude?: number;
}

export const TemporalAnalysisCard: React.FC<TemporalAnalysisCardProps> = ({
  initialDays = 14,
  latitude = 11.6667,
  longitude = 76.6333
}) => {
  const [days, setDays] = useState<number>(initialDays);
  const [data, setData] = useState<TemporalAnalysisResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async (daysCount: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchTemporalAnalysis(daysCount, latitude, longitude);
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to load temporal analysis');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(days);
  }, [days, latitude, longitude]);

  const maxDetections = data?.fire_activity_trend
    ? Math.max(1, ...data.fire_activity_trend.map(f => f.detection_count))
    : 1;

  const maxTemp = data?.environmental_trend
    ? Math.max(40, ...data.environmental_trend.map(e => e.temperature_2m))
    : 40;

  return (
    <div className="temporal-analysis-wrapper" style={{ marginTop: '24px' }}>
      {/* Header & Controls Panel */}
      <div className="map-panel-card" style={{ marginBottom: '20px' }}>
        <div className="panel-header">
          <div className="panel-header-title">
            <TrendingUp className="panel-header-icon" style={{ color: '#0284c7' }} />
            <div>
              <h3>Historical Risk Trends & Temporal Analysis</h3>
              <span className="panel-subtitle">
                Multi-temporal alignment of satellite fire detections, meteorological observations, and calibrated model risk
              </span>
            </div>
          </div>

          <div className="panel-controls">
            {/* Date-Range Selector */}
            <div className="filter-group">
              <Calendar className="filter-icon" />
              <label className="filter-label">Analysis Window:</label>
              <select
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
                className="filter-select"
                style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontWeight: 600 }}
              >
                <option value={7}>Past 7 Days</option>
                <option value={14}>Past 14 Days</option>
                <option value={30}>Past 30 Days</option>
                <option value={60}>Past 60 Days</option>
              </select>
            </div>

            <button
              type="button"
              className="retry-weather-btn"
              onClick={() => loadData(days)}
              disabled={loading}
              title="Refresh temporal trends"
            >
              <RefreshCw className={`btn-icon ${loading ? 'spinner' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Temporal Data Isolation Legend */}
        <div style={{
          marginTop: '12px',
          padding: '10px 14px',
          backgroundColor: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '16px',
          fontSize: '0.75rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ backgroundColor: '#fee2e2', color: '#991b1b', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>
              SATELLITE OBSERVATION
            </span>
            <span style={{ color: '#475569' }}>NASA FIRMS Thermal Anomaly Detections</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ backgroundColor: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>
              ENVIRONMENTAL METRIC
            </span>
            <span style={{ color: '#475569' }}>Open-Meteo & Sentinel-2 Telemetry</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ backgroundColor: '#fef3c7', color: '#92400e', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>
              MODEL PREDICTION
            </span>
            <span style={{ color: '#475569' }}>XGBoost + Platt Calibrated Probability</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="weather-state-box loading-state" style={{ marginBottom: '20px' }}>
          <RefreshCw className="state-icon spinner" />
          <div className="state-text">
            <strong>Computing Temporal Alignments & Historical Trends...</strong>
            <p>Aggregating observations and running model risk pipeline across {days} daily steps...</p>
          </div>
        </div>
      ) : error ? (
        <div className="weather-state-box error-state" style={{ marginBottom: '20px' }}>
          <ShieldAlert className="state-icon error-color" />
          <div className="state-text">
            <strong>Temporal Analysis Service Error</strong>
            <p>{error}</p>
          </div>
        </div>
      ) : data ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Section 1: Satellite Fire Activity Trend (NASA FIRMS) */}
          <div className="map-panel-card">
            <div className="panel-header-title" style={{ marginBottom: '12px' }}>
              <Flame className="panel-header-icon" style={{ color: '#dc2626' }} />
              <div>
                <h4>1. Historical Satellite Fire Detections Trend ({days}-Day Window)</h4>
                <span className="panel-subtitle">
                  Observed radiometer thermal anomaly count per day (NASA FIRMS VIIRS/MODIS)
                </span>
              </div>
            </div>

            {data.fire_activity_trend.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: '140px', padding: '12px 0 6px 0', borderBottom: '1px solid #cbd5e1' }}>
                  {data.fire_activity_trend.map((pt) => {
                    const barHeightPct = maxDetections > 0 ? (pt.detection_count / maxDetections) * 100 : 0;
                    return (
                      <div
                        key={pt.date}
                        style={{
                          flex: 1,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          height: '100%',
                          justifyContent: 'flex-end'
                        }}
                      >
                        <span style={{ fontSize: '0.66rem', fontWeight: 700, color: pt.detection_count > 0 ? '#991b1b' : '#94a3b8', marginBottom: '2px' }}>
                          {pt.detection_count}
                        </span>
                        <div
                          style={{
                            width: '100%',
                            maxWidth: '24px',
                            height: `${Math.max(4, barHeightPct)}%`,
                            backgroundColor: pt.detection_count > 0 ? '#ef4444' : '#e2e8f0',
                            borderRadius: '3px 3px 0 0',
                            transition: 'height 0.3s ease'
                          }}
                          title={`${pt.date}: ${pt.detection_count} satellite thermal detections`}
                        />
                        <span style={{ fontSize: '0.60rem', color: '#64748b', marginTop: '4px', transform: 'rotate(-45deg)', transformOrigin: 'top left', whiteSpace: 'nowrap' }}>
                          {pt.date.slice(5)}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div style={{ fontSize: '0.68rem', color: '#64748b', fontStyle: 'italic', marginTop: '16px' }}>
                  * Source: NASA FIRMS Satellite Radiometer Telemetry. Detections represent pixel thermal anomalies, not confirmed ground wildfire perimeters.
                </div>
              </div>
            ) : (
              <div style={{ padding: '20px', textAlign: 'center', color: '#64748b', fontSize: '0.78rem' }}>
                No satellite thermal anomalies detected for the selected period.
              </div>
            )}
          </div>

          {/* Section 2: Observed Environmental Conditions Trend (Open-Meteo & Sentinel-2) */}
          <div className="map-panel-card">
            <div className="panel-header-title" style={{ marginBottom: '12px' }}>
              <Thermometer className="panel-header-icon" style={{ color: '#0284c7' }} />
              <div>
                <h4>2. Observed Environmental Conditions Trend</h4>
                <span className="panel-subtitle">
                  Daily meteorological metrics (Temperature, Humidity, Wind Speed, Precipitation) & NDVI canopy vigor
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
              {/* Temperature Trend Mini Card */}
              <div style={{ backgroundColor: '#fff7ed', border: '1px solid #ffedd5', borderRadius: '8px', padding: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#c2410c', fontWeight: 700, fontSize: '0.80rem' }}>
                  <Thermometer size={16} /> Air Temperature (°C)
                </div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#9a3412', margin: '4px 0' }}>
                  {data.environmental_trend.length > 0
                    ? `${(data.environmental_trend.reduce((a, b) => a + b.temperature_2m, 0) / data.environmental_trend.length).toFixed(1)}°C avg`
                    : 'N/A'}
                </div>
                <div style={{ fontSize: '0.68rem', color: '#ea580c' }}>
                  Max: {Math.max(...data.environmental_trend.map(e => e.temperature_2m)).toFixed(1)}°C | Min: {Math.min(...data.environmental_trend.map(e => e.temperature_2m)).toFixed(1)}°C
                </div>
              </div>

              {/* Relative Humidity Trend Mini Card */}
              <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#15803d', fontWeight: 700, fontSize: '0.80rem' }}>
                  <Droplets size={16} /> Relative Humidity (%)
                </div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#166534', margin: '4px 0' }}>
                  {data.environmental_trend.length > 0
                    ? `${(data.environmental_trend.reduce((a, b) => a + b.relative_humidity_2m, 0) / data.environmental_trend.length).toFixed(1)}% avg`
                    : 'N/A'}
                </div>
                <div style={{ fontSize: '0.68rem', color: '#16a34a' }}>
                  Min RH: {Math.min(...data.environmental_trend.map(e => e.relative_humidity_2m)).toFixed(1)}% (Drying Indicator)
                </div>
              </div>

              {/* Wind Speed Trend Mini Card */}
              <div style={{ backgroundColor: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '8px', padding: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#0369a1', fontWeight: 700, fontSize: '0.80rem' }}>
                  <Wind size={16} /> Wind Speed (km/h)
                </div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#075985', margin: '4px 0' }}>
                  {data.environmental_trend.length > 0
                    ? `${(data.environmental_trend.reduce((a, b) => a + b.wind_speed_10m, 0) / data.environmental_trend.length).toFixed(1)} km/h`
                    : 'N/A'}
                </div>
                <div style={{ fontSize: '0.68rem', color: '#0284c7' }}>
                  Peak Velocity: {Math.max(...data.environmental_trend.map(e => e.wind_speed_10m)).toFixed(1)} km/h
                </div>
              </div>

              {/* NDVI Vegetation Vigor Mini Card */}
              <div style={{ backgroundColor: '#faf5ff', border: '1px solid #f3e8ff', borderRadius: '8px', padding: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#7e22ce', fontWeight: 700, fontSize: '0.80rem' }}>
                  <Activity size={16} /> Sentinel-2 NDVI Index
                </div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#6b21a8', margin: '4px 0' }}>
                  {data.environmental_trend.length > 0
                    ? `${(data.environmental_trend.reduce((a, b) => a + b.ndvi, 0) / data.environmental_trend.length).toFixed(2)} mean`
                    : 'N/A'}
                </div>
                <div style={{ fontSize: '0.68rem', color: '#9333ea' }}>
                  Canopy Status: High Foliage Vigor
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Model-Predicted Wildfire Risk Trend (XGBoost + Platt Calibration) */}
          <div className="map-panel-card">
            <div className="panel-header-title" style={{ marginBottom: '12px' }}>
              <Sparkles className="panel-header-icon" style={{ color: '#d97706' }} />
              <div>
                <h4>3. Model-Predicted Wildfire Risk Trend (Calibrated XGBoost)</h4>
                <span className="panel-subtitle">
                  Daily Platt-calibrated hazard probability evaluated by XGBoost model pipeline over observation dates
                </span>
              </div>
            </div>

            <div className="fire-records-table-wrapper">
              <table className="fire-records-table">
                <thead>
                  <tr>
                    <th>Observation Date</th>
                    <th>Calibrated Probability</th>
                    <th>Raw Model Score</th>
                    <th>Validated Risk Category</th>
                    <th>Primary Contributor (TreeSHAP)</th>
                    <th>Model Version</th>
                  </tr>
                </thead>
                <tbody>
                  {data.model_risk_trend.map((m: ModelRiskTrendPoint) => {
                    const isHigh = m.calibrated_probability >= 0.55;
                    const isMod = m.calibrated_probability >= 0.35 && m.calibrated_probability < 0.55;
                    return (
                      <tr key={m.date}>
                        <td className="table-time">
                          <Calendar className="inline-icon" /> {m.date}
                        </td>
                        <td className="table-numeric" style={{ fontWeight: 800, color: isHigh ? '#dc2626' : isMod ? '#d97706' : '#166534' }}>
                          {(m.calibrated_probability * 100).toFixed(1)}%
                        </td>
                        <td className="table-numeric" style={{ color: '#64748b' }}>
                          {(m.raw_model_probability * 100).toFixed(1)}%
                        </td>
                        <td>
                          <span style={{
                            fontSize: '0.68rem',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontWeight: 700,
                            backgroundColor: isHigh ? '#fee2e2' : isMod ? '#fef3c7' : '#dcfce7',
                            color: isHigh ? '#991b1b' : isMod ? '#b45309' : '#166534'
                          }}>
                            {m.risk_category}
                          </span>
                        </td>
                        <td className="table-desc">{m.primary_contributor}</td>
                        <td style={{ fontSize: '0.68rem', color: '#64748b' }}>XGBoost v1.0 (Platt Scaled)</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 4: Statistical Correlation Analysis Panel */}
          {data.correlations.length > 0 && (
            <div className="map-panel-card">
              <div className="panel-header-title" style={{ marginBottom: '12px' }}>
                <BarChart2 className="panel-header-icon" style={{ color: '#2563eb' }} />
                <div>
                  <h4>4. Statistical Correlation Analysis (Pearson r)</h4>
                  <span className="panel-subtitle">
                    Lightweight statistical co-occurrence evaluation between observed variables and model risk
                  </span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
                {data.correlations.map((c: CorrelationMetric, idx: number) => (
                  <div
                    key={idx}
                    style={{
                      backgroundColor: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      padding: '12px'
                    }}
                  >
                    <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                      {c.variable_x} ↔ {c.variable_y}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '6px' }}>
                      <span style={{ fontSize: '1.2rem', fontWeight: 800, color: c.pearson_r >= 0 ? '#1d4ed8' : '#059669' }}>
                        r = {c.pearson_r > 0 ? `+${c.pearson_r}` : c.pearson_r}
                      </span>
                      <span style={{ fontSize: '0.68rem', color: '#64748b' }}>
                        (Sample size N = {c.sample_size} days)
                      </span>
                    </div>
                    <p style={{ fontSize: '0.70rem', color: '#475569', margin: '0 0 6px 0', lineHeight: 1.4 }}>
                      {c.interpretation}
                    </p>
                    <div style={{ fontSize: '0.62rem', color: '#94a3b8', fontStyle: 'italic', borderTop: '1px solid #f1f5f9', paddingTop: '4px' }}>
                      * {c.disclaimer}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Scientific Integrity Disclaimer */}
          <div className="ndvi-guardrail-banner" style={{ backgroundColor: '#f0f9ff', borderColor: '#bae6fd', borderLeftColor: '#0284c7' }}>
            <ShieldAlert className="guardrail-icon" style={{ color: '#0284c7' }} />
            <div>
              <strong style={{ color: '#0369a1' }}>Scientific Integrity Notice:</strong>
              <p style={{ color: '#075985', margin: '2px 0 0 0', fontSize: '0.72rem' }}>
                {data.scientific_disclaimer}
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default TemporalAnalysisCard;
