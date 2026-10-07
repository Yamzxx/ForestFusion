import React from 'react';
import { 
  Settings, 
  Lock, 
  Server, 
  Database, 
  Sliders, 
  CheckCircle2, 
  ShieldCheck 
} from 'lucide-react';
export { ModelAnalyticsPage as AnalyticsPage } from './ModelAnalyticsPage';
export { DecisionSupportPage as AlertsPage } from './DecisionSupportPage';

export const SettingsPage: React.FC = () => (
  <div className="page-container settings-page">
    <div className="section-title-wrap" style={{ marginBottom: '20px' }}>
      <Settings className="section-title-icon" style={{ color: '#1d5234' }} />
      <div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1c2826' }}>
          ForestFusion System Configuration & Parameters
        </h2>
        <p style={{ fontSize: '0.82rem', color: '#72857b' }}>
          Backend API endpoints, geographic region-of-interest bounds, and probability thresholds
        </p>
      </div>
    </div>

    <div className="settings-preview-card">
      <div className="settings-header">
        <Server size={16} className="inline-icon" />
        <h4>Active Platform Configuration</h4>
      </div>

      <div className="setting-row">
        <span>Backend API Base Route:</span>
        <code>/api (Vite dev proxy -&gt; http://127.0.0.1:8000)</code>
      </div>

      <div className="setting-row">
        <span>Execution Environment:</span>
        <span className="badge-calib">FastAPI + Vite React Research Architecture</span>
      </div>

      <div className="setting-row">
        <span>Primary Region of Interest:</span>
        <span>Western Ghats / Nilgiri Biosphere Reserve (11.5°N - 12.2°N, 76.0°E - 77.0°E)</span>
      </div>

      <div className="setting-row">
        <span>Probability Classification Threshold:</span>
        <code>P(Calibrated) &gt;= 0.35 (Elevated Attention)</code>
      </div>

      <div className="setting-row">
        <span>Probability Extreme Threshold:</span>
        <code>P(Calibrated) &gt;= 0.75 (Very High Attention)</code>
      </div>

      <div className="setting-row">
        <span>Active Model Pipeline:</span>
        <span>XGBoost v1.0 with Platt Sigmoid Probability Calibration</span>
      </div>
    </div>

    <div className="settings-info-card" style={{ marginTop: '20px' }}>
      <ShieldCheck size={16} className="inline-icon" />
      <p style={{ fontSize: '0.82rem', color: '#4a5d54', margin: 0 }}>
        Environment configurations are managed via <code>backend/.env</code> and <code>frontend/.env</code>. To update API tokens (such as <code>NASA_FIRMS_MAP_KEY</code> or Copernicus credentials), update the backend environment file and reload the uvicorn process.
      </p>
    </div>
  </div>
);
