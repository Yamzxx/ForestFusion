import React from 'react';
import { 
  Cpu, 
  GitBranch, 
  Layers, 
  CheckCircle2, 
  Sliders, 
  Scale, 
  Sparkles, 
  FileText,
  Info,
  ShieldAlert
} from 'lucide-react';

export const ModelInfoPage: React.FC = () => {
  return (
    <div className="page-container model-info-page">
      {/* Header */}
      <div className="section-title-wrap" style={{ marginBottom: '20px' }}>
        <Cpu className="section-title-icon" style={{ color: '#1d5234' }} />
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1c2826' }}>
            Model Architecture & Pipeline Specification
          </h2>
          <p style={{ fontSize: '0.82rem', color: '#72857b' }}>
            Canonical machine-learning pipeline documentation, Platt scaling calibration, and TreeSHAP explainability
          </p>
        </div>
      </div>

      <div className="model-specs-grid">
        {/* Core Architecture */}
        <div className="spec-card">
          <div className="spec-card-top">
            <Cpu size={18} className="spec-icon" />
            <h4>Classifier Architecture</h4>
          </div>
          <div className="spec-table">
            <div className="spec-item">
              <span className="spec-name">Algorithm:</span>
              <strong>eXtreme Gradient Boosting (XGBoost)</strong>
            </div>
            <div className="spec-item">
              <span className="spec-name">Booster Type:</span>
              <span>gbtree (Decision Tree Ensembles)</span>
            </div>
            <div className="spec-item">
              <span className="spec-name">Objective:</span>
              <code>binary:logistic</code>
            </div>
            <div className="spec-item">
              <span className="spec-name">Model Version:</span>
              <span className="version-tag">XGBoost v1.0 (Calibrated)</span>
            </div>
            <div className="spec-item">
              <span className="spec-name">Task Formulation:</span>
              <span>Binary Wildfire Occurrence / Hazard Classification</span>
            </div>
          </div>
        </div>

        {/* Probability Calibration */}
        <div className="spec-card">
          <div className="spec-card-top">
            <Scale size={18} className="spec-icon" />
            <h4>Probability Calibration Layer</h4>
          </div>
          <div className="spec-table">
            <div className="spec-item">
              <span className="spec-name">Calibration Method:</span>
              <strong>Platt Scaling (Sigmoid Logistic Transformation)</strong>
            </div>
            <div className="spec-item">
              <span className="spec-name">Transformation Formula:</span>
              <code>P(y=1 | z) = 1 / (1 + exp(-(A * z + B)))</code>
            </div>
            <div className="spec-item">
              <span className="spec-name">Input Argument:</span>
              <span>Raw decision margin (log-odds z before logistic sigmoid)</span>
            </div>
            <div className="spec-item">
              <span className="spec-name">Calibration Diagnostic:</span>
              <span>Brier Score minimization & Reliability Diagram verification</span>
            </div>
            <div className="spec-item">
              <span className="spec-name">Operational Role:</span>
              <span>Maps tree margins to statistically empirical hazard likelihoods</span>
            </div>
          </div>
        </div>

        {/* Explainability Framework */}
        <div className="spec-card">
          <div className="spec-card-top">
            <Sparkles size={18} className="spec-icon" />
            <h4>Explainability Framework (TreeSHAP)</h4>
          </div>
          <div className="spec-table">
            <div className="spec-item">
              <span className="spec-name">Attribution Algorithm:</span>
              <strong>TreeSHAP (Tree-based SHapley Additive exPlanations)</strong>
            </div>
            <div className="spec-item">
              <span className="spec-name">Theoretical Basis:</span>
              <span>Shapley Values from Cooperative Game Theory</span>
            </div>
            <div className="spec-item">
              <span className="spec-name">Additivity Property:</span>
              <code>sum(SHAP_i) = Model_Margin - Base_Value</code>
            </div>
            <div className="spec-item">
              <span className="spec-name">Attribution Scope:</span>
              <span>Local instance attribution & Global mean |SHAP| feature ranking</span>
            </div>
            <div className="spec-item">
              <span className="spec-name">Causality Disclaimer:</span>
              <em>Statistical attribution of model output; does not assert physical causation.</em>
            </div>
          </div>
        </div>

        {/* Feature Pipeline */}
        <div className="spec-card">
          <div className="spec-card-top">
            <Layers size={18} className="spec-icon" />
            <h4>7-Dimensional Feature Pipeline</h4>
          </div>
          <div className="spec-table">
            <div className="spec-item">
              <span className="spec-name">1. temperature_2m:</span>
              <span>Air temperature at 2 meters altitude (°C)</span>
            </div>
            <div className="spec-item">
              <span className="spec-name">2. relative_humidity_2m:</span>
              <span>Near-surface relative humidity (%)</span>
            </div>
            <div className="spec-item">
              <span className="spec-name">3. wind_speed_10m:</span>
              <span>Wind speed at 10 meters altitude (km/h)</span>
            </div>
            <div className="spec-item">
              <span className="spec-name">4. precipitation:</span>
              <span>Precipitation accumulation (mm)</span>
            </div>
            <div className="spec-item">
              <span className="spec-name">5. ndvi:</span>
              <span>Normalized Difference Vegetation Index [-1 to 1]</span>
            </div>
            <div className="spec-item">
              <span className="spec-name">6. ndmi:</span>
              <span>Normalized Difference Moisture Index [-1 to 1]</span>
            </div>
            <div className="spec-item">
              <span className="spec-name">7. month:</span>
              <span>Cyclical seasonal indicator [1 to 12]</span>
            </div>
          </div>
        </div>
      </div>

      {/* Dataset & Training Information */}
      <div className="dataset-info-box" style={{ marginTop: '20px' }}>
        <h4 style={{ fontSize: '0.92rem', fontWeight: 700, color: '#1c2826', marginBottom: '8px' }}>
          Dataset & Ground-Truth Formation
        </h4>
        <p style={{ fontSize: '0.82rem', color: '#4a5d54', lineHeight: '1.6' }}>
          Target classification labels (y ∈ &#123;0, 1&#125;) represent historical satellite thermal anomaly clusters detected by NASA FIRMS (MODIS / VIIRS) coincident with severe meteorological fire danger conditions within the Western Ghats / Nilgiri Biosphere Reserve region. Non-fire background negative instances were sampled across non-burning dates and protected moist deciduous / evergreen forest sectors.
        </p>
      </div>

      {/* Limitation Notice */}
      <div className="overview-scientific-disclaimer" style={{ marginTop: '16px' }}>
        <ShieldAlert size={14} className="disclaimer-icon" />
        <p className="disclaimer-text">
          <strong>Academic Research Notice:</strong> ForestFusion is a final-year CSE decision-support research platform. Model probabilities represent statistical hazard estimates under historical training distributions and do not constitute real-time emergency warnings.
        </p>
      </div>
    </div>
  );
};

export default ModelInfoPage;
