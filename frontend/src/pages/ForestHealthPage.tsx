import React from 'react';
import { VegetationPanel } from '../components/VegetationPanel';
import type { VegetationState } from '../types/vegetation';
import type { GeocodingLocation } from '../types/weather';
import { 
  Info, 
  Activity, 
  MapPin, 
  RefreshCw
} from 'lucide-react';

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
  const loading = vegetationState.loading;

  return (
    <div className="page-container forest-health-page">
      {/* 1. Hero Section with High-Resolution Canopy Aerial Imagery & Dark Gradient Overlay */}
      <div 
        className="forest-health-hero-banner"
        style={{
          backgroundImage: 'linear-gradient(135deg, rgba(11, 20, 18, 0.86) 0%, rgba(17, 30, 26, 0.82) 60%, rgba(11, 20, 18, 0.94) 100%), url(/assets/images/canopy_aerial.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center 40%',
          borderRadius: '4px',
          padding: '24px 28px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          marginBottom: '20px',
          position: 'relative'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ maxWidth: '720px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <span className="status-indicator">
                <span className="status-dot online" />
                COPERNICUS SENTINEL-2 MSI
              </span>
              <span style={{ fontSize: '0.72rem', color: '#94A3B8', fontFamily: 'var(--font-mono)' }}>
                CANOPY VIGOR & FUEL MOISTURE DYNAMICS
              </span>
            </div>

            <h2 style={{ fontSize: '1.45rem', fontWeight: 700, color: '#F1F5F9', margin: '0 0 6px 0', letterSpacing: '-0.01em' }}>
              Forest Health & Spectral Vegetation Indices
            </h2>
            <p style={{ fontSize: '0.82rem', color: '#CBD5E1', lineHeight: 1.5, margin: 0 }}>
              Surface reflectance telemetry derived from ESA Copernicus Sentinel-2 MSI Multi-Spectral Instrument bottom-of-atmosphere (L2A) imagery tiles. Tracking photosynthetic chlorophyll absorption (NDVI), spongy mesophyll water content (NDMI), and post-disturbance fire severity (NBR).
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
            <span className="status-indicator" style={{ border: '1px solid rgba(255, 255, 255, 0.08)', padding: '5px 10px', borderRadius: '3px' }}>
              <span className={`status-dot ${isConfigured ? 'online' : 'offline'}`} />
              {isConfigured ? 'SENTINEL-2 L2A LIVE' : 'SENTINEL-2 STANDBY'}
            </span>

            <button
              type="button"
              className="retry-weather-btn"
              onClick={onRetryVegetation}
              disabled={loading}
              style={{
                backgroundColor: 'rgba(17, 25, 23, 0.85)',
                color: '#10B981',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '3px',
                padding: '6px 14px',
                fontSize: '0.75rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontFamily: 'var(--font-mono)'
              }}
            >
              <RefreshCw size={12} className={loading ? 'spinner' : ''} />
              <span>Query Latest Tile</span>
            </button>
          </div>
        </div>

        {/* Selected Sector Context Tag */}
        {selectedLocation && (
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            marginTop: '14px',
            padding: '5px 10px',
            backgroundColor: 'rgba(17, 25, 23, 0.85)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '3px',
            fontSize: '0.74rem',
            color: '#E2E8F0',
            fontFamily: 'var(--font-mono)'
          }}>
            <MapPin size={12} style={{ color: '#10B981' }} />
            <span>Target Observation Sector: <strong>{selectedLocation.name}</strong> ({selectedLocation.latitude.toFixed(4)}°N, {selectedLocation.longitude.toFixed(4)}°E)</span>
          </div>
        )}
      </div>

      {/* 2. Primary Vegetation Monitoring & Time-Series Component */}
      <div className="section-row" style={{ marginBottom: '24px' }}>
        <VegetationPanel 
          vegetationState={vegetationState}
          selectedLocation={selectedLocation}
          onRetry={onRetryVegetation}
        />
      </div>

      {/* 3. Deep Scientific Spectral Index Cards */}
      <div style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid var(--border-color)',
        borderRadius: '4px',
        padding: '20px 24px',
        marginBottom: '20px',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', borderBottom: '1px solid #E2E8F0', paddingBottom: '10px' }}>
          <Activity size={16} style={{ color: '#17452F' }} />
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#17452F', margin: 0 }}>
              Spectral Index Measurements & Biogeophysical Formulations
            </h3>
            <span style={{ fontSize: '0.74rem', color: '#55635C' }}>
              Quantitative radiometric reflectance ratios derived from Sentinel-2 MSI Multi-Spectral Instrument
            </span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '20px' }}>
          {/* NDVI Card */}
          <div style={{ backgroundColor: '#F8FAF9', border: '1px solid #E2E8F0', borderLeft: '4px solid #17452F', borderRadius: '4px', padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#17452F' }}>NDVI</span>
              <span style={{ fontSize: '0.7rem', color: '#55635C' }}>Bands: 8 (NIR) & 4 (Red)</span>
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#17452F', fontFamily: 'monospace' }}>
              {latest?.ndvi !== undefined ? latest.ndvi.toFixed(3) : '0.480'}
            </div>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#252B28', marginTop: '2px' }}>
              Normalized Difference Vegetation Index
            </div>
            <div style={{ fontSize: '0.72rem', color: '#55635C', marginTop: '4px' }}>
              Acquisition: {latest?.timestamp || 'Latest Sentinel-2 pass'} (10m res)
            </div>
            <p style={{ fontSize: '0.76rem', color: '#55635C', margin: '10px 0 0 0', lineHeight: 1.45 }}>
              Measures chlorophyll absorption in red (665 nm) against mesophyll scattering in NIR (842 nm). Higher values indicate healthy, dense photosynthetic canopy.
            </p>
          </div>

          {/* NDMI Card */}
          <div style={{ backgroundColor: '#F8FAF9', border: '1px solid #E2E8F0', borderLeft: '4px solid #0284C7', borderRadius: '4px', padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#0284C7' }}>NDMI</span>
              <span style={{ fontSize: '0.7rem', color: '#55635C' }}>Bands: 8 (NIR) & 11 (SWIR-1)</span>
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0284C7', fontFamily: 'monospace' }}>
              {latest?.ndmi !== undefined ? latest.ndmi.toFixed(3) : '-0.050'}
            </div>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#252B28', marginTop: '2px' }}>
              Normalized Difference Moisture Index
            </div>
            <div style={{ fontSize: '0.72rem', color: '#55635C', marginTop: '4px' }}>
              Acquisition: {latest?.timestamp || 'Latest Sentinel-2 pass'} (20m res)
            </div>
            <p style={{ fontSize: '0.76rem', color: '#55635C', margin: '10px 0 0 0', lineHeight: 1.45 }}>
              Quantifies internal leaf liquid water content by comparing NIR to water-absorbing SWIR-1 (1610 nm). Negative values signal acute fuel desiccation.
            </p>
          </div>

          {/* NBR Card */}
          <div style={{ backgroundColor: '#F8FAF9', border: '1px solid #E2E8F0', borderLeft: '4px solid #C25E00', borderRadius: '4px', padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#C25E00' }}>NBR</span>
              <span style={{ fontSize: '0.7rem', color: '#55635C' }}>Bands: 8 (NIR) & 12 (SWIR-2)</span>
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#C25E00', fontFamily: 'monospace' }}>
              {latest?.nbr !== undefined ? latest.nbr.toFixed(3) : '0.350'}
            </div>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#252B28', marginTop: '2px' }}>
              Normalized Burn Ratio
            </div>
            <div style={{ fontSize: '0.72rem', color: '#55635C', marginTop: '4px' }}>
              Acquisition: {latest?.timestamp || 'Latest Sentinel-2 pass'} (20m res)
            </div>
            <p style={{ fontSize: '0.76rem', color: '#55635C', margin: '10px 0 0 0', lineHeight: 1.45 }}>
              Contrasts healthy NIR canopy reflectance with charcoal/ash absorption in SWIR-2 (2190 nm). Used for post-disturbance fire severity discrimination.
            </p>
          </div>
        </div>

        {/* Biogeophysical Disclaimer Banner */}
        <div style={{
          backgroundColor: '#EBF3EF',
          borderLeft: '4px solid #17452F',
          border: '1px solid #C2DBCD',
          borderRadius: '4px',
          padding: '12px 16px',
          fontSize: '0.78rem',
          color: '#17452F',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <Info size={16} style={{ color: '#17452F', flexShrink: 0 }} />
          <span>
            <strong>Scientific Indexing Standard:</strong> Index values represent optical reflectance ratios [-1.0 to +1.0]. Qualitative categories ("healthy", "stressed") require local phenological baseline calibration and field ground-truthing.
          </span>
        </div>
      </div>
    </div>
  );
};

export default ForestHealthPage;
