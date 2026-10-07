import React from 'react';
import { Info } from 'lucide-react';

export const DemoNoticeBanner: React.FC = () => {
  return (
    <div className="demo-notice-banner">
      <div className="demo-notice-content">
        <Info className="demo-notice-icon" />
        <div>
          <strong>Scientific Research Platform Notice:</strong> ForestFusion is an integrated decision-support prototype. 
          Open-Meteo weather streaming, Copernicus Sentinel-2 vegetation telemetry, NASA FIRMS fire hotspots, XGBoost ML inference, Platt probability calibration, and TreeSHAP explainability are active. 
          Model outputs represent statistical hazard probabilities and do not constitute operational emergency warning triggers.
        </div>
      </div>
      <span className="demo-tag" style={{ backgroundColor: '#0284c7', color: '#ffffff' }}>PROTOTYPE PLATFORM ACTIVE</span>
    </div>
  );
};
