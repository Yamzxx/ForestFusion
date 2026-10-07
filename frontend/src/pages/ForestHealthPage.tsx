import React from 'react';
import { VegetationPanel } from '../components/VegetationPanel';
import type { VegetationState } from '../types/vegetation';
import type { GeocodingLocation } from '../types/weather';
import { Layers, Calendar, Clock, Info, Activity, Globe } from 'lucide-react';

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
  const latest = vegetationState.data?.latest_observation;
  const isConfigured = vegetationState.data?.is_configured;

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

      {/* Spectral Indices Status & Interpretation */}
      <div className="spectral-indices-card" style={{ marginTop: '20px' }}>
        <div className="panel-header">
          <div className="panel-header-title">
            <Activity className="panel-header-icon" style={{ color: '#16a34a' }} />
            <div>
              <h3>Spectral Index Measurements & Data Provenance</h3>
              <span className="panel-subtitle">
                Surface reflectance measurements derived from Copernicus Sentinel-2 MSI L2A bottom-of-atmosphere tiles
              </span>
            </div>
          </div>
          <span className={`status-badge-pill ${isConfigured ? 'configured' : 'unconfigured'}`}>
            <Globe className="pill-icon" />
            {isConfigured ? 'SENTINEL-2 ACTIVE' : 'AWAITING AUTHENTICATION'}
          </span>
        </div>

        <div className="indices-values-grid">
          {/* NDVI Card */}
          <div className="index-val-box">
            <div className="index-val-top">
              <span className="index-code-tag">NDVI</span>
              <span className="index-source-tag">Sentinel-2 (B8, B4)</span>
            </div>
            <div className="index-number">
              {latest?.ndvi !== undefined ? latest.ndvi.toFixed(3) : 'N/A'}
            </div>
            <div className="index-name">Normalized Difference Vegetation Index</div>
            <div className="index-provenance">
              <span>Date: {latest?.timestamp || 'N/A'}</span>
              <span>Res: {latest?.spatial_resolution || '10m'}</span>
            </div>
            <p className="index-desc">
              Ratio of near-infrared (842 nm) to red (665 nm) reflectance. Indicates photosynthetic absorption and chlorophyll concentration across the canopy.
            </p>
          </div>

          {/* NDMI Card */}
          <div className="index-val-box">
            <div className="index-val-top">
              <span className="index-code-tag">NDMI</span>
              <span className="index-source-tag">Sentinel-2 (B8, B11)</span>
            </div>
            <div className="index-number">
              {latest?.ndmi !== undefined ? latest.ndmi.toFixed(3) : 'N/A'}
            </div>
            <div className="index-name">Normalized Difference Moisture Index</div>
            <div className="index-provenance">
              <span>Date: {latest?.timestamp || 'N/A'}</span>
              <span>Res: 20m</span>
            </div>
            <p className="index-desc">
              Ratio comparing NIR (842 nm) to SWIR-1 (1610 nm). Sensitive to liquid water absorption in spongy mesophyll tissues, indicating canopy moisture variation.
            </p>
          </div>

          {/* NBR Card */}
          <div className="index-val-box">
            <div className="index-val-top">
              <span className="index-code-tag">NBR</span>
              <span className="index-source-tag">Sentinel-2 (B8, B12)</span>
            </div>
            <div className="index-number">
              {latest?.nbr !== undefined ? latest.nbr.toFixed(3) : 'N/A'}
            </div>
            <div className="index-name">Normalized Burn Ratio</div>
            <div className="index-provenance">
              <span>Date: {latest?.timestamp || 'N/A'}</span>
              <span>Res: 20m</span>
            </div>
            <p className="index-desc">
              Ratio comparing NIR (842 nm) to SWIR-2 (2190 nm). Sensitive to charcoal deposit absorption and canopy removal, used in post-disturbance burn severity indexing.
            </p>
          </div>
        </div>

        <div className="index-methodology-disclaimer">
          <Info size={14} className="inline-icon" />
          <span>
            <strong>Scientific Indexing Standard:</strong> Index values represent optical reflectance ratios [-1.0 to +1.0]. Qualitative terms ("healthy", "degraded") are not assigned without region-specific phenological baseline thresholds and field verification.
          </span>
        </div>
      </div>

      {/* Spectral Formulas Specification Grid */}
      <div className="formula-cards-grid" style={{ marginTop: '20px' }}>
        <div className="formula-card">
          <span className="formula-tag">NDVI FORMULATION</span>
          <h3>Photosynthetic Vigor Ratio</h3>
          <code className="formula-code">NDVI = (Band 8 - Band 4) / (Band 8 + Band 4)</code>
          <p>Sentinel-2 MSI Band 8 (NIR 842nm, 10m) and Band 4 (Red 665nm, 10m).</p>
        </div>

        <div className="formula-card">
          <span className="formula-tag">NDMI FORMULATION</span>
          <h3>Canopy Moisture Content Ratio</h3>
          <code className="formula-code">NDMI = (Band 8 - Band 11) / (Band 8 + Band 11)</code>
          <p>Sentinel-2 MSI Band 8 (NIR 842nm, 10m) and Band 11 (SWIR 1610nm, 20m).</p>
        </div>

        <div className="formula-card">
          <span className="formula-tag">NBR FORMULATION</span>
          <h3>Burn & Disturbance Ratio</h3>
          <code className="formula-code">NBR = (Band 8 - Band 12) / (Band 8 + Band 12)</code>
          <p>Sentinel-2 MSI Band 8 (NIR 842nm, 10m) and Band 12 (SWIR2 2190nm, 20m).</p>
        </div>
      </div>
    </div>
  );
};

export default ForestHealthPage;
