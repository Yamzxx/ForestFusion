import React from 'react';
import { 
  Cpu, 
  Scale, 
  ShieldAlert, 
  Binary, 
  Database 
} from 'lucide-react';

export const ModelInfoPage: React.FC = () => {
  const INPUT_FEATURES = [
    { name: 'temperature_2m', unit: '°C', type: 'Continuous', source: 'Open-Meteo (2m Air Temp)', domain: '10.0 to 48.0 °C', desc: 'Ambient surface air temperature driving evaporative water loss in forest fuel beds.' },
    { name: 'relative_humidity_2m', unit: '%', type: 'Continuous', source: 'Open-Meteo (2m RH)', domain: '5.0 to 100.0 %', desc: 'Inverse vapor pressure deficit proxy; determines equilibrium moisture in fine dead leaf litter.' },
    { name: 'wind_speed_10m', unit: 'km/h', type: 'Continuous', source: 'Open-Meteo (10m Wind)', domain: '0.0 to 80.0 km/h', desc: 'Surface wind velocity driving flame propagation angle and convective ember spotting.' },
    { name: 'precipitation', unit: 'mm', type: 'Continuous', source: 'Open-Meteo Rain Gauge', domain: '0.0 to 120.0 mm', desc: 'Short-term moisture influx directly extinguishing surface flaming and saturating duff.' },
    { name: 'ndvi', unit: 'Index [-1, 1]', type: 'Continuous', source: 'Copernicus Sentinel-2 (B8, B4)', domain: '0.10 to 0.90', desc: 'Normalized Difference Vegetation Index; measures photosynthetic chlorophyll absorption.' },
    { name: 'ndmi', unit: 'Index [-1, 1]', type: 'Continuous', source: 'Copernicus Sentinel-2 (B8, B11)', domain: '-0.30 to +0.50', desc: 'Normalized Difference Moisture Index; reflects spongy mesophyll liquid water content.' },
    { name: 'month', unit: 'Integer [1-12]', type: 'Discrete', source: 'Temporal Telemetry', domain: '1 to 12', desc: 'Calendar month encoding seasonal monsoon transitions and annual curing cycles.' },
  ];

  return (
    <div className="page-container model-info-page" style={{ padding: '24px 32px' }}>
      {/* 1. Header Banner */}
      <div style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid #D5DDD8',
        borderRadius: '6px',
        padding: '24px 28px',
        marginBottom: '24px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '6px',
            backgroundColor: '#EBF3EF',
            border: '1px solid #C2D6CC',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#17452F'
          }}>
            <Cpu size={24} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
              <span style={{ 
                fontSize: '0.74rem', 
                fontWeight: 700, 
                color: '#26734B', 
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px'
              }}>
                <Binary size={13} style={{ color: '#26734B' }} /> ● Operational Research Architecture
              </span>
              <span style={{ fontSize: '0.74rem', color: '#7E8B85', fontWeight: 600 }}>
                | XGBOOST V1.0 + PLATT CALIBRATION
              </span>
            </div>
            <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#17452F', margin: '0 0 4px 0' }}>
              Model Architecture & Pipeline Specification
            </h2>
            <p style={{ fontSize: '0.86rem', color: '#55635C', margin: 0, lineHeight: 1.5 }}>
              End-to-end scientific methodology: gradient tree boosting, Platt sigmoid probability calibration, input vector specifications, and TreeSHAP attribution mechanics.
            </p>
          </div>
        </div>
      </div>

      {/* 2. Pipeline Flow Diagram Banner */}
      <div style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid #D5DDD8',
        borderRadius: '6px',
        padding: '22px 24px',
        marginBottom: '24px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
      }}>
        <div style={{ 
          fontSize: '0.76rem', 
          fontWeight: 800, 
          color: '#17452F', 
          textTransform: 'uppercase', 
          letterSpacing: '0.06em',
          marginBottom: '14px',
          borderBottom: '2px solid #EBF3EF',
          paddingBottom: '8px'
        }}>
          End-to-End Operational Inference Pipeline
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '14px',
          alignItems: 'stretch'
        }}>
          <div style={{ 
            backgroundColor: '#F8FAF9', 
            padding: '16px', 
            borderRadius: '6px', 
            border: '1px solid #D5DDD8',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#26734B', letterSpacing: '0.06em' }}>STAGE 1</span>
            <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#17452F', marginTop: '4px' }}>
              Telemetry Vector
            </div>
            <p style={{ fontSize: '0.78rem', color: '#55635C', margin: '6px 0 0 0', lineHeight: 1.45, flex: 1 }}>
              Open-Meteo surface weather telemetry + Copernicus Sentinel-2 MSI NDVI & NDMI vegetation indices.
            </p>
          </div>

          <div style={{ 
            backgroundColor: '#F8FAF9', 
            padding: '16px', 
            borderRadius: '6px', 
            border: '1px solid #D5DDD8',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#26734B', letterSpacing: '0.06em' }}>STAGE 2</span>
            <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#17452F', marginTop: '4px' }}>
              XGBoost Tree Ensemble
            </div>
            <p style={{ fontSize: '0.78rem', color: '#55635C', margin: '6px 0 0 0', lineHeight: 1.45, flex: 1 }}>
              Evaluates additive gradient decision trees to produce raw, uncalibrated margin log-odds values.
            </p>
          </div>

          <div style={{ 
            backgroundColor: '#EBF3EF', 
            padding: '16px', 
            borderRadius: '6px', 
            border: '2px solid #26734B',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#17452F', letterSpacing: '0.06em' }}>STAGE 3 (CORE)</span>
            <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#17452F', marginTop: '4px' }}>
              Platt Sigmoid Scaling
            </div>
            <p style={{ fontSize: '0.78rem', color: '#252B28', margin: '6px 0 0 0', lineHeight: 1.45, flex: 1 }}>
              Maps margin z via logistic sigmoid into empirical, well-calibrated posterior probability P(y=1|z).
            </p>
          </div>

          <div style={{ 
            backgroundColor: '#F8FAF9', 
            padding: '16px', 
            borderRadius: '6px', 
            border: '1px solid #D5DDD8',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#26734B', letterSpacing: '0.06em' }}>STAGE 4</span>
            <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#17452F', marginTop: '4px' }}>
              TreeSHAP & Thresholding
            </div>
            <p style={{ fontSize: '0.78rem', color: '#55635C', margin: '6px 0 0 0', lineHeight: 1.45, flex: 1 }}>
              Computes local Shapley additive attributions and applies operational FSI danger category rules.
            </p>
          </div>
        </div>
      </div>

      {/* 3. Core Technical Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        {/* Card 1: Classifier Architecture */}
        <div style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #D5DDD8',
          borderRadius: '6px',
          padding: '22px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', borderBottom: '1px solid #E2E8F0', paddingBottom: '12px' }}>
            <Cpu size={19} style={{ color: '#17452F' }} />
            <h3 style={{ fontSize: '1.02rem', fontWeight: 800, color: '#17452F', margin: 0 }}>Classifier Architecture</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.82rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#55635C' }}>Algorithm:</span>
              <strong style={{ color: '#252B28' }}>Extreme Gradient Boosting (XGBoost)</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#55635C' }}>Booster Type:</span>
              <span style={{ color: '#26734B', fontWeight: 600 }}>gbtree (Decision Tree Ensembles)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#55635C' }}>Objective Function:</span>
              <code style={{ backgroundColor: '#F4F6F5', padding: '2px 8px', borderRadius: '4px', color: '#17452F', border: '1px solid #D5DDD8', fontWeight: 600 }}>
                binary:logistic
              </code>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#55635C' }}>Max Tree Depth:</span>
              <span style={{ color: '#252B28', fontWeight: 600 }}>6 levels</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#55635C' }}>Learning Rate (eta):</span>
              <span style={{ color: '#252B28', fontWeight: 600 }}>0.05 (with early stopping)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#55635C' }}>Model Version:</span>
              <span style={{ color: '#17452F', fontWeight: 800 }}>XGBoost v1.0 (Calibrated)</span>
            </div>
          </div>
        </div>

        {/* Card 2: Probability Calibration Layer */}
        <div style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #D5DDD8',
          borderRadius: '6px',
          padding: '22px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', borderBottom: '1px solid #E2E8F0', paddingBottom: '12px' }}>
            <Scale size={19} style={{ color: '#17452F' }} />
            <h3 style={{ fontSize: '1.02rem', fontWeight: 800, color: '#17452F', margin: 0 }}>Probability Calibration Layer</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.82rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#55635C' }}>Method:</span>
              <strong style={{ color: '#26734B' }}>Platt Sigmoid Scaling</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#55635C' }}>Transformation:</span>
              <code style={{ backgroundColor: '#F4F6F5', padding: '2px 8px', borderRadius: '4px', color: '#17452F', border: '1px solid #D5DDD8', fontWeight: 600 }}>
                P(y=1 | z) = 1 / [1 + exp(-(A·z + B))]
              </code>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#55635C' }}>Optimization Target:</span>
              <span style={{ color: '#252B28', fontWeight: 600 }}>Brier Score minimization & Cross-Entropy</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#55635C' }}>Validation Split:</span>
              <span style={{ color: '#252B28', fontWeight: 600 }}>3-fold cross-validated out-of-fold margins</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <span style={{ color: '#55635C' }}>Scientific Benefit:</span>
              <span style={{ color: '#252B28', textAlign: 'right', maxWidth: '250px', fontSize: '0.78rem', lineHeight: 1.4 }}>
                Eliminates sigmoid distortion in boosted trees so a predicted 70% probability corresponds directly to a 7-in-10 observed fire frequency.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Complete Input Feature Vector Specification Table */}
      <div style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid #D5DDD8',
        borderRadius: '6px',
        padding: '22px',
        marginBottom: '24px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <Database size={20} style={{ color: '#17452F' }} />
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#17452F', margin: 0 }}>
              Input Feature Vector Specification (7 Dimensions)
            </h3>
            <span style={{ fontSize: '0.78rem', color: '#55635C' }}>
              Atmospheric and multispectral surface variables ingested by the model inference engine
            </span>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="scientific-data-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
            <thead>
              <tr>
                <th style={{ backgroundColor: '#17452F', color: '#FFFFFF', padding: '10px 14px', textAlign: 'left', fontWeight: 700 }}>Feature Identifier</th>
                <th style={{ backgroundColor: '#17452F', color: '#FFFFFF', padding: '10px 14px', textAlign: 'left', fontWeight: 700 }}>Physical Unit</th>
                <th style={{ backgroundColor: '#17452F', color: '#FFFFFF', padding: '10px 14px', textAlign: 'left', fontWeight: 700 }}>Data Source</th>
                <th style={{ backgroundColor: '#17452F', color: '#FFFFFF', padding: '10px 14px', textAlign: 'left', fontWeight: 700 }}>Valid Domain</th>
                <th style={{ backgroundColor: '#17452F', color: '#FFFFFF', padding: '10px 14px', textAlign: 'left', fontWeight: 700 }}>Physical & Ecological Rationale</th>
              </tr>
            </thead>
            <tbody>
              {INPUT_FEATURES.map((feat, idx) => (
                <tr key={idx} style={{ 
                  borderBottom: '1px solid #E2E8F0', 
                  backgroundColor: idx % 2 === 0 ? '#FFFFFF' : '#F8FAF9' 
                }}>
                  <td style={{ padding: '11px 14px', fontWeight: 700, color: '#17452F', fontFamily: 'monospace' }}>
                    {feat.name}
                  </td>
                  <td style={{ padding: '11px 14px', color: '#252B28' }}>{feat.unit}</td>
                  <td style={{ padding: '11px 14px', color: '#26734B', fontWeight: 600 }}>{feat.source}</td>
                  <td style={{ padding: '11px 14px', color: '#C25E00', fontFamily: 'monospace', fontWeight: 600 }}>{feat.domain}</td>
                  <td style={{ padding: '11px 14px', color: '#55635C', maxWidth: '340px', lineHeight: 1.45 }}>{feat.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Model Limitations & Guardrails */}
      <div style={{
        backgroundColor: '#FFFBEB',
        border: '1px solid #F59E0B',
        borderRadius: '6px',
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '14px'
      }}>
        <ShieldAlert size={22} style={{ color: '#D97706', flexShrink: 0, marginTop: '2px' }} />
        <div style={{ fontSize: '0.82rem', color: '#78350F', lineHeight: 1.6 }}>
          <strong style={{ color: '#92400E' }}>Operational Guardrails & Known Limitations:</strong> The model evaluates wildfire susceptibility and ignition favorability; it does NOT predict arson, human-induced ignitions, or lightning strike coordinates. Optical satellite indices (NDVI, NDMI) may be masked during dense cloud cover periods, during which the system relies on historical seasonal priors until clear-sky Sentinel-2 passes occur.
        </div>
      </div>
    </div>
  );
};

export default ModelInfoPage;
