import React from 'react';
import { Info } from 'lucide-react';

export const DemoNoticeBanner: React.FC = () => {
  return (
    <div className="demo-notice-banner">
      <div className="demo-notice-content">
        <Info className="demo-notice-icon" />
        <div>
          <strong>Academic Prototype Notice:</strong> All values displayed across dashboard cards, map markers, and charts represent <em>illustrative mock data</em>. 
          Sentinel-2 band acquisition, weather API streaming, and XGBoost machine-learning inference will be integrated in subsequent project stages. 
          No operational wildfire risk predictions are active until model calibration is completed.
        </div>
      </div>
      <span className="demo-tag">STAGE 1 DASHBOARD SHELL</span>
    </div>
  );
};
