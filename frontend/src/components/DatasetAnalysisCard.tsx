import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  Cpu, 
  Layers, 
  RefreshCw,
  Info,
  Lock,
  Globe,
  Flame,
  Calendar,
  Crosshair,
  ArrowRight
} from 'lucide-react';
import type { DatasetAnalysisState } from '../types/datasetAnalysis';
import { fetchDatasetAnalysis } from '../services/datasetAnalysisService';

interface DatasetAnalysisCardProps {
  lat?: number;
  lng?: number;
  days?: number;
}

export const DatasetAnalysisCard: React.FC<DatasetAnalysisCardProps> = ({ lat = 11.6667, lng = 76.6333, days = 7 }) => {
  const [state, setState] = useState<DatasetAnalysisState>({
    report: null,
    loading: true,
    error: null,
  });

  const loadAnalysis = async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const data = await fetchDatasetAnalysis(lat, lng, days);
      setState({ report: data, loading: false, error: null });
    } catch (err: any) {
      setState({ report: null, loading: false, error: err.message || 'Failed to query dataset analysis' });
    }
  };

  useEffect(() => {
    loadAnalysis();
  }, [lat, lng, days]);

  const report = state.report;

  const getClassificationBadgeClass = (classification?: string) => {
    if (classification === 'READY FOR BASELINE MODEL') return 'status-badge-pill configured';
    if (classification?.includes('PARTIALLY READY')) return 'status-badge-pill warning';
    return 'status-badge-pill unconfigured';
  };

  return (
    <div className="map-panel-card dataset-analysis-card">
      {/* Panel Header */}
      <div className="panel-header">
        <div className="panel-header-title">
          <BarChart3 className="panel-header-icon" style={{ color: '#0284c7' }} />
          <div>
            <h3>Dataset Analysis & ML Readiness Assessment</h3>
            <span className="panel-subtitle">
              Comprehensive quality audit, temporal/spatial coverage, target label defensibility, and model readiness decision
            </span>
          </div>
        </div>

        <div className="panel-controls">
          <span className={getClassificationBadgeClass(report?.ml_readiness_classification)}>
            <Cpu className="pill-icon" />
            {report?.ml_readiness_classification || 'EVALUATING READINESS...'}
          </span>
          <button
            type="button"
            className="retry-weather-btn"
            onClick={loadAnalysis}
            disabled={state.loading}
            title="Re-run dataset analysis audit"
          >
            <RefreshCw className={`btn-icon ${state.loading ? 'spinner' : ''}`} />
            <span>Run Analysis Audit</span>
          </button>
        </div>
      </div>

      {state.loading && (
        <div className="weather-state-box loading-state" style={{ marginTop: '16px' }}>
          <RefreshCw className="state-icon spinner" />
          <div className="state-text">
            <strong>Performing Real Dataset Analysis Audit...</strong>
            <p>Auditing record counts, coverage bounds, missingness, target defensibility, and feature leakage...</p>
          </div>
        </div>
      )}

      {!state.loading && report && (
        <div className="analysis-content" style={{ marginTop: '16px' }}>
          {/* Main ML Readiness Decision Banner */}
          <div className="ndvi-explanation-card" style={{ backgroundColor: report.ml_readiness_classification.includes('PARTIALLY') ? '#fffbebfb' : '#f8fafc', borderColor: '#fef3c7' }}>
            <div className="explanation-header">
              <ShieldAlert className="exp-icon" style={{ color: '#d97706' }} />
              <h4 style={{ color: '#92400e' }}>ML Readiness Decision: {report.ml_readiness_classification}</h4>
            </div>
            <p style={{ marginTop: '8px', color: '#b45309', fontSize: '0.88rem' }}>
              <strong>Classification Evidence:</strong> {report.classification_justification}
            </p>
          </div>

          {/* Dataset Overview Table */}
          <div className="vegetation-trend-section" style={{ marginTop: '20px' }}>
            <div className="panel-header-title" style={{ marginBottom: '12px' }}>
              <Layers className="panel-header-icon" />
              <h4>Connected Dataset Inventory & Coverage</h4>
            </div>

            <div className="fire-records-table-wrapper">
              <table className="fire-records-table">
                <thead>
                  <tr>
                    <th>Data Stream Name</th>
                    <th>Telemetry Provider</th>
                    <th>Status</th>
                    <th>Record Count</th>
                    <th>Temporal Range</th>
                    <th>Geographic Extent</th>
                  </tr>
                </thead>
                <tbody>
                  {report.dataset_overview.map((src, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 600 }}>{src.source_name}</td>
                      <td>{src.provider}</td>
                      <td>
                        <span className={`confidence-tag ${src.is_configured ? 'conf-high' : 'conf-nominal'}`}>
                          {src.status}
                        </span>
                      </td>
                      <td className="table-numeric"><strong>{src.record_count}</strong></td>
                      <td className="table-time">
                        <Calendar className="inline-icon" /> {src.date_start || 'N/A'} — {src.date_end || 'N/A'}
                      </td>
                      <td className="table-desc">{src.geographic_extent}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Data Quality & Spatial/Temporal Grid */}
          <div className="section-grid-two-col" style={{ marginTop: '20px' }}>
            {/* Left: Quality & Missingness Audit */}
            <div className="spec-card" style={{ backgroundColor: '#ffffff' }}>
              <div className="spec-card-header">
                <CheckCircle2 className="spec-icon green" />
                <h4>Quality & Missingness Audit</h4>
              </div>
              <div className="popup-grid" style={{ marginTop: '12px' }}>
                <div className="popup-item"><span>Records Inspected:</span> <strong>{report.quality_metrics.total_records_inspected}</strong></div>
                <div className="popup-item"><span>Valid Record Count:</span> <strong>{report.quality_metrics.valid_record_count}</strong></div>
                <div className="popup-item"><span>Missingness Metric:</span> <strong>{report.quality_metrics.missing_value_percentage}%</strong></div>
                <div className="popup-item"><span>Duplicates Detected:</span> <strong>{report.quality_metrics.duplicate_count}</strong></div>
                <div className="popup-item"><span>Invalid Coords / Values:</span> <strong>{report.quality_metrics.invalid_coordinate_count}</strong></div>
              </div>
              {report.quality_metrics.exclusion_reasons.length > 0 && (
                <div style={{ marginTop: '12px', fontSize: '0.78rem', color: '#991b1b', backgroundColor: '#fef2f2', padding: '8px', borderRadius: '4px' }}>
                  <strong>Exclusions Log:</strong>
                  <ul style={{ paddingLeft: '16px', margin: '4px 0 0 0' }}>
                    {report.quality_metrics.exclusion_reasons.map((reason, i) => <li key={i}>{reason}</li>)}
                  </ul>
                </div>
              )}
            </div>

            {/* Right: Temporal & Spatial Coverage */}
            <div className="spec-card" style={{ backgroundColor: '#ffffff' }}>
              <div className="spec-card-header">
                <Globe className="spec-icon" style={{ color: '#0284c7' }} />
                <h4>Temporal & Spatial Coverage</h4>
              </div>
              <div className="popup-grid" style={{ marginTop: '12px' }}>
                <div className="popup-item"><span>Temporal Span:</span> <strong>{report.temporal_spatial_distribution.temporal_span_days} Days</strong></div>
                <div className="popup-item"><span>Temporal Gaps:</span> <strong>{report.temporal_spatial_distribution.has_temporal_gaps ? 'Yes (Gaps in unconfigured feeds)' : 'No'}</strong></div>
                <div className="popup-item"><span>Spatial Overlap:</span> <strong>{report.temporal_spatial_distribution.spatial_overlap_status}</strong></div>
                <div className="popup-item"><span>Grid Density:</span> <strong>{report.temporal_spatial_distribution.grid_cell_density}</strong></div>
              </div>
              <p style={{ fontSize: '0.78rem', color: '#475569', marginTop: '12px' }}>
                <strong>Spatial Scope Notice:</strong> {report.temporal_spatial_distribution.spatial_representation}
              </p>
            </div>
          </div>

          {/* Fire Data & Target Defensibility Assessment */}
          <div className="ndvi-guardrail-banner" style={{ marginTop: '20px', backgroundColor: '#fef2f2', borderColor: '#fecaca' }}>
            <Flame className="guardrail-icon" style={{ color: '#dc2626' }} />
            <div>
              <strong style={{ color: '#991b1b' }}>Fire Data & Target Label Defensibility Assessment:</strong>
              <p style={{ color: '#7f1d1d', marginTop: '4px', fontSize: '0.85rem' }}>
                {report.target_defensibility_assessment}
              </p>
              <ul style={{ paddingLeft: '16px', margin: '8px 0 0 0', color: '#991b1b', fontSize: '0.78rem' }}>
                {report.fire_data_analysis.labeling_limitations.map((lim, i) => <li key={i}>• {lim}</li>)}
              </ul>
            </div>
          </div>

          {/* Feature Leakage Audit & Recommended Next Steps */}
          <div className="specifications-grid" style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="spec-card" style={{ backgroundColor: '#ffffff' }}>
              <div className="spec-card-header">
                <CheckCircle2 className="spec-icon green" />
                <h4>Feature Data Leakage Audit</h4>
              </div>
              <p style={{ fontSize: '0.8rem', color: '#334155' }}>
                <strong>Status:</strong> {report.feature_leakage_audit.has_leakage_risk ? 'LEAKAGE RISK DETECTED' : 'CLEAN (NO LEAKAGE)'}
              </p>
              <ul className="spec-list" style={{ marginTop: '8px' }}>
                {report.feature_leakage_audit.leakage_notes.map((note, i) => <li key={i}>✓ {note}</li>)}
              </ul>
            </div>

            <div className="spec-card" style={{ backgroundColor: '#ffffff' }}>
              <div className="spec-card-header">
                <ArrowRight className="spec-icon" style={{ color: '#0284c7' }} />
                <h4>Recommended Next Steps</h4>
              </div>
              <p style={{ fontSize: '0.8rem', color: '#334155', fontWeight: 600 }}>
                Biggest Remaining Blocker:
              </p>
              <p style={{ fontSize: '0.78rem', color: '#b45309' }}>
                {report.biggest_remaining_blocker}
              </p>
              <div style={{ marginTop: '8px', fontSize: '0.78rem', color: '#0369a1', backgroundColor: '#f0f9ff', padding: '8px', borderRadius: '4px' }}>
                <strong>Action:</strong> {report.recommended_next_step}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default DatasetAnalysisCard;
