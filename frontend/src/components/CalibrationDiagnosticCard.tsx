import React, { useState, useEffect } from 'react';
import { 
  Scale, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight, 
  Sparkles,
  Activity
} from 'lucide-react';
import type { ModelValidationCalibrationReport, CalibrateProbabilityResponse, CalibrationBinItem } from '../types/calibration';
import { fetchCalibrationReport, calibrateProbability } from '../services/calibrationService';

export const CalibrationDiagnosticCard: React.FC = () => {
  const [report, setReport] = useState<ModelValidationCalibrationReport | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Interactive probability calibration simulator state
  const [simRawProb, setSimRawProb] = useState<number>(0.65);
  const [simResult, setSimResult] = useState<CalibrateProbabilityResponse | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);

    fetchCalibrationReport()
      .then((data: ModelValidationCalibrationReport) => {
        if (active) {
          setReport(data);
          setError(null);
        }
      })
      .catch((err: any) => {
        if (active) {
          setError(err.message || 'Failed to load calibration report');
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    calibrateProbability(simRawProb)
      .then((res: CalibrateProbabilityResponse) => {
        if (active) {
          setSimResult(res);
        }
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, [simRawProb]);

  if (loading) {
    return (
      <div className="card" style={{ padding: '24px', backgroundColor: '#FFFFFF', border: '1px solid #D5DDD8', borderRadius: '4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#17452F' }}>
          <Activity className="animate-spin" size={18} />
          <span>Loading Platt Probability Calibration diagnostics...</span>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="card" style={{ padding: '24px', backgroundColor: '#FFFFFF', border: '1px solid #FECACA', borderRadius: '4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#B91C1C' }}>
          <AlertTriangle size={18} />
          <span>Error loading calibration report: {error || 'No data available'}</span>
        </div>
      </div>
    );
  }

  const { calibration_analysis, leakage_audit } = report;
  const metrics = calibration_analysis.metrics;

  return (
    <div className="card" style={{ padding: '24px', backgroundColor: '#FFFFFF', borderRadius: '4px', border: '1px solid #D5DDD8', boxShadow: 'var(--shadow-sm)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #E2E8F0', paddingBottom: '16px', marginBottom: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Scale size={20} style={{ color: '#17452F' }} />
            <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#17452F', fontWeight: 700 }}>
              Model Validation & Probability Calibration (Platt Scaling)
            </h3>
            <span style={{ fontSize: '0.70rem', backgroundColor: '#EBF3EF', color: '#17452F', padding: '2px 8px', borderRadius: '4px', fontWeight: 700, border: '1px solid #C2DBCD' }}>
              PLATT SIGMOID ACTIVE
            </span>
          </div>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.82rem', color: '#55635C' }}>
            Forward-chaining temporal validation audit, leak-free preprocessing, reliability curve diagnostics, and Brier score calibration.
          </p>
        </div>
      </div>

      {/* Top KPI Metrics Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '24px' }}>
        <div style={{ padding: '14px', backgroundColor: '#F8FAF9', borderRadius: '4px', border: '1px solid #E2E8F0', borderLeft: '3px solid #17452F' }}>
          <div style={{ fontSize: '0.72rem', color: '#55635C', fontWeight: 600, textTransform: 'uppercase' }}>Validation Strategy</div>
          <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#17452F', marginTop: '4px' }}>Temporal Split</div>
          <div style={{ fontSize: '0.72rem', color: '#26734B', marginTop: '2px' }}>
            Train 80% (160) / Val 20% (40)
          </div>
        </div>

        <div style={{ padding: '14px', backgroundColor: '#F8FAF9', borderRadius: '4px', border: '1px solid #E2E8F0', borderLeft: '3px solid #17452F' }}>
          <div style={{ fontSize: '0.72rem', color: '#55635C', fontWeight: 600, textTransform: 'uppercase' }}>Brier Score Improvement</div>
          <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#17452F', marginTop: '4px', fontFamily: 'monospace' }}>
            {metrics.brier_score_raw.toFixed(4)} → {metrics.brier_score_calibrated.toFixed(4)}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#17452F', marginTop: '2px', fontWeight: 700 }}>
            -{metrics.brier_score_improvement_pct.toFixed(1)}% Error Reduction
          </div>
        </div>

        <div style={{ padding: '14px', backgroundColor: '#F8FAF9', borderRadius: '4px', border: '1px solid #E2E8F0', borderLeft: '3px solid #17452F' }}>
          <div style={{ fontSize: '0.72rem', color: '#55635C', fontWeight: 600, textTransform: 'uppercase' }}>Expected Calibration Error (ECE)</div>
          <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#17452F', marginTop: '4px', fontFamily: 'monospace' }}>
            {(metrics.ece_raw * 100).toFixed(1)}% → {(metrics.ece_calibrated * 100).toFixed(1)}%
          </div>
          <div style={{ fontSize: '0.72rem', color: '#17452F', marginTop: '2px', fontWeight: 700 }}>
            -{metrics.ece_improvement_pct.toFixed(1)}% Calibration Error
          </div>
        </div>

        <div style={{ padding: '14px', backgroundColor: '#F8FAF9', borderRadius: '4px', border: '1px solid #E2E8F0', borderLeft: '3px solid #55635C' }}>
          <div style={{ fontSize: '0.72rem', color: '#55635C', fontWeight: 600, textTransform: 'uppercase' }}>Calibration Method</div>
          <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#252B28', marginTop: '4px' }}>Platt Sigmoid</div>
          <div style={{ fontSize: '0.72rem', color: '#55635C', marginTop: '2px', fontFamily: 'monospace' }}>
            A = {calibration_analysis.fitted_parameters.slope_A.toFixed(3)}, B = {calibration_analysis.fitted_parameters.intercept_B.toFixed(3)}
          </div>
        </div>
      </div>

      {/* Validation Split & Leakage Audit Section */}
      <div style={{ marginBottom: '24px', padding: '16px', backgroundColor: '#F8FAF9', border: '1px solid #E2E8F0', borderRadius: '4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
          <ShieldCheck size={18} style={{ color: '#17452F' }} />
          <h4 style={{ margin: 0, fontSize: '0.90rem', color: '#17452F', fontWeight: 700 }}>
            Train/Validation Split Leakage Audit
          </h4>
        </div>
        <p style={{ margin: '0 0 12px 0', fontSize: '0.78rem', color: '#55635C', lineHeight: 1.4 }}>
          {leakage_audit.strategy_description}
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '10px' }}>
          {leakage_audit.audit_notes.map((note: string, idx: number) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '0.78rem', color: '#252B28', backgroundColor: '#FFFFFF', padding: '10px', borderRadius: '4px', border: '1px solid #D5DDD8' }}>
              <CheckCircle2 size={15} style={{ color: '#17452F', flexShrink: 0, marginTop: '2px' }} />
              <span>{note}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Reliability Curve / Calibration Table */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <h4 style={{ margin: 0, fontSize: '0.90rem', color: '#17452F', fontWeight: 700 }}>
            Reliability Curve (Binned Probability vs Observed Frequency)
          </h4>
          <span style={{ fontSize: '0.72rem', color: '#55635C' }}>
            N=40 Held-out Temporal Validation Samples
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="scientific-data-table">
            <thead>
              <tr>
                <th>Bin Range</th>
                <th>Samples (N)</th>
                <th>Mean Raw Prob (Uncalibrated)</th>
                <th>Mean Calibrated Prob (Platt)</th>
                <th>Observed Positive Rate</th>
                <th>Calibration Effect</th>
              </tr>
            </thead>
            <tbody>
              {calibration_analysis.calibration_bins.map((bin: CalibrationBinItem) => {
                const rawGap = Math.abs(bin.mean_predicted_prob_raw - bin.observed_positive_rate);
                const calGap = Math.abs(bin.mean_predicted_prob_calibrated - bin.observed_positive_rate);
                const isImproved = calGap <= rawGap;

                return (
                  <tr key={bin.bin_index}>
                    <td style={{ fontWeight: 600 }}>{bin.bin_range}</td>
                    <td>{bin.sample_count}</td>
                    <td style={{ color: '#B91C1C', fontWeight: 600 }}>
                      {(bin.mean_predicted_prob_raw * 100).toFixed(1)}%
                    </td>
                    <td style={{ color: '#17452F', fontWeight: 700 }}>
                      {(bin.mean_predicted_prob_calibrated * 100).toFixed(1)}%
                    </td>
                    <td style={{ fontWeight: 700 }}>
                      {(bin.observed_positive_rate * 100).toFixed(1)}%
                    </td>
                    <td>
                      <span style={{ 
                        fontSize: '0.70rem', 
                        padding: '2px 8px', 
                        borderRadius: '3px',
                        backgroundColor: isImproved ? '#EBF3EF' : '#FEF3C7',
                        color: isImproved ? '#17452F' : '#92400E',
                        fontWeight: 700,
                        border: `1px solid ${isImproved ? '#C2DBCD' : '#FDE68A'}`
                      }}>
                        {isImproved ? `Aligned (gap ${(rawGap * 100).toFixed(1)}% → ${(calGap * 100).toFixed(1)}%)` : 'Consistent'}
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
      <div style={{ marginBottom: '24px', padding: '16px', backgroundColor: '#F8FAF9', borderRadius: '4px', border: '1px solid #D5DDD8', borderLeft: '4px solid #17452F' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
          <Sparkles size={16} style={{ color: '#17452F' }} />
          <h4 style={{ margin: 0, fontSize: '0.90rem', color: '#17452F', fontWeight: 700 }}>
            Live Probability Calibration Simulator
          </h4>
        </div>
        <p style={{ margin: '0 0 14px 0', fontSize: '0.78rem', color: '#55635C' }}>
          Adjust the slider to evaluate how uncalibrated XGBoost decision margins are transformed into empirical Platt-calibrated probabilities.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.80rem', fontWeight: 600, color: '#252B28', marginBottom: '4px' }}>
              <span>Raw Model Probability (Uncalibrated):</span>
              <strong style={{ color: '#B91C1C' }}>{(simRawProb * 100).toFixed(1)}%</strong>
            </div>
            <input
              type="range"
              min="0.01"
              max="0.99"
              step="0.01"
              value={simRawProb}
              onChange={(e) => setSimRawProb(parseFloat(e.target.value))}
              style={{ width: '100%', cursor: 'pointer', accentColor: '#17452F' }}
            />
          </div>

          {simResult && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFFFFF', padding: '12px 16px', borderRadius: '4px', border: '1px solid #D5DDD8' }}>
              <div>
                <div style={{ fontSize: '0.72rem', color: '#55635C' }}>Raw Probability</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#B91C1C', fontFamily: 'monospace' }}>
                  {(simResult.raw_probability * 100).toFixed(1)}%
                </div>
              </div>

              <ArrowRight size={18} style={{ color: '#55635C' }} />

              <div>
                <div style={{ fontSize: '0.72rem', color: '#17452F', fontWeight: 600 }}>Calibrated Probability</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#17452F', fontFamily: 'monospace' }}>
                  {(simResult.calibrated_probability * 100).toFixed(1)}%
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.72rem', color: '#55635C' }}>Delta Adjustment</div>
                <div style={{ 
                  fontSize: '0.90rem', 
                  fontWeight: 700, 
                  fontFamily: 'monospace',
                  color: simResult.calibrated_probability <= simResult.raw_probability ? '#0284C7' : '#C25E00' 
                }}>
                  {((simResult.calibrated_probability - simResult.raw_probability) * 100).toFixed(1)}%
                </div>
              </div>
            </div>
          )}

          {simResult && (
            <div style={{ fontSize: '0.74rem', color: '#17452F', fontStyle: 'italic' }}>
              ℹ️ {simResult.interpretation}
            </div>
          )}
        </div>
      </div>

      {/* Scientific Conclusions & Limitations Disclaimer */}
      <div style={{ padding: '14px', backgroundColor: '#FFFBEB', borderRadius: '4px', border: '1px solid #FDE68A' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#92400E', fontWeight: 700, fontSize: '0.82rem', marginBottom: '6px' }}>
          <AlertTriangle size={15} />
          <span>Scientific Calibration Limitations & Guardrails</span>
        </div>
        <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.76rem', color: '#92400E', lineHeight: 1.4 }}>
          {report.scientific_conclusions.map((conc: string, idx: number) => (
            <li key={idx} style={{ marginBottom: '4px' }}>{conc}</li>
          ))}
        </ul>
        <div style={{ marginTop: '8px', fontSize: '0.70rem', color: '#78350F', borderTop: '1px solid #FDE68A', paddingTop: '6px' }}>
          <em>{report.disclaimer}</em>
        </div>
      </div>
    </div>
  );
};

export default CalibrationDiagnosticCard;
