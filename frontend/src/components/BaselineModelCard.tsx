import React, { useState, useEffect } from 'react';
import { 
  Cpu, 
  ShieldAlert, 
  Activity, 
  HelpCircle, 
  RefreshCw, 
  Info, 
  BarChart2, 
  Sliders, 
  ArrowUpRight, 
  ArrowDownRight,
  Sparkles
} from 'lucide-react';
import type { 
  BaselineFeaturesInput, 
  BaselinePredictionResponse, 
  BaselineModelEvaluationReport 
} from '../types/mlModel';
import { predictBaselineRisk, fetchBaselineEvaluation } from '../services/mlService';

interface BaselineModelCardProps {
  initialTemperature?: number;
  initialHumidity?: number;
  initialWindSpeed?: number;
}

export const BaselineModelCard: React.FC<BaselineModelCardProps> = ({
  initialTemperature = 32.0,
  initialHumidity = 25.0,
  initialWindSpeed = 18.0
}) => {
  const [inputs, setInputs] = useState<BaselineFeaturesInput>({
    temperature_2m: initialTemperature,
    relative_humidity_2m: initialHumidity,
    wind_speed_10m: initialWindSpeed,
    precipitation: 0.0,
    ndvi: 0.45,
    ndmi: -0.05,
    month: 4
  });

  const [prediction, setPrediction] = useState<BaselinePredictionResponse | null>(null);
  const [evaluation, setEvaluation] = useState<BaselineModelEvaluationReport | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const runInference = async (params: BaselineFeaturesInput) => {
    setLoading(true);
    try {
      const predRes = await predictBaselineRisk(params);
      setPrediction(predRes);
    } catch (err) {
      console.error('Inference error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runInference(inputs);
    fetchBaselineEvaluation().then(setEvaluation).catch(console.error);
  }, []);

  const handleInputChange = (field: keyof BaselineFeaturesInput, val: number) => {
    const updated = { ...inputs, [field]: val };
    setInputs(updated);
    runInference(updated);
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
    <div className="map-panel-card baseline-model-card" style={{ marginTop: '24px' }}>
      {/* Header */}
      <div className="panel-header">
        <div className="panel-header-title">
          <Cpu className="panel-header-icon" style={{ color: '#16a34a' }} />
          <div>
            <h3>Day 9 Baseline Machine Learning Model (Logistic Regression)</h3>
            <span className="panel-subtitle">
              First interpretable linear binary baseline model evaluating wildfire risk probabilities & feature log-odds
            </span>
          </div>
        </div>

        <div className="panel-controls">
          <span className="status-badge-pill configured" style={{ backgroundColor: '#f0fdf4', color: '#166534', borderColor: '#bbf7d0' }}>
            <Sparkles className="pill-icon" />
            BASELINE MODEL STAGE 9
          </span>
          <button
            type="button"
            className="retry-weather-btn"
            onClick={() => runInference(inputs)}
            disabled={loading}
          >
            <RefreshCw className={`btn-icon ${loading ? 'spinner' : ''}`} />
            <span>Re-compute Probability</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Left Interactive Sliders / Right Model Output */}
      <div className="section-grid-two-col" style={{ marginTop: '16px' }}>
        {/* Left Column: Input Sliders & Parameter Controls */}
        <div className="spec-card" style={{ backgroundColor: '#ffffff' }}>
          <div className="spec-card-header">
            <Sliders className="spec-icon" style={{ color: '#0284c7' }} />
            <h4>Environmental Feature Inputs (Baseline Inference)</h4>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
            {/* Air Temperature Slider */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600 }}>
                <span>Air Temperature (2m):</span>
                <span>{inputs.temperature_2m.toFixed(1)} °C</span>
              </div>
              <input
                type="range"
                min="10"
                max="48"
                step="0.5"
                value={inputs.temperature_2m}
                onChange={(e) => handleInputChange('temperature_2m', parseFloat(e.target.value))}
                style={{ width: '100%', accentColor: '#ea580c' }}
              />
            </div>

            {/* Relative Humidity Slider */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600 }}>
                <span>Relative Humidity (2m):</span>
                <span>{inputs.relative_humidity_2m.toFixed(0)} %</span>
              </div>
              <input
                type="range"
                min="5"
                max="95"
                step="1"
                value={inputs.relative_humidity_2m}
                onChange={(e) => handleInputChange('relative_humidity_2m', parseFloat(e.target.value))}
                style={{ width: '100%', accentColor: '#0284c7' }}
              />
            </div>

            {/* Wind Speed Slider */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600 }}>
                <span>Wind Speed (10m):</span>
                <span>{inputs.wind_speed_10m.toFixed(1)} km/h</span>
              </div>
              <input
                type="range"
                min="0"
                max="60"
                step="1"
                value={inputs.wind_speed_10m}
                onChange={(e) => handleInputChange('wind_speed_10m', parseFloat(e.target.value))}
                style={{ width: '100%', accentColor: '#16a34a' }}
              />
            </div>

            {/* Vegetation Index (NDVI) Slider */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600 }}>
                <span>Vegetation Vigor (NDVI):</span>
                <span>{inputs.ndvi.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.10"
                max="0.90"
                step="0.02"
                value={inputs.ndvi}
                onChange={(e) => handleInputChange('ndvi', parseFloat(e.target.value))}
                style={{ width: '100%', accentColor: '#15803d' }}
              />
            </div>
          </div>
        </div>

        {/* Right Column: Prediction & Log-Odds Risk Output */}
        <div className="spec-card" style={{ backgroundColor: '#ffffff' }}>
          <div className="spec-card-header">
            <Activity className="spec-icon" style={{ color: getRiskColor(prediction?.risk_level) }} />
            <h4>Baseline Risk Probability & Output</h4>
          </div>

          {prediction && (
            <div style={{ marginTop: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>
                    WILDFIRE RISK PROBABILITY P(Y=1|X)
                  </span>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: getRiskColor(prediction.risk_level) }}>
                    {(prediction.wildfire_risk_probability * 100).toFixed(1)}%
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className="status-badge-pill" style={{ backgroundColor: '#f8fafc', color: getRiskColor(prediction.risk_level), borderColor: getRiskColor(prediction.risk_level) }}>
                    {prediction.risk_level} HAZARD
                  </span>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
                    Log-Odds (z): <strong>{prediction.log_odds_score.toFixed(3)}</strong>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div style={{ width: '100%', height: '8px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden', marginTop: '12px' }}>
                <div 
                  style={{ 
                    width: `${Math.min(100, Math.max(0, prediction.wildfire_risk_probability * 100))}%`, 
                    height: '100%', 
                    backgroundColor: getRiskColor(prediction.risk_level),
                    transition: 'width 0.3s ease'
                  }} 
                />
              </div>

              {/* Feature Contributions List */}
              <div style={{ marginTop: '16px' }}>
                <strong style={{ fontSize: '0.8rem', color: '#334155' }}>Interpretable Feature Contributions (Z-Scores):</strong>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '8px', fontSize: '0.75rem' }}>
                  {prediction.feature_contributions.slice(0, 4).map((fc, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 8px', backgroundColor: '#f8fafc', borderRadius: '4px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {fc.contribution_score > 0 ? (
                          <ArrowUpRight style={{ width: '14px', height: '14px', color: '#dc2626' }} />
                        ) : (
                          <ArrowDownRight style={{ width: '14px', height: '14px', color: '#16a34a' }} />
                        )}
                        <code>{fc.feature_name}</code> ({fc.feature_value})
                      </span>
                      <strong style={{ color: fc.contribution_score > 0 ? '#dc2626' : '#16a34a' }}>
                        {fc.contribution_score > 0 ? `+${fc.contribution_score.toFixed(3)}` : fc.contribution_score.toFixed(3)}
                      </strong>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Model Performance & Evaluation Metrics Summary */}
      {evaluation && (
        <div className="spec-card" style={{ marginTop: '16px', backgroundColor: '#f8fafc' }}>
          <div className="spec-card-header">
            <BarChart2 className="spec-icon" style={{ color: '#16a34a' }} />
            <h4>Baseline Model Performance & Validation Metrics (Temporal Split 80/20)</h4>
          </div>

          <div className="popup-grid" style={{ marginTop: '12px' }}>
            <div className="popup-item"><span>Accuracy:</span> <strong style={{ color: '#166534' }}>{(evaluation.evaluation_metrics.accuracy * 100).toFixed(1)}%</strong></div>
            <div className="popup-item"><span>Precision:</span> <strong>{(evaluation.evaluation_metrics.precision * 100).toFixed(1)}%</strong></div>
            <div className="popup-item"><span>Recall:</span> <strong>{(evaluation.evaluation_metrics.recall * 100).toFixed(1)}%</strong></div>
            <div className="popup-item"><span>F1-Score:</span> <strong>{(evaluation.evaluation_metrics.f1_score * 100).toFixed(1)}%</strong></div>
            <div className="popup-item"><span>ROC-AUC:</span> <strong>{evaluation.evaluation_metrics.roc_auc?.toFixed(4) || 'N/A'}</strong></div>
          </div>

          {/* Explicit Boundary Distinction Disclaimer */}
          <div className="ndvi-guardrail-banner" style={{ marginTop: '12px', backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }}>
            <Info className="guardrail-icon" style={{ color: '#166534' }} />
            <div style={{ color: '#14532d', fontSize: '0.78rem' }}>
              <strong>Scientific Boundary Distinction:</strong>
              <p style={{ margin: '2px 0 0 0' }}>
                Environmental Observations (Open-Meteo live weather, Copernicus NDVI) represent <em>direct sensor measurements</em>. 
                In contrast, Model Risk Output represents a <em>statistical probability calculation</em> derived from baseline Logistic Regression coefficients.
                Model outputs do not constitute operational emergency warning infrastructure.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default BaselineModelCard;
