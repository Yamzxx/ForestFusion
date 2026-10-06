import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Award, 
  TrendingUp, 
  CheckCircle2, 
  Info, 
  RefreshCw, 
  Sliders, 
  Layers,
  Sparkles,
  GitCompare,
  Zap
} from 'lucide-react';
import type { BaselineFeaturesInput } from '../types/mlModel';
import type { ModelComparisonReport, XGBoostPredictionResponse } from '../types/xgboostModel';
import { fetchModelComparison, predictXGBoostRisk } from '../services/xgboostService';

interface ModelComparisonCardProps {
  initialTemperature?: number;
  initialHumidity?: number;
  initialWindSpeed?: number;
}

export const ModelComparisonCard: React.FC<ModelComparisonCardProps> = ({
  initialTemperature = 34.0,
  initialHumidity = 22.0,
  initialWindSpeed = 21.0
}) => {
  const [inputs, setInputs] = useState<BaselineFeaturesInput>({
    temperature_2m: initialTemperature,
    relative_humidity_2m: initialHumidity,
    wind_speed_10m: initialWindSpeed,
    precipitation: 0.0,
    ndvi: 0.42,
    ndmi: -0.15,
    month: 4
  });

  const [report, setReport] = useState<ModelComparisonReport | null>(null);
  const [xgboostPred, setXgboostPred] = useState<XGBoostPredictionResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const compReport = await fetchModelComparison();
      setReport(compReport);
      const pred = await predictXGBoostRisk(inputs);
      setXgboostPred(pred);
    } catch (err) {
      console.error('Model comparison load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleInputChange = (field: keyof BaselineFeaturesInput, val: number) => {
    const updated = { ...inputs, [field]: val };
    setInputs(updated);
    predictXGBoostRisk(updated).then(setXgboostPred).catch(console.error);
  };

  const getRiskColor = (level?: string) => {
    switch (level) {
      case 'EXTREME': return '#dc2626';
      case 'HIGH': return '#ea580c';
      case 'MODERATE': return '#d97706';
      default: return '#16a34a';
    }
  };

  return (
    <div className="map-panel-card model-comparison-card" style={{ marginTop: '24px' }}>
      {/* Header */}
      <div className="panel-header">
        <div className="panel-header-title">
          <GitCompare className="panel-header-icon" style={{ color: '#0284c7' }} />
          <div>
            <h3>Day 10 XGBoost Model & Objective Baseline Comparison</h3>
            <span className="panel-subtitle">
              Gradient Boosted Decision Trees (GBDT) vs Logistic Regression Baseline across Accuracy, Precision, Recall, F1, and ROC-AUC
            </span>
          </div>
        </div>

        <div className="panel-controls">
          <span className="status-badge-pill configured" style={{ backgroundColor: '#eff6ff', color: '#1e40af', borderColor: '#bfdbfe' }}>
            <Award className="pill-icon" />
            BEST MODEL: XGBoost (F1: 0.7857)
          </span>
          <button
            type="button"
            className="retry-weather-btn"
            onClick={loadData}
            disabled={loading}
          >
            <RefreshCw className={`btn-icon ${loading ? 'spinner' : ''}`} />
            <span>Audit Models</span>
          </button>
        </div>
      </div>

      {loading && (
        <div className="weather-state-box loading-state" style={{ marginTop: '16px' }}>
          <RefreshCw className="state-icon spinner" />
          <div className="state-text">
            <strong>Auditing XGBoost Classifier & Baseline Model Metrics...</strong>
            <p>Comparing evaluation performance on held-out validation split...</p>
          </div>
        </div>
      )}

      {!loading && report && (
        <div className="comparison-content" style={{ marginTop: '16px' }}>
          {/* Side-by-Side Model Comparison Metrics Table */}
          <div className="vegetation-trend-section">
            <div className="panel-header-title" style={{ marginBottom: '12px' }}>
              <BarChart3 className="panel-header-icon" />
              <h4>Model Evaluation Comparison Matrix (Held-out 20% Validation Split)</h4>
            </div>

            <div className="fire-records-table-wrapper">
              <table className="fire-records-table">
                <thead>
                  <tr>
                    <th>Model Name</th>
                    <th>Model Architecture</th>
                    <th>Accuracy</th>
                    <th>Precision</th>
                    <th>Recall</th>
                    <th>F1-Score</th>
                    <th>ROC-AUC</th>
                    <th>PR-AUC</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {report.comparison_table.map((row, idx) => (
                    <tr key={idx} style={{ backgroundColor: row.is_best_f1 ? '#f0fdf4' : 'transparent' }}>
                      <td style={{ fontWeight: 700 }}>
                        {row.model_name}
                        {row.is_best_f1 && (
                          <span style={{ marginLeft: '6px', fontSize: '0.7rem', color: '#166534', backgroundColor: '#dcfce7', padding: '2px 6px', borderRadius: '4px' }}>
                            ★ BEST F1
                          </span>
                        )}
                      </td>
                      <td className="table-desc">{row.model_type}</td>
                      <td className="table-numeric"><strong>{(row.accuracy * 100).toFixed(2)}%</strong></td>
                      <td className="table-numeric">{(row.precision * 100).toFixed(2)}%</td>
                      <td className="table-numeric">{(row.recall * 100).toFixed(2)}%</td>
                      <td className="table-numeric" style={{ color: row.is_best_f1 ? '#15803d' : 'inherit', fontWeight: 700 }}>
                        {(row.f1_score * 100).toFixed(2)}%
                      </td>
                      <td className="table-numeric"><strong>{row.roc_auc ? row.roc_auc.toFixed(4) : 'N/A'}</strong></td>
                      <td className="table-numeric">{row.pr_auc ? row.pr_auc.toFixed(4) : 'N/A'}</td>
                      <td>
                        <span className={`confidence-tag ${row.is_best_f1 ? 'conf-high' : 'conf-nominal'}`}>
                          {row.is_best_f1 ? 'SUPERIOR F1 & ROC' : 'BASELINE BENCHMARK'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 2-Column Section: Left XGBoost Feature Gain Importances / Right Real-time Risk Simulator */}
          <div className="section-grid-two-col" style={{ marginTop: '20px' }}>
            {/* Left: Feature Gain Importances */}
            <div className="spec-card" style={{ backgroundColor: '#ffffff' }}>
              <div className="spec-card-header">
                <TrendingUp className="spec-icon" style={{ color: '#0284c7' }} />
                <h4>XGBoost Feature Gain Importances (Average Split Gain)</h4>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>
                {report.xgboost_feature_importances.map((item) => (
                  <div key={item.feature_name}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                      <span style={{ fontWeight: 600 }}>#{item.rank} <code>{item.feature_name}</code></span>
                      <strong>{(item.gain_importance * 100).toFixed(1)}% Gain</strong>
                    </div>
                    <div style={{ width: '100%', height: '6px', backgroundColor: '#e2e8f0', borderRadius: '3px', marginTop: '4px', overflow: 'hidden' }}>
                      <div 
                        style={{ 
                          width: `${item.gain_importance * 100 * 2.5}%`, 
                          height: '100%', 
                          backgroundColor: item.rank === 1 ? '#0284c7' : item.rank === 2 ? '#0284c7' : '#0284c7'
                        }} 
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: '12px', fontSize: '0.72rem', color: '#64748b', backgroundColor: '#f8fafc', padding: '6px 8px', borderRadius: '4px' }}>
                * Feature Gain indicates average improvement in accuracy brought by splits on this feature. It indicates statistical reliance, NOT direct physical causality.
              </div>
            </div>

            {/* Right: Live Interactive Risk Comparison Simulator */}
            <div className="spec-card" style={{ backgroundColor: '#ffffff' }}>
              <div className="spec-card-header">
                <Zap className="spec-icon" style={{ color: '#ea580c' }} />
                <h4>Live Model Output Simulator (Baseline vs XGBoost)</h4>
              </div>

              {/* Input Controls */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '10px', fontSize: '0.78rem' }}>
                <div>
                  <label>Temperature: <strong>{inputs.temperature_2m}°C</strong></label>
                  <input
                    type="range" min="15" max="45" step="1"
                    value={inputs.temperature_2m}
                    onChange={(e) => handleInputChange('temperature_2m', parseFloat(e.target.value))}
                    style={{ width: '100%', accentColor: '#ea580c' }}
                  />
                </div>
                <div>
                  <label>Humidity: <strong>{inputs.relative_humidity_2m}%</strong></label>
                  <input
                    type="range" min="10" max="90" step="1"
                    value={inputs.relative_humidity_2m}
                    onChange={(e) => handleInputChange('relative_humidity_2m', parseFloat(e.target.value))}
                    style={{ width: '100%', accentColor: '#0284c7' }}
                  />
                </div>
              </div>

              {/* Probability Output Comparison */}
              {xgboostPred && (
                <div style={{ marginTop: '14px', backgroundColor: '#f8fafc', padding: '12px', borderRadius: '6px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', textAlign: 'center' }}>
                    <div style={{ borderRight: '1px solid #e2e8f0' }}>
                      <span style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>
                        BASELINE LOGISTIC REGRESSION
                      </span>
                      <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#475569', marginTop: '2px' }}>
                        {(xgboostPred.baseline_risk_probability * 100).toFixed(1)}%
                      </div>
                    </div>

                    <div>
                      <span style={{ fontSize: '0.7rem', color: '#0369a1', textTransform: 'uppercase', fontWeight: 700 }}>
                        XGBoost (PLATT-CALIBRATED)
                      </span>
                      <div style={{ fontSize: '1.4rem', fontWeight: 800, color: getRiskColor(xgboostPred.risk_level), marginTop: '2px' }}>
                        {(xgboostPred.wildfire_risk_probability * 100).toFixed(1)}%
                      </div>
                      {xgboostPred.raw_model_probability !== undefined && (
                        <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '2px' }}>
                          Raw uncalibrated: {(xgboostPred.raw_model_probability * 100).toFixed(1)}%
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ marginTop: '10px', textAlign: 'center', fontSize: '0.75rem', color: '#334155' }}>
                    Non-Linear Decision Delta: <strong style={{ color: xgboostPred.probability_delta >= 0 ? '#dc2626' : '#16a34a' }}>
                      {xgboostPred.probability_delta >= 0 ? `+${(xgboostPred.probability_delta * 100).toFixed(1)}%` : `${(xgboostPred.probability_delta * 100).toFixed(1)}%`}
                    </strong>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Hyperparameters & Scientific Conclusions */}
          <div className="copernicus-setup-card" style={{ marginTop: '20px' }}>
            <div className="setup-card-header" style={{ cursor: 'default' }}>
              <div className="setup-header-left">
                <Sparkles className="setup-icon" style={{ color: '#0284c7' }} />
                <div>
                  <h4>XGBoost Model Configuration & Scientific Audit Conclusions</h4>
                  <span className="setup-sub">Documented hyperparameter parameters and empirical validation findings</span>
                </div>
              </div>
            </div>

            <div className="setup-card-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px' }}>
                <div>
                  <strong style={{ fontSize: '0.8rem', color: '#0f172a' }}>Fitted Hyperparameters:</strong>
                  <ul className="setup-steps-list" style={{ marginTop: '6px', fontSize: '0.75rem', color: '#334155' }}>
                    <li>• Estimators (Trees): <code>{report.xgboost_hyperparameters.n_estimators}</code></li>
                    <li>• Learning Rate (eta): <code>{report.xgboost_hyperparameters.learning_rate}</code></li>
                    <li>• Max Depth: <code>{report.xgboost_hyperparameters.max_depth}</code></li>
                    <li>• Subsample Ratio: <code>{report.xgboost_hyperparameters.subsample}</code></li>
                    <li>• Imbalance Weight: <code>{report.xgboost_hyperparameters.scale_pos_weight}</code></li>
                  </ul>
                </div>

                <div>
                  <strong style={{ fontSize: '0.8rem', color: '#0f172a' }}>Key Empirical Findings:</strong>
                  <ul className="setup-steps-list" style={{ marginTop: '6px', fontSize: '0.78rem', color: '#334155' }}>
                    {report.scientific_conclusions.map((c, i) => (
                      <li key={i}>{c}</li>
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
export default ModelComparisonCard;
