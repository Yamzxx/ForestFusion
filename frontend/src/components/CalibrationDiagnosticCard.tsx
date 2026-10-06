import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  Scale, 
  HelpCircle, 
  RotateCcw,
  Sparkles,
  Layers,
  ArrowRight
} from 'lucide-react';
import type { ModelValidationCalibrationReport, CalibrateProbabilityResponse } from '../types/calibration';
import { fetchCalibrationReport, calibrateProbability } from '../services/calibrationService';

export const CalibrationDiagnosticCard: React.FC = () => {
  const [report, setReport] = useState<ModelValidationCalibrationReport | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Interactive slider state for probability calibration testing
  const [simRawProb, setSimRawProb] = useState<number>(0.868);
  const [simResult, setSimResult] = useState<CalibrateProbabilityResponse | null>(null);
  const [simLoading, setSimLoading] = useState<boolean>(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchCalibrationReport()
      .then((data) => {
        if (active) {
          setReport(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (active) {
          setError(err.message || 'Failed to fetch calibration report');
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  // Update simulator when simRawProb changes
  useEffect(() => {
    let active = true;
    setSimLoading(true);
    calibrateProbability(simRawProb)
      .then((res) => {
        if (active) {
          setSimResult(res);
          setSimLoading(false);
        }
      })
      .catch(() => {
        if (active) {
          setSimLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [simRawProb]);

  if (loading) {
    return (
      <div className="card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#166534' }}>
          <Activity className="animate-spin" size={20} />
          <strong>Loading Model Validation and Probability Calibration diagnostics...</strong>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#dc2626' }}>
          <AlertTriangle size={20} />
          <span>Error loading calibration report: {error || 'No data available'}</span>
        </div>
      </div>
    );
  }

  const { calibration_analysis, leakage_audit, baseline_evaluation, xgboost_evaluation } = report;
  const metrics = calibration_analysis.metrics;

  return (
    <div className="card" style={{ padding: '24px', backgroundColor: '#ffffff', borderRadius: '12px', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px', marginBottom: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Scale size={22} style={{ color: '#059669' }} />
            <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#0f172a', fontWeight: 700 }}>
              Day 12: Model Validation & Probability Calibration
            </h3>
            <span style={{ fontSize: '0.72rem', backgroundColor: '#dcfce7', color: '#166534', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>
              PLATT SCALING ACTIVE
            </span>
          </div>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>
            Forward-chaining temporal validation audit, leak-free preprocessing, reliability curve diagnostics, and Brier score calibration.
          </p>
        </div>
      </div>

      {/* Top KPI Metrics Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '24px' }}>
        <div style={{ padding: '14px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Validation Strategy</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginTop: '4px' }}>Temporal Split</div>
          <div style={{ fontSize: '0.74rem', color: '#059669', marginTop: '2px' }}>
            Train 80% (160) / Val 20% (40)
          </div>
        </div>

        <div style={{ padding: '14px', backgroundColor: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
          <div style={{ fontSize: '0.74rem', color: '#166534', fontWeight: 600, textTransform: 'uppercase' }}>Brier Score Improvement</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#166534', marginTop: '4px' }}>
            {metrics.brier_score_raw.toFixed(4)} → {metrics.brier_score_calibrated.toFixed(4)}
          </div>
          <div style={{ fontSize: '0.74rem', color: '#15803d', marginTop: '2px', fontWeight: 600 }}>
            📉 -{metrics.brier_score_improvement_pct.toFixed(1)}% Error Reduction
          </div>
        </div>

        <div style={{ padding: '14px', backgroundColor: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
          <div style={{ fontSize: '0.74rem', color: '#166534', fontWeight: 600, textTransform: 'uppercase' }}>Expected Calibration Error (ECE)</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#166534', marginTop: '4px' }}>
            {(metrics.ece_raw * 100).toFixed(1)}% → {(metrics.ece_calibrated * 100).toFixed(1)}%
          </div>
          <div style={{ fontSize: '0.74rem', color: '#15803d', marginTop: '2px', fontWeight: 600 }}>
            📉 -{metrics.ece_improvement_pct.toFixed(1)}% Calibration Error
          </div>
        </div>

        <div style={{ padding: '14px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Calibration Method</div>
          <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', marginTop: '4px' }}>Platt Sigmoid</div>
          <div style={{ fontSize: '0.74rem', color: '#475569', marginTop: '2px' }}>
            A = {calibration_analysis.fitted_parameters.slope_A.toFixed(3)}, B = {calibration_analysis.fitted_parameters.intercept_B.toFixed(3)}
          </div>
        </div>
      </div>

      {/* Validation Split & Leakage Audit Section */}
      <div style={{ marginBottom: '24px', padding: '16px', backgroundColor: '#fbfcfd', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
          <ShieldCheck size={18} style={{ color: '#059669' }} />
          <h4 style={{ margin: 0, fontSize: '0.95rem', color: '#0f172a', fontWeight: 700 }}>
            Train/Validation Split Leakage Audit
          </h4>
        </div>
        <p style={{ margin: '0 0 12px 0', fontSize: '0.8rem', color: '#475569', lineHeight: 1.4 }}>
          {leakage_audit.strategy_description}
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '10px' }}>
          {leakage_audit.audit_notes.map((note, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '0.78rem', color: '#334155', backgroundColor: '#ffffff', padding: '10px', borderRadius: '6px', border: '1px solid #f1f5f9' }}>
              <CheckCircle2 size={16} style={{ color: '#16a34a', flexShrink: 0, marginTop: '2px' }} />
              <span>{note}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Reliability Curve / Calibration Table */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <h4 style={{ margin: 0, fontSize: '0.95rem', color: '#0f172a', fontWeight: 700 }}>
            Reliability Curve (Binned Probability vs Observed Positive Frequency)
          </h4>
          <span style={{ fontSize: '0.74rem', color: '#64748b' }}>
            Evaluated on N=40 Held-out Temporal Validation Samples
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#f1f5f9', color: '#475569', textAlign: 'left' }}>
                <th style={{ padding: '8px 12px' }}>Bin Range</th>
                <th style={{ padding: '8px 12px' }}>Samples (N)</th>
                <th style={{ padding: '8px 12px' }}>Mean Raw Prob (Uncalibrated)</th>
                <th style={{ padding: '8px 12px' }}>Mean Calibrated Prob (Platt)</th>
                <th style={{ padding: '8px 12px' }}>Observed Positive Rate</th>
                <th style={{ padding: '8px 12px' }}>Calibration Effect</th>
              </tr>
            </thead>
            <tbody>
              {calibration_analysis.calibration_bins.map((bin) => {
                const rawGap = Math.abs(bin.mean_predicted_prob_raw - bin.observed_positive_rate);
                const calGap = Math.abs(bin.mean_predicted_prob_calibrated - bin.observed_positive_rate);
                const isImproved = calGap <= rawGap;

                return (
                  <tr key={bin.bin_index} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 600, color: '#0f172a' }}>{bin.bin_range}</td>
                    <td style={{ padding: '10px 12px', color: '#475569' }}>{bin.sample_count}</td>
                    <td style={{ padding: '10px 12px', color: '#b91c1c', fontWeight: 600 }}>
                      {(bin.mean_predicted_prob_raw * 100).toFixed(1)}%
                    </td>
                    <td style={{ padding: '10px 12px', color: '#047857', fontWeight: 600 }}>
                      {(bin.mean_predicted_prob_calibrated * 100).toFixed(1)}%
                    </td>
                    <td style={{ padding: '10px 12px', color: '#0f172a', fontWeight: 700 }}>
                      {(bin.observed_positive_rate * 100).toFixed(1)}%
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{ 
                        fontSize: '0.72rem', 
                        padding: '2px 8px', 
                        borderRadius: '4px',
                        backgroundColor: isImproved ? '#ecfdf5' : '#fef2f2',
                        color: isImproved ? '#065f46' : '#991b1b',
                        fontWeight: 600
                      }}>
                        {isImproved ? `Aligned (error gap ${(rawGap * 100).toFixed(1)}% → ${(calGap * 100).toFixed(1)}%)` : 'Consistent'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Interactive Probability Calibration Simulator */}
      <div style={{ marginBottom: '24px', padding: '16px', backgroundColor: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
          <Sparkles size={16} style={{ color: '#059669' }} />
          <h4 style={{ margin: 0, fontSize: '0.95rem', color: '#166534', fontWeight: 700 }}>
            Live Probability Calibration Simulator
          </h4>
        </div>
        <p style={{ margin: '0 0 14px 0', fontSize: '0.8rem', color: '#166534' }}>
          Drag the slider to test how uncalibrated XGBoost decision outputs are transformed into empirical Platt-calibrated probabilities.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: 600, color: '#1e293b', marginBottom: '4px' }}>
              <span>Raw Model Probability (Uncalibrated):</span>
              <strong style={{ color: '#b91c1c' }}>{(simRawProb * 100).toFixed(1)}%</strong>
            </div>
            <input
              type="range"
              min="0.01"
              max="0.99"
              step="0.01"
              value={simRawProb}
              onChange={(e) => setSimRawProb(parseFloat(e.target.value))}
              style={{ width: '100%', cursor: 'pointer' }}
            />
          </div>

          {simResult && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#ffffff', padding: '12px 16px', borderRadius: '6px', border: '1px solid #dcfce7' }}>
              <div>
                <div style={{ fontSize: '0.74rem', color: '#64748b' }}>Raw Model Probability</div>
                <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#b91c1c' }}>
                  {(simResult.raw_probability * 100).toFixed(1)}%
                </div>
              </div>

              <ArrowRight size={20} style={{ color: '#94a3b8' }} />

              <div>
                <div style={{ fontSize: '0.74rem', color: '#047857', fontWeight: 600 }}>Calibrated Probability (Platt)</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#047857' }}>
                  {(simResult.calibrated_probability * 100).toFixed(1)}%
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.74rem', color: '#64748b' }}>Delta Adjustment</div>
                <div style={{ 
                  fontSize: '0.95rem', 
                  fontWeight: 700, 
                  color: simResult.calibrated_probability <= simResult.raw_probability ? '#2563eb' : '#d97706' 
                }}>
                  {((simResult.calibrated_probability - simResult.raw_probability) * 100).toFixed(1)}%
                </div>
              </div>
            </div>
          )}

          {simResult && (
            <div style={{ fontSize: '0.76rem', color: '#15803d', fontStyle: 'italic' }}>
              ℹ️ {simResult.interpretation}
            </div>
          )}
        </div>
      </div>

      {/* Scientific Conclusions & Limitations Disclaimer */}
      <div style={{ padding: '14px', backgroundColor: '#fffbeb', borderRadius: '8px', border: '1px solid #fef3c7' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#b45309', fontWeight: 700, fontSize: '0.85rem', marginBottom: '6px' }}>
          <AlertTriangle size={16} />
          <span>Scientific Calibration Limitations & Guardrails</span>
        </div>
        <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.78rem', color: '#92400e', lineHeight: 1.4 }}>
          {report.scientific_conclusions.map((conc, idx) => (
            <li key={idx} style={{ marginBottom: '4px' }}>{conc}</li>
          ))}
        </ul>
        <div style={{ marginTop: '8px', fontSize: '0.72rem', color: '#78350f', borderTop: '1px solid #fde68a', paddingTop: '6px' }}>
          <em>{report.disclaimer}</em>
        </div>
      </div>
    </div>
  );
};
