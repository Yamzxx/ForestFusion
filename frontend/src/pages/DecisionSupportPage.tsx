import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  ShieldAlert, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  Info, 
  RefreshCw, 
  Clock, 
  MapPin, 
  Thermometer, 
  Droplets, 
  Wind, 
  CloudRain, 
  Activity, 
  Flame, 
  FileText, 
  Search, 
  SlidersHorizontal
} from 'lucide-react';
import type { 
  DecisionSupportSummary, 
  DecisionSupportAttentionItem,
  DecisionSupportAttentionListResponse
} from '../types/decisionSupport';
import type { SpatialPredictionRequest } from '../types/spatial';
import { fetchDecisionSupportSummary, fetchAttentionList } from '../services/decisionSupportService';

export const DecisionSupportPage: React.FC = () => {
  const [attentionData, setAttentionData] = useState<DecisionSupportAttentionListResponse | null>(null);
  const [listLoading, setListLoading] = useState<boolean>(true);
  const [selectedSectorName, setSelectedSectorName] = useState<string>('Bandipur Core Forest Sector A');
  const [summary, setSummary] = useState<DecisionSupportSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState<boolean>(false);
  const [filterLevel, setFilterLevel] = useState<string>('ALL');

  // Load attention list on mount
  const loadAttentionList = async () => {
    setListLoading(true);
    try {
      const data = await fetchAttentionList();
      setAttentionData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    loadAttentionList();
  }, []);

  // Load decision support summary whenever selected sector changes
  useEffect(() => {
    let active = true;
    setSummaryLoading(true);

    const targetReq: SpatialPredictionRequest = {
      latitude: selectedSectorName.includes('Nagarhole') ? 11.986 : selectedSectorName.includes('Wayanad') ? 11.685 : selectedSectorName.includes('Mudumalai') ? 11.562 : 11.664,
      longitude: selectedSectorName.includes('Nagarhole') ? 76.124 : selectedSectorName.includes('Wayanad') ? 76.132 : selectedSectorName.includes('Mudumalai') ? 76.534 : 76.627,
      location_name: selectedSectorName,
      environmental_inputs: {
        temperature_2m: selectedSectorName.includes('Wayanad') ? 26.5 : selectedSectorName.includes('Nagarhole') ? 31.0 : 34.2,
        relative_humidity_2m: selectedSectorName.includes('Wayanad') ? 58.0 : selectedSectorName.includes('Nagarhole') ? 32.0 : 22.0,
        wind_speed_10m: selectedSectorName.includes('Wayanad') ? 9.0 : selectedSectorName.includes('Nagarhole') ? 14.0 : 21.0,
        precipitation: selectedSectorName.includes('Wayanad') ? 1.2 : 0.0,
        ndvi: selectedSectorName.includes('Wayanad') ? 0.78 : selectedSectorName.includes('Nagarhole') ? 0.61 : 0.42,
        ndmi: selectedSectorName.includes('Wayanad') ? 0.31 : selectedSectorName.includes('Nagarhole') ? 0.08 : -0.15,
        month: 4
      }
    };

    fetchDecisionSupportSummary(targetReq)
      .then((res) => {
        if (active) setSummary(res);
      })
      .finally(() => {
        if (active) setSummaryLoading(false);
      });

    return () => {
      active = false;
    };
  }, [selectedSectorName]);

  const filteredItems = attentionData?.attention_items
    ? filterLevel === 'ALL'
      ? attentionData.attention_items
      : attentionData.attention_items.filter(item => item.risk_category.toUpperCase() === filterLevel)
    : [];

  const getStatusBadgeStyle = (code: string) => {
    switch (code) {
      case 'HIGH_ATTENTION_CRITICAL_REVIEW':
        return { bg: '#fee2e2', text: '#991b1b', border: '#fca5a5', icon: ShieldAlert };
      case 'ELEVATED_ATTENTION_RECOMMENDED':
        return { bg: '#ffedd5', text: '#c2410c', border: '#fdba74', icon: AlertTriangle };
      case 'MODERATE_REVIEW':
        return { bg: '#fef3c7', text: '#b45309', border: '#fcd34d', icon: Info };
      case 'NORMAL_MONITORING':
      default:
        return { bg: '#dcfce7', text: '#166534', border: '#86efac', icon: CheckCircle2 };
    }
  };

  return (
    <div className="page-container decision-support-page">
      {/* Top Header Card */}
      <div className="map-panel-card" style={{ marginBottom: '20px' }}>
        <div className="panel-header">
          <div className="panel-header-title">
            <Bell className="panel-header-icon" style={{ color: '#0284c7' }} />
            <div>
              <h3>Wildfire Risk Attention & Decision Support Center</h3>
              <span className="panel-subtitle">
                Model-backed risk attention notifications, contextual multi-source evidence, TreeSHAP attributions, and analyst decision guidance
              </span>
            </div>
          </div>

          <div className="panel-controls">
            <span className="status-badge-pill configured">
              <Sparkles className="pill-icon" /> MODEL DECISION ENGINE ACTIVE
            </span>
            <button
              type="button"
              className="retry-weather-btn"
              onClick={loadAttentionList}
              disabled={listLoading}
              title="Refresh risk attention list"
            >
              <RefreshCw className={`btn-icon ${listLoading ? 'spinner' : ''}`} />
              <span>Refresh Attention List</span>
            </button>
          </div>
        </div>

        {/* Non-Operational Safety Disclaimer Banner */}
        <div style={{
          marginTop: '12px',
          padding: '10px 14px',
          backgroundColor: '#f0f9ff',
          border: '1px solid #bae6fd',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '10px'
        }}>
          <Info size={18} style={{ color: '#0284c7', flexShrink: 0, marginTop: '2px' }} />
          <div style={{ fontSize: '0.76rem', color: '#0369a1', lineHeight: 1.45 }}>
            <strong>Decision-Support Notice:</strong> ForestFusion provides model-based risk attention notifications derived from calibrated XGBoost statistical hazard probabilities. 
            Model-predicted risk does NOT equal confirmed wildfire activity and is NOT an operational emergency warning system or dispatch trigger.
          </div>
        </div>
      </div>

      {/* Main Grid: Attention List (Left/Top) & Decision Support Analysis (Right/Bottom) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        {/* Monitored Sector Risk Attention List Card */}
        <div className="map-panel-card" style={{ height: 'fit-content' }}>
          <div className="panel-header-title" style={{ marginBottom: '12px', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldAlert size={18} style={{ color: '#dc2626' }} />
              <h4>Monitored Sector Risk Attention List</h4>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <SlidersHorizontal size={14} style={{ color: '#64748b' }} />
              <select
                value={filterLevel}
                onChange={(e) => setFilterLevel(e.target.value)}
                style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '0.72rem', border: '1px solid #cbd5e1', fontWeight: 600 }}
              >
                <option value="ALL">All Categories</option>
                <option value="VERY HIGH">Very High Risk</option>
                <option value="HIGH">High Risk</option>
                <option value="MODERATE">Moderate Risk</option>
                <option value="LOW">Low Risk</option>
              </select>
            </div>
          </div>

          {listLoading ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#0284c7', fontSize: '0.78rem' }}>
              Evaluating monitored sector risk attention items...
            </div>
          ) : filteredItems.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {filteredItems.map((item: DecisionSupportAttentionItem) => {
                const style = getStatusBadgeStyle(item.attention_status_code);
                const IconComp = style.icon;
                const isSelected = item.location_name === selectedSectorName;

                return (
                  <div
                    key={item.location_name}
                    onClick={() => setSelectedSectorName(item.location_name)}
                    style={{
                      padding: '12px',
                      borderRadius: '8px',
                      border: isSelected ? '2px solid #0284c7' : `1px solid ${style.border}`,
                      backgroundColor: isSelected ? '#f0f9ff' : style.bg,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <strong style={{ fontSize: '0.84rem', color: '#0f172a' }}>{item.location_name}</strong>
                      <span style={{
                        fontSize: '0.66rem',
                        padding: '2px 7px',
                        borderRadius: '4px',
                        fontWeight: 700,
                        backgroundColor: style.text,
                        color: '#ffffff'
                      }}>
                        {item.risk_category}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                      <span style={{ fontSize: '1.1rem', fontWeight: 800, color: style.text }}>
                        {(item.calibrated_probability * 100).toFixed(1)}%
                      </span>
                      <span style={{ fontSize: '0.68rem', color: style.text, fontWeight: 600 }}>
                        Calibrated Hazard Probability
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '6px', fontSize: '0.68rem', color: '#475569' }}>
                      <IconComp size={13} style={{ color: style.text }} />
                      <strong style={{ color: style.text }}>{item.attention_status_label}</strong>
                    </div>

                    <div style={{ fontSize: '0.64rem', color: '#64748b', marginTop: '4px' }}>
                      Primary Risk Factor: <strong>{item.primary_shap_contributor}</strong>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ padding: '20px', textAlign: 'center', color: '#64748b', fontSize: '0.78rem' }}>
              No elevated model-predicted risk is currently available for the selected filter.
            </div>
          )}
        </div>

        {/* Selected Sector Decision Support Analysis Summary Panel */}
        <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {summaryLoading ? (
            <div className="weather-state-box loading-state">
              <RefreshCw className="state-icon spinner" />
              <div className="state-text">
                <strong>Generating Decision Support Summary...</strong>
                <p>Computing calibrated probability, TreeSHAP attributions, and evidence context for {selectedSectorName}...</p>
              </div>
            </div>
          ) : summary && summary.is_available ? (
            <>
              {/* Risk Attention Banner */}
              {(() => {
                const style = getStatusBadgeStyle(summary.attention_status_code);
                const IconComp = style.icon;
                return (
                  <div style={{
                    backgroundColor: style.bg,
                    border: `1.5px solid ${style.border}`,
                    borderRadius: '8px',
                    padding: '16px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <IconComp size={24} style={{ color: style.text }} />
                        <div>
                          <h4 style={{ margin: 0, color: style.text, fontSize: '1.05rem', fontWeight: 800 }}>
                            {summary.attention_status_label}
                          </h4>
                          <span style={{ fontSize: '0.72rem', color: style.text, opacity: 0.9 }}>
                            Target Sector: {summary.location_name} ({summary.latitude.toFixed(3)}°, {summary.longitude.toFixed(3)}°)
                          </span>
                        </div>
                      </div>

                      <span style={{
                        backgroundColor: style.text,
                        color: '#ffffff',
                        fontSize: '0.72rem',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontWeight: 800
                      }}>
                        {summary.risk_category} RISK
                      </span>
                    </div>

                    <p style={{ margin: '10px 0 0 0', fontSize: '0.78rem', color: style.text, fontWeight: 500, lineHeight: 1.45 }}>
                      {summary.attention_highlight_reason}
                    </p>
                  </div>
                );
              })()}

              {/* Inference & Calibration Metrics Grid */}
              <div className="map-panel-card">
                <div className="panel-header-title" style={{ marginBottom: '12px' }}>
                  <Activity className="panel-header-icon" style={{ color: '#0284c7' }} />
                  <h4>Model Inference & Calibration Metrics</h4>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
                  <div style={{ backgroundColor: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.68rem', color: '#64748b' }}>Calibrated Probability</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0369a1' }}>
                      {(summary.calibrated_probability * 100).toFixed(1)}%
                    </div>
                    <div style={{ fontSize: '0.62rem', color: '#0284c7' }}>Platt Sigmoid Scaled</div>
                  </div>

                  <div style={{ backgroundColor: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.68rem', color: '#64748b' }}>Uncalibrated Raw Score</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#475569' }}>
                      {(summary.raw_model_probability * 100).toFixed(1)}%
                    </div>
                    <div style={{ fontSize: '0.62rem', color: '#64748b' }}>Raw XGBoost Output</div>
                  </div>

                  <div style={{ backgroundColor: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.68rem', color: '#64748b' }}>Predicted Class</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: summary.predicted_class === 1 ? '#dc2626' : '#166534' }}>
                      Class {summary.predicted_class}
                    </div>
                    <div style={{ fontSize: '0.62rem', color: '#64748b' }}>{summary.predicted_class === 1 ? 'Elevated Hazard' : 'Baseline Low'}</div>
                  </div>

                  <div style={{ backgroundColor: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.68rem', color: '#64748b' }}>Model Version</div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginTop: '4px' }}>
                      {summary.model_name_version}
                    </div>
                  </div>
                </div>
              </div>

              {/* TreeSHAP Model Attribution Panel */}
              <div className="map-panel-card">
                <div className="panel-header-title" style={{ marginBottom: '12px' }}>
                  <Sparkles className="panel-header-icon" style={{ color: '#d97706' }} />
                  <div>
                    <h4>Why Model Output Was Highlighted (TreeSHAP Attribution)</h4>
                    <span className="panel-subtitle">
                      Local feature contributions explaining model decision margin
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {summary.shap_contributors.map((sc, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '8px 12px',
                        backgroundColor: sc.direction === 'INCREASED_RISK' ? '#fff1f2' : '#f0fdf4',
                        borderLeft: `4px solid ${sc.direction === 'INCREASED_RISK' ? '#e11d48' : '#16a34a'}`,
                        borderRadius: '4px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#1e293b' }}>
                          {sc.feature} (Observed value: {sc.feature_value})
                        </span>
                        <span style={{ fontSize: '0.72rem', fontWeight: 800, color: sc.direction === 'INCREASED_RISK' ? '#be123c' : '#15803d' }}>
                          {sc.shap_value >= 0 ? '+' : ''}{sc.shap_value.toFixed(3)} SHAP ({sc.direction === 'INCREASED_RISK' ? '↑ risk' : '↓ risk'})
                        </span>
                      </div>
                      <p style={{ margin: '2px 0 0 0', fontSize: '0.70rem', color: '#475569' }}>
                        {sc.explanatory_statement}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Contextual Evidence Matrix */}
              <div className="map-panel-card">
                <div className="panel-header-title" style={{ marginBottom: '12px' }}>
                  <FileText className="panel-header-icon" style={{ color: '#2563eb' }} />
                  <h4>Multi-Source Contextual Evidence Matrix</h4>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                  {/* Environmental Evidence */}
                  <div style={{ backgroundColor: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                      🌤️ Meteorological Evidence
                    </div>
                    <div style={{ fontSize: '0.70rem', color: '#475569', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <div>Temp: <strong>{summary.environmental_evidence.temperature_2m}</strong></div>
                      <div>Humidity: <strong>{summary.environmental_evidence.relative_humidity_2m}</strong></div>
                      <div>Wind: <strong>{summary.environmental_evidence.wind_speed_10m}</strong></div>
                    </div>
                  </div>

                  {/* Vegetation Evidence */}
                  <div style={{ backgroundColor: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                      🌿 Satellite Canopy Evidence
                    </div>
                    <div style={{ fontSize: '0.70rem', color: '#475569', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <div>NDVI Vigor: <strong>{summary.vegetation_evidence.ndvi}</strong></div>
                      <div>NDMI Moisture: <strong>{summary.vegetation_evidence.ndmi}</strong></div>
                      <div>Status: <strong>{summary.vegetation_evidence.foliage_status}</strong></div>
                    </div>
                  </div>

                  {/* Historical Satellite Context */}
                  <div style={{ backgroundColor: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                      📡 Historical Satellite Context
                    </div>
                    <div style={{ fontSize: '0.70rem', color: '#475569', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <div>FIRMS Hotspots (14d): <strong>{summary.historical_context.regional_firms_hotspots_14d}</strong></div>
                      <div>Source: <strong>{summary.historical_context.firms_provider}</strong></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Analyst Decision-Support Recommendations */}
              <div className="map-panel-card">
                <div className="panel-header-title" style={{ marginBottom: '12px' }}>
                  <CheckCircle2 className="panel-header-icon" style={{ color: '#16a34a' }} />
                  <h4>Non-Operational Analyst Recommendations</h4>
                </div>

                <ol style={{ margin: 0, paddingLeft: '20px', fontSize: '0.76rem', color: '#334155', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {summary.decision_support_recommendations.map((rec, idx) => (
                    <li key={idx} style={{ lineHeight: 1.45 }}>{rec}</li>
                  ))}
                </ol>
              </div>

              {/* Data Freshness & Scientific Guardrail Notice */}
              <div className="ndvi-guardrail-banner" style={{ backgroundColor: '#f8fafc', borderColor: '#cbd5e1', borderLeftColor: '#475569' }}>
                <Clock className="guardrail-icon" style={{ color: '#475569' }} />
                <div style={{ fontSize: '0.72rem', color: '#475569' }}>
                  <strong>Data Freshness & Provenance:</strong> Prediction generated at {summary.prediction_timestamp}. 
                  Telemetry provider: {summary.data_freshness.telemetry_source}. Calibration: {summary.data_freshness.calibration_method}.
                </div>
              </div>
            </>
          ) : (
            <div className="weather-state-box error-state">
              <AlertTriangle className="state-icon error-color" />
              <div className="state-text">
                <strong>Decision Support Unavailable</strong>
                <p>{summary?.error_message || 'Required inputs could not be fetched.'}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DecisionSupportPage;
