import React, { useState, useEffect } from 'react';
import { 
  Database, 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  Cpu, 
  Layers, 
  ListChecks, 
  RefreshCw,
  Info,
  Lock,
  ArrowRight
} from 'lucide-react';
import type { DataPrepState } from '../types/dataPrep';
import { fetchDataReadiness } from '../services/dataPrepService';

interface DataReadinessCardProps {
  lat?: number;
  lng?: number;
}

export const DataReadinessCard: React.FC<DataReadinessCardProps> = ({ lat = 11.6667, lng = 76.6333 }) => {
  const [state, setState] = useState<DataPrepState>({
    report: null,
    loading: true,
    error: null,
  });

  const loadReadiness = async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const data = await fetchDataReadiness(lat, lng, 7);
      setState({ report: data, loading: false, error: null });
    } catch (err: any) {
      setState({ report: null, loading: false, error: err.message || 'Failed to query data readiness' });
    }
  };

  useEffect(() => {
    loadReadiness();
  }, [lat, lng]);

  const report = state.report;

  const getStatusBadgeClass = (status?: string) => {
    switch (status) {
      case 'data_available': return 'status-badge-pill configured';
      case 'partially_available': return 'status-badge-pill warning';
      default: return 'status-badge-pill unconfigured';
    }
  };

  const getStatusText = (status?: string) => {
    switch (status) {
      case 'data_available': return 'DATA AVAILABLE';
      case 'partially_available': return 'PARTIALLY AVAILABLE';
      case 'configuration_required': return 'CONFIGURATION REQUIRED';
      default: return 'INSUFFICIENT DATA';
    }
  };

  return (
    <div className="map-panel-card data-readiness-card" style={{ marginTop: '24px' }}>
      {/* Header */}
      <div className="panel-header">
        <div className="panel-header-title">
          <Database className="panel-header-icon" style={{ color: '#0284c7' }} />
          <div>
            <h3>Dataset Preparation & Machine Learning Readiness</h3>
            <span className="panel-subtitle">
              Spatio-temporal data alignment, validation guardrails, candidate feature engineering, and ML training blockers
            </span>
          </div>
        </div>

        <div className="panel-controls">
          <span className={getStatusBadgeClass(report?.status)}>
            <Cpu className="pill-icon" />
            {getStatusText(report?.status)}
          </span>
          <button
            type="button"
            className="retry-weather-btn"
            onClick={loadReadiness}
            disabled={state.loading}
            title="Re-evaluate data readiness"
          >
            <RefreshCw className={`btn-icon ${state.loading ? 'spinner' : ''}`} />
            <span>Audit Readiness</span>
          </button>
        </div>
      </div>

      {state.loading && (
        <div className="weather-state-box loading-state" style={{ marginTop: '16px' }}>
          <RefreshCw className="state-icon spinner" />
          <div className="state-text">
            <strong>Evaluating Dataset Readiness & Alignment...</strong>
            <p>Running data validation guardrails and checking provider streams...</p>
          </div>
        </div>
      )}

      {!state.loading && report && (
        <div className="data-prep-content" style={{ marginTop: '16px' }}>
          {/* Top Metric Cards */}
          <div className="vegetation-status-grid">
            <div className="veg-status-box">
              <div className="veg-box-label">
                <Layers className="box-sub-icon" />
                WEATHER STREAM
              </div>
              <div className="veg-box-value configured-text" style={{ fontSize: '0.9rem' }}>
                {report.weather_provider_status}
              </div>
              <p className="veg-box-desc">Open-Meteo live API integration active.</p>
            </div>

            <div className="veg-status-box">
              <div className="veg-box-label">
                <Layers className="box-sub-icon" />
                SATELLITE VEGETATION
              </div>
              <div className={`veg-box-value ${report.satellite_provider_status.includes('connected') ? 'configured-text' : 'unconfigured'}`} style={{ fontSize: '0.9rem' }}>
                {report.satellite_provider_status}
              </div>
              <p className="veg-box-desc">Copernicus Sentinel-2 STAC Reflectance pipeline.</p>
            </div>

            <div className="veg-status-box">
              <div className="veg-box-label">
                <Layers className="box-sub-icon" />
                WILDFIRE TELEMETRY
              </div>
              <div className={`veg-box-value ${report.fire_provider_status.includes('connected') ? 'configured-text' : 'unconfigured'}`} style={{ fontSize: '0.9rem' }}>
                {report.fire_provider_status}
              </div>
              <p className="veg-box-desc">NASA FIRMS MODIS & VIIRS active fire hotspots.</p>
            </div>

            <div className="veg-status-box">
              <div className="veg-box-label">
                <Cpu className="box-sub-icon" />
                ML TRAINING READINESS
              </div>
              <div className="veg-box-value neutral" style={{ color: report.is_ml_ready ? '#16a34a' : '#d97706', fontSize: '1rem' }}>
                {report.is_ml_ready ? 'ML READY' : 'NOT READY (PREPARATION ONLY)'}
              </div>
              <p className="veg-box-desc">Strict real-data rule: No fake labels or arbitrary target values.</p>
            </div>
          </div>

          {/* Validation & Candidate Features 2-Column Section */}
          <div className="section-grid-two-col" style={{ marginTop: '16px' }}>
            {/* Left Column: Data Validation Summary */}
            <div className="spec-card" style={{ backgroundColor: '#f8fafc' }}>
              <div className="spec-card-header">
                <ListChecks className="spec-icon green" />
                <h4>Data Validation & Quality Metrics</h4>
              </div>
              <div className="popup-grid" style={{ marginTop: '12px' }}>
                <div className="popup-item">
                  <span>Records Examined:</span> <strong>{report.validation_summary.records_examined}</strong>
                </div>
                <div className="popup-item">
                  <span>Valid Records:</span> <strong style={{ color: '#166534' }}>{report.validation_summary.valid_records}</strong>
                </div>
                <div className="popup-item">
                  <span>Rejected Records:</span> <strong style={{ color: '#991b1b' }}>{report.validation_summary.rejected_records}</strong>
                </div>
                <div className="popup-item">
                  <span>Duplicate Keys Flagged:</span> <strong>{report.validation_summary.duplicate_records_detected}</strong>
                </div>
                <div className="popup-item">
                  <span>Aligned Feature Samples:</span> <strong>{report.total_aligned_samples}</strong>
                </div>
              </div>
              {report.validation_summary.rejection_reasons.length > 0 && (
                <div style={{ marginTop: '12px', fontSize: '0.75rem', color: '#991b1b' }}>
                  <strong>Rejection Reasons:</strong>
                  <ul>
                    {report.validation_summary.rejection_reasons.map((r, i) => <li key={i}>• {r}</li>)}
                  </ul>
                </div>
              )}
            </div>

            {/* Right Column: Candidate Features Checklist */}
            <div className="spec-card" style={{ backgroundColor: '#f8fafc' }}>
              <div className="spec-card-header">
                <Cpu className="spec-icon" style={{ color: '#0284c7' }} />
                <h4>Documented Candidate Features ({report.candidate_features.length})</h4>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginTop: '12px', fontSize: '0.75rem' }}>
                {report.candidate_features.map((feat, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#334155' }}>
                    <CheckCircle2 style={{ width: '12px', height: '12px', color: '#16a34a' }} />
                    <code>{feat}</code>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ML Training Blockers & Required Next Steps */}
          <div className="copernicus-setup-card" style={{ marginTop: '16px' }}>
            <div className="setup-card-header" style={{ cursor: 'default' }}>
              <div className="setup-header-left">
                <Lock className="setup-icon" style={{ color: '#d97706' }} />
                <div>
                  <h4>Machine Learning Model Training Blockers & Requirements</h4>
                  <span className="setup-sub">Why model training is deferred to Stage 8 (No premature XGBoost fitting)</span>
                </div>
              </div>
            </div>

            <div className="setup-card-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <strong style={{ color: '#9a3412', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <AlertTriangle style={{ width: '14px', height: '14px' }} /> Current ML Blockers:
                  </strong>
                  <ul className="setup-steps-list" style={{ marginTop: '8px' }}>
                    {report.ml_training_blockers.map((b, i) => (
                      <li key={i} style={{ color: '#c2410c', fontSize: '0.8rem' }}>{b}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <strong style={{ color: '#0369a1', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <ArrowRight style={{ width: '14px', height: '14px' }} /> Required Next Steps:
                  </strong>
                  <ul className="setup-steps-list" style={{ marginTop: '8px' }}>
                    {report.required_next_steps.map((s, i) => (
                      <li key={i} style={{ color: '#0369a1', fontSize: '0.8rem' }}>{s}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="setup-note-box" style={{ marginTop: '12px' }}>
                <Info className="note-icon" />
                <span>{report.disclaimer}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default DataReadinessCard;
