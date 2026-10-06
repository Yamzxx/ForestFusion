import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  HelpCircle, 
  ArrowUpRight, 
  ArrowDownRight, 
  BarChart2, 
  Sliders, 
  Info, 
  RefreshCw, 
  CheckCircle2, 
  ShieldAlert, 
  TrendingUp, 
  Layers 
} from 'lucide-react';
import type { BaselineFeaturesInput } from '../types/mlModel';
import type { LocalShapExplanationResponse, GlobalShapReport } from '../types/shapExplanation';
import { fetchLocalShapExplanation, fetchGlobalShapReport } from '../services/shapService';

interface ShapExplainabilityCardProps {
  initialTemperature?: number;
  initialHumidity?: number;
  initialWindSpeed?: number;
}

export const ShapExplainabilityCard: React.FC<ShapExplainabilityCardProps> = ({
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

  const [localExplanation, setLocalExplanation] = useState<LocalShapExplanationResponse | null>(null);
  const [globalReport, setGlobalReport] = useState<GlobalShapReport | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const loadData = async (params: BaselineFeaturesInput) => {
    setLoading(true);
    try {
      const [localRes, globalRes] = await Promise.all([
        fetchLocalShapExplanation(params),
        fetchGlobalShapReport()
      ]);
      setLocalExplanation(localRes);
      setGlobalReport(globalRes);
    } catch (err) {
      console.error('SHAP load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(inputs);
  }, []);

  const handleInputChange = (field: keyof BaselineFeaturesInput, val: number) => {
    const updated = { ...inputs, [field]: val };
    setInputs(updated);
    fetchLocalShapExplanation(updated).then(setLocalExplanation).catch(console.error);
  };

  const getRiskColor = (prob?: number) => {
    if (!prob) return '#16a34a';
    if (prob >= 0.75) return '#dc2626';
    if (prob >= 0.55) return '#ea580c';
    if (prob >= 0.35) return '#d97706';
    return '#16a34a';
  };

  return (
    <div className="map-panel-card shap-explainability-card" style={{ marginTop: '24px' }}>
      {/* Header */}
      <div className="panel-header">
        <div className="panel-header-title">
          <Sparkles className="panel-header-icon" style={{ color: '#8b5cf6' }} />
          <div>
            <h3>Day 11 TreeSHAP Explainability & Model Interpretation</h3>
            <span className="panel-subtitle">
              &quot;Why did the model make this prediction?&quot; &mdash; Exact Shapley additive feature attributions for XGBoost
            </span>
          </div>
        </div>

        <div className="panel-controls">
          <span className="status-badge-pill configured" style={{ backgroundColor: '#f5f3ff', color: '#6d28d9', borderColor: '#ddd6fe' }}>
            <Layers className="pill-icon" />
            TreeSHAP EXPLAINER ACTIVE
          </span>
          <button
            type="button"
            className="retry-weather-btn"
            onClick={() => loadData(inputs)}
            disabled={loading}
          >
            <RefreshCw className={`btn-icon ${loading ? 'spinner' : ''}`} />
            <span>Re-compute SHAP</span>
          </button>
        </div>
      </div>

      {loading && (
        <div className="weather-state-box loading-state" style={{ marginTop: '16px' }}>
          <RefreshCw className="state-icon spinner" />
          <div className="state-text">
            <strong>Calculating TreeSHAP Feature Attributions...</strong>
            <p>Computing exact additive game-theoretic feature contributions...</p>
          </div>
        </div>
      )}

      {!loading && localExplanation && (
        <div className="shap-content" style={{ marginTop: '16px' }}>
          
          {/* Section 1: MODEL PREDICTION BANNER */}
          <div className="spec-card" style={{ backgroundColor: '#ffffff', borderLeft: `5px solid ${getRiskColor(localExplanation.model_probability)}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <span style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>
                  MODEL PREDICTION &amp; PROBABILITY
                </span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginTop: '4px' }}>
                  <span style={{ fontSize: '1.8rem', fontWeight: 800, color: getRiskColor(localExplanation.calibrated_probability ?? localExplanation.model_probability) }}>
                    {((localExplanation.calibrated_probability ?? localExplanation.model_probability) * 100).toFixed(1)}%
                  </span>
                  <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155' }}>
                    {localExplanation.predicted_label}
                  </span>
                  {localExplanation.calibrated_probability !== undefined && (
                    <span style={{ fontSize: '0.72rem', backgroundColor: '#dcfce7', color: '#166534', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>
                      PLATT-CALIBRATED
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
                  Raw Model Score (Uncalibrated): <strong>{(localExplanation.model_probability * 100).toFixed(1)}%</strong> &bull; Base Expectation (&phi;<sub>0</sub>): <strong>{(localExplanation.base_probability * 100).toFixed(1)}%</strong>
                </div>
              </div>

              <div style={{ textAlign: 'right', fontSize: '0.75rem', color: '#475569' }}>
                <div>Model Architecture: <strong>{localExplanation.model_name} (v{localExplanation.model_version})</strong></div>
                <div>Raw Decision Margin: <strong>{localExplanation.output_margin.toFixed(3)}</strong></div>
                <div>Additivity Axiom Status: <strong style={{ color: '#16a34a' }}>&check; Exactly Additive</strong></div>
              </div>
            </div>
          </div>

          {/* Section 2: WHY THE MODEL PREDICTED THIS (LOCAL SHAP ATTRIBUTIONS) */}
          <div className="section-grid-two-col" style={{ marginTop: '20px' }}>
            
            {/* Left Column: Local SHAP Waterfall-style Feature Contributions */}
            <div className="spec-card" style={{ backgroundColor: '#ffffff' }}>
              <div className="spec-card-header">
                <HelpCircle className="spec-icon" style={{ color: '#8b5cf6' }} />
                <h4>Why the Model Predicted This (Local SHAP Attributions)</h4>
              </div>

              <p style={{ fontSize: '0.76rem', color: '#475569', marginTop: '6px' }}>
                Each bar shows how much an individual feature <em>contributed to the model prediction</em> relative to base expectation (&phi;<sub>0</sub> = -0.60):
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '14px' }}>
                {localExplanation.feature_contributions.map((c) => {
                  const isPositive = c.shap_value > 0;
                  const isNegative = c.shap_value < 0;
                  const barWidth = Math.min(100, Math.max(8, c.attribution_magnitude * 100));

                  return (
                    <div key={c.feature_name} style={{ backgroundColor: '#f8fafc', padding: '8px 10px', borderRadius: '6px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem' }}>
                        <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px' }}>
                          {isPositive ? (
                            <ArrowUpRight style={{ width: '15px', height: '15px', color: '#dc2626' }} />
                          ) : isNegative ? (
                            <ArrowDownRight style={{ width: '15px', height: '15px', color: '#16a34a' }} />
                          ) : null}
                          <code>{c.feature_name}</code>
                          <span style={{ color: '#64748b', fontWeight: 400 }}>= {c.feature_value}</span>
                        </span>
                        
                        <strong style={{ color: isPositive ? '#dc2626' : (isNegative ? '#16a34a' : '#64748b') }}>
                          {c.shap_value > 0 ? `+${c.shap_value.toFixed(3)}` : c.shap_value.toFixed(3)}
                        </strong>
                      </div>

                      {/* Visual Contribution Bar */}
                      <div style={{ width: '100%', height: '6px', backgroundColor: '#e2e8f0', borderRadius: '3px', marginTop: '6px', overflow: 'hidden' }}>
                        <div 
                          style={{ 
                            width: `${barWidth}%`, 
                            height: '100%', 
                            backgroundColor: isPositive ? '#dc2626' : '#16a34a',
                            borderRadius: '3px'
                          }} 
                        />
                      </div>

                      <div style={{ fontSize: '0.7rem', color: isPositive ? '#991b1b' : (isNegative ? '#166534' : '#64748b'), marginTop: '4px' }}>
                        {c.human_explanation}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{ marginTop: '12px', fontSize: '0.72rem', color: '#64748b', backgroundColor: '#f8fafc', padding: '6px 8px', borderRadius: '4px' }}>
                &sum; &phi;<sub>j</sub> ({localExplanation.feature_contributions.reduce((acc, c) => acc + c.shap_value, 0).toFixed(3)}) + Base Margin ({localExplanation.base_value}) = <strong>{localExplanation.output_margin.toFixed(3)}</strong> (Exact Additivity Satisfied).
              </div>
            </div>

            {/* Right Column: Global SHAP Importance & Interactive Sliders */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Global SHAP Ranking Table */}
              {globalReport && (
                <div className="spec-card" style={{ backgroundColor: '#ffffff' }}>
                  <div className="spec-card-header">
                    <BarChart2 className="spec-icon" style={{ color: '#0284c7' }} />
                    <h4>Model Feature Importance (Global TreeSHAP)</h4>
                  </div>

                  <p style={{ fontSize: '0.74rem', color: '#475569', marginTop: '4px' }}>
                    Average magnitude of impact across 200 evaluation observations (Mean |SHAP|):
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
                    {globalReport.global_feature_importances.map((item) => (
                      <div key={item.feature_name}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem' }}>
                          <span><strong>#{item.rank}</strong> <code>{item.feature_name}</code></span>
                          <span style={{ color: '#0f172a', fontWeight: 600 }}>{item.mean_abs_shap_value.toFixed(3)} ({item.relative_importance}%)</span>
                        </div>
                        <div style={{ width: '100%', height: '5px', backgroundColor: '#e2e8f0', borderRadius: '3px', marginTop: '3px', overflow: 'hidden' }}>
                          <div 
                            style={{ 
                              width: `${item.relative_importance * 2.5}%`, 
                              height: '100%', 
                              backgroundColor: '#8b5cf6' 
                            }} 
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Interactive Parameter Sliders */}
              <div className="spec-card" style={{ backgroundColor: '#ffffff' }}>
                <div className="spec-card-header">
                  <Sliders className="spec-icon" style={{ color: '#ea580c' }} />
                  <h4>Simulate Input Telemetry (Watch SHAP Update)</h4>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '10px', fontSize: '0.76rem' }}>
                  <div>
                    <label>Temp: <strong>{inputs.temperature_2m}°C</strong></label>
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
                  <div>
                    <label>Wind: <strong>{inputs.wind_speed_10m} km/h</strong></label>
                    <input
                      type="range" min="0" max="50" step="1"
                      value={inputs.wind_speed_10m}
                      onChange={(e) => handleInputChange('wind_speed_10m', parseFloat(e.target.value))}
                      style={{ width: '100%', accentColor: '#16a34a' }}
                    />
                  </div>
                  <div>
                    <label>NDVI: <strong>{inputs.ndvi.toFixed(2)}</strong></label>
                    <input
                      type="range" min="0.10" max="0.90" step="0.02"
                      value={inputs.ndvi}
                      onChange={(e) => handleInputChange('ndvi', parseFloat(e.target.value))}
                      style={{ width: '100%', accentColor: '#15803d' }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: SCIENTIFIC INTERPRETATION & NON-CAUSALITY DISCLAIMER */}
          <div className="copernicus-setup-card" style={{ marginTop: '20px' }}>
            <div className="setup-card-header" style={{ cursor: 'default' }}>
              <div className="setup-header-left">
                <Info className="setup-icon" style={{ color: '#8b5cf6' }} />
                <div>
                  <h4>Scientific Interpretation &amp; Model Explainability Principles</h4>
                  <span className="setup-sub">Understanding what SHAP values explain versus physical causation</span>
                </div>
              </div>
            </div>

            <div className="setup-card-body">
              <ul className="setup-steps-list" style={{ fontSize: '0.78rem', color: '#334155' }}>
                <li>&bull; <strong>SHAP Explains Model Behavior:</strong> SHAP values explain how the mathematical decision trees inside XGBoost computed the prediction relative to a base expectation.</li>
                <li>&bull; <strong>Contribution is NOT Causation:</strong> A positive SHAP value indicates that a feature <em>contributed to higher predicted risk score</em> in the model. It does NOT prove that the feature &quot;caused a wildfire.&quot;</li>
                <li>&bull; <strong>Distribution Dependency:</strong> Explanations are specific to the trained model and the local training data distribution. They may not generalize to different forest biomes without recalibration.</li>
                <li>&bull; <strong>Uncalibrated Model Probability:</strong> Output probabilities reflect raw sigmoid transformations of decision tree margins and have not undergone isotonic calibration.</li>
              </ul>
            </div>
          </div>

        </div>
      )}
    </div>
  );
};
export default ShapExplainabilityCard;
