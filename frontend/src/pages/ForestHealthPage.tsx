import React from 'react';
import { VegetationPanel } from '../components/VegetationPanel';
import type { VegetationState } from '../types/vegetation';
import type { GeocodingLocation } from '../types/weather';

interface ForestHealthPageProps {
  vegetationState: VegetationState;
  selectedLocation?: GeocodingLocation | null;
  onRetryVegetation: () => void;
}

export const ForestHealthPage: React.FC<ForestHealthPageProps> = ({
  vegetationState,
  selectedLocation,
  onRetryVegetation,
}) => {
  return (
    <div className="page-container forest-health-page">
      {/* Main Vegetation Monitoring Panel */}
      <div className="section-row">
        <VegetationPanel 
          vegetationState={vegetationState}
          selectedLocation={selectedLocation}
          onRetry={onRetryVegetation}
        />
      </div>

      {/* Spectral Formulas Specification Grid */}
      <div className="formula-cards-grid" style={{ marginTop: '24px' }}>
        <div className="formula-card">
          <span className="formula-tag">NDVI</span>
          <h3>Normalized Difference Vegetation Index</h3>
          <code className="formula-code">NDVI = (B8 - B4) / (B8 + B4)</code>
          <p>Measures photosynthetic activity and canopy greenness. Sentinel-2 Band 8 (NIR) and Band 4 (Red).</p>
        </div>

        <div className="formula-card">
          <span className="formula-tag">NDMI</span>
          <h3>Normalized Difference Moisture Index</h3>
          <code className="formula-code">NDMI = (B8 - B11) / (B8 + B11)</code>
          <p>Sensitive to canopy water content. Crucial for identifying severe vegetation drought stress (Band 11 SWIR).</p>
        </div>

        <div className="formula-card">
          <span className="formula-tag">NBR</span>
          <h3>Normalized Burn Ratio</h3>
          <code className="formula-code">NBR = (B8 - B12) / (B8 + B12)</code>
          <p>Used to highlight burned areas and estimate post-ignition fire burn severity (Band 12 SWIR2).</p>
        </div>
      </div>
    </div>
  );
};

export default ForestHealthPage;
