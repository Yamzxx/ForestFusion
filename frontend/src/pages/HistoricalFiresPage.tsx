import React, { useState } from 'react';
import { 
  Flame, 
  Clock, 
  MapPin, 
  AlertCircle, 
  RefreshCw, 
  ShieldAlert, 
  Info, 
  Key, 
  ChevronDown, 
  ChevronUp, 
  Satellite, 
  Database,
  Calendar,
  Filter,
  TrendingUp,
  BarChart3
} from 'lucide-react';
import type { FireState, FireDetectionRecord } from '../types/fire';
import { TemporalAnalysisCard } from '../components/TemporalAnalysisCard';

interface HistoricalFiresPageProps {
  fireState: FireState;
  days: number;
  source: string;
  onChangeDays: (days: number) => void;
  onChangeSource: (source: string) => void;
  onRetryFire: () => void;
}

export const HistoricalFiresPage: React.FC<HistoricalFiresPageProps> = ({
  fireState,
  days,
  source,
  onChangeDays,
  onChangeSource,
  onRetryFire,
}) => {
  const { data, loading, error } = fireState;
  const [showSetupGuide, setShowSetupGuide] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'detections' | 'temporal'>('temporal');

  return (
    <div className="page-container historical-fires-page">
      {/* Top Header Panel Card */}
      <div className="map-panel-card" style={{ marginBottom: '20px' }}>
        <div className="panel-header">
          <div className="panel-header-title">
            <Flame className="panel-header-icon" style={{ color: '#ea580c' }} />
            <div>
              <h3>Historical Wildfire Catalog & Temporal Risk Analysis</h3>
              <span className="panel-subtitle">
                NASA FIRMS satellite thermal anomalies, historical environmental trends, and calibrated model risk evaluation
              </span>
            </div>
          </div>

          <div className="panel-controls">
            {/* View Mode Toggle Switcher */}
            <div className="map-type-toggle" title="Switch view between temporal risk trends and satellite detections log">
              <button
                className={`toggle-btn ${activeTab === 'temporal' ? 'active' : ''}`}
                onClick={() => setActiveTab('temporal')}
              >
                <TrendingUp size={13} className="inline-icon" /> Temporal Analysis
              </button>
              <button
                className={`toggle-btn ${activeTab === 'detections' ? 'active' : ''}`}
                onClick={() => setActiveTab('detections')}
              >
                <Flame size={13} className="inline-icon" /> FIRMS Detections Log ({data?.total_detections ?? 0})
              </button>
            </div>

            <span className={`status-badge-pill ${data?.is_configured ? 'configured' : 'unconfigured'}`}>
              <Satellite className="pill-icon" />
              {data?.is_configured ? 'NASA FIRMS CONNECTED' : 'NASA FIRMS UNCONFIGURED'}
            </span>

            <button
              type="button"
              className="retry-weather-btn"
              onClick={onRetryFire}
              disabled={loading}
              title="Refresh active-fire telemetry pipeline"
            >
              <RefreshCw className={`btn-icon ${loading ? 'spinner' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Filter Controls Bar (Visible in Detections Log view) */}
        {activeTab === 'detections' && (
          <div className="fire-filters-bar">
            <div className="filter-group">
              <Calendar className="filter-icon" />
              <label className="filter-label">Timeframe:</label>
              <select
                value={days}
                onChange={(e) => onChangeDays(Number(e.target.value))}
                className="filter-select"
              >
                <option value={1}>Past 24 Hours (1 Day)</option>
                <option value={7}>Past 7 Days</option>
                <option value={14}>Past 14 Days</option>
                <option value={30}>Past 30 Days</option>
              </select>
            </div>

            <div className="filter-group">
              <Filter className="filter-icon" />
              <label className="filter-label">Satellite Instrument:</label>
              <select
                value={source}
                onChange={(e) => onChangeSource(e.target.value)}
                className="filter-select"
              >
                <option value="VIIRS_SNPP_NRT">VIIRS S-NPP (375m NRT)</option>
                <option value="VIIRS_NOAA20_NRT">VIIRS NOAA-20 (375m NRT)</option>
                <option value="MODIS_NRT">MODIS Terra/Aqua (1km NRT)</option>
              </select>
            </div>

            <div className="filter-summary-badge">
              <Database className="badge-icon" />
              <span>Retrieved Detections: <strong>{data?.total_detections ?? 0}</strong></span>
            </div>
          </div>
        )}
      </div>

      {/* Render Active View Tab */}
      {activeTab === 'temporal' ? (
        <TemporalAnalysisCard initialDays={days} />
      ) : (
        <>
          {/* Loading State */}
          {loading && (
            <div className="weather-state-box loading-state" style={{ marginBottom: '20px' }}>
              <RefreshCw className="state-icon spinner" />
              <div className="state-text">
                <strong>Querying NASA FIRMS Satellite Telemetry...</strong>
                <p>Fetching active-fire detection records for instrument {source} (past {days} days)...</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {!loading && error && (
            <div className="weather-state-box error-state" style={{ marginBottom: '20px' }}>
              <AlertCircle className="state-icon error-color" />
              <div className="state-text">
                <strong>NASA FIRMS Telemetry Service Error</strong>
                <p>{error}</p>
              </div>
              <button type="button" className="error-retry-btn" onClick={onRetryFire}>
                Retry Request
              </button>
            </div>
          )}

          {/* Detections Log View */}
          {!loading && !error && (
            <>
              {/* Data Provenance & Limitations Banner */}
              <div className="ndvi-guardrail-banner" style={{ marginBottom: '20px', backgroundColor: '#fff7ed', borderColor: '#ffedd5', borderLeftColor: '#ea580c' }}>
                <ShieldAlert className="guardrail-icon" style={{ color: '#ea580c' }} />
                <div>
                  <strong style={{ color: '#9a3412' }}>Data Provenance & Scientific Limitations Notice:</strong>
                  <p style={{ color: '#c2410c' }}>
                    {data?.data_limitations || 'Satellite active-fire detections represent radiometer thermal anomalies (hotspots) at 375m/1km pixel resolution. They are not automatically confirmed ground wildfires or exact burn boundaries.'}
                  </p>
                </div>
              </div>

              {/* NASA FIRMS API Setup Guide Card */}
              {!data?.is_configured && (
                <div className="copernicus-setup-card" style={{ marginBottom: '20px' }}>
                  <div className="setup-card-header" onClick={() => setShowSetupGuide(!showSetupGuide)}>
                    <div className="setup-header-left">
                      <Key className="setup-icon" />
                      <div>
                        <h4>NASA FIRMS Active-Fire Telemetry Setup Guide</h4>
                        <span className="setup-sub">How to configure your free NASA FIRMS API Map Key in ForestFusion</span>
                      </div>
                    </div>
                    <button type="button" className="toggle-setup-btn">
                      {showSetupGuide ? <ChevronUp className="btn-icon" /> : <ChevronDown className="btn-icon" />}
                    </button>
                  </div>

                  {showSetupGuide && (
                    <div className="setup-card-body">
                      <p className="setup-intro">
                        ForestFusion enforces a strict <strong>Real Data Only</strong> policy. To retrieve live satellite active-fire detections from NASA MODIS & VIIRS instruments, configure a free NASA FIRMS API key:
                      </p>

                      <ol className="setup-steps-list">
                        {(data?.setup_instructions || [
                          "1. Request a free NASA FIRMS API Map Key at https://firms.modaps.eosdis.nasa.gov/api/map_key.",
                          "2. Copy your unique NASA FIRMS MAP_KEY from the confirmation email.",
                          "3. Set environment variable NASA_FIRMS_MAP_KEY='your_key' in your backend environment or backend/.env file.",
                          "4. Restart the FastAPI server (cd backend && python -m uvicorn app.main:app --reload --port 8000)."
                        ]).map((step, idx) => (
                          <li key={idx}>{step}</li>
                        ))}
                      </ol>
                    </div>
                  )}
                </div>
              )}

              {/* Detections Data Table */}
              <div className="vegetation-trend-section">
                <div className="panel-header-title" style={{ marginBottom: '16px' }}>
                  <Flame className="panel-header-icon" style={{ color: '#ea580c' }} />
                  <h4>Satellite Thermal Anomaly Detections Log ({data?.detections?.length ?? 0} Records)</h4>
                </div>

                {data && data.detections && data.detections.length > 0 ? (
                  <div className="fire-records-table-wrapper">
                    <table className="fire-records-table">
                      <thead>
                        <tr>
                          <th>Observation Date & Time</th>
                          <th>Latitude / Longitude</th>
                          <th>Instrument & Satellite</th>
                          <th>Confidence</th>
                          <th>Brightness Temp (K)</th>
                          <th>FRP (MW)</th>
                          <th>Detection Type</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.detections.map((rec: FireDetectionRecord) => (
                          <tr key={rec.id}>
                            <td className="table-time">
                              <Clock className="inline-icon" /> {rec.acq_date} {rec.acq_time} UTC
                            </td>
                            <td className="table-coords">
                              <MapPin className="inline-icon" /> {rec.latitude.toFixed(4)}°, {rec.longitude.toFixed(4)}°
                            </td>
                            <td>{rec.instrument} ({rec.satellite})</td>
                            <td>
                              <span className={`confidence-tag conf-${rec.confidence.toLowerCase()}`}>
                                {rec.confidence}
                              </span>
                            </td>
                            <td className="table-numeric">{rec.brightness} K</td>
                            <td className="table-numeric">{rec.frp !== null && rec.frp !== undefined ? `${rec.frp} MW` : 'N/A'}</td>
                            <td className="table-desc">{rec.detection_type}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="trend-unavailable-box">
                    <Info className="unavail-icon" />
                    <div>
                      <strong>No Satellite Thermal Anomalies Detected</strong>
                      <p>
                        {data?.is_configured 
                          ? `NASA FIRMS query complete: 0 active-fire detections recorded for ${source} over the past ${days} days.` 
                          : 'No genuine fire records available. Configure NASA FIRMS API key to load satellite thermal detection logs.'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default HistoricalFiresPage;
