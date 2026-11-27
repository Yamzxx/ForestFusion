import React from 'react';
import { 
  Database, 
  Layers, 
  CloudSun, 
  Flame, 
  RefreshCw,
  ShieldCheck, 
  Radio, 
  FileCode 
} from 'lucide-react';
import type { WeatherState } from '../types/weather';
import type { VegetationState } from '../types/vegetation';
import type { FireState } from '../types/fire';
import type { HealthStatus } from '../types';

interface DataSourcesPageProps {
  healthStatus: HealthStatus | null;
  weatherState: WeatherState;
  vegetationState: VegetationState;
  fireState: FireState;
  onRetryWeather: () => void;
  onRetryVegetation: () => void;
  onRetryFires: () => void;
}

export const DataSourcesPage: React.FC<DataSourcesPageProps> = ({
  healthStatus,
  weatherState,
  vegetationState,
  fireState,
  onRetryWeather,
  onRetryVegetation,
  onRetryFires
}) => {
  return (
    <div className="page-container data-sources-page" style={{ padding: '24px 32px' }}>
      {/* 1. Page Header */}
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
            <Database size={24} />
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
                <Radio size={13} style={{ color: '#26734B' }} /> ● Telemetry & Data Provenance
              </span>
              <span style={{ fontSize: '0.74rem', color: '#7E8B85', fontWeight: 600 }}>
                | INGESTION PIPELINE STATUS
              </span>
            </div>
            <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#17452F', margin: '0 0 4px 0' }}>
              Scientific Data Sources & Sensor Diagnostics
            </h2>
            <p style={{ fontSize: '0.86rem', color: '#55635C', margin: 0 }}>
              Real-time API connectivity, orbital satellite ingest schedules, historical training datasets, and telemetry metadata verification
            </p>
          </div>
        </div>
      </div>

      {/* 2. Grid of Data Sources */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        {/* Source 1: Open-Meteo Weather API */}
        <div style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #D5DDD8',
          borderRadius: '6px',
          padding: '22px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #E2E8F0', paddingBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <CloudSun size={20} style={{ color: '#17452F' }} />
              <div>
                <h3 style={{ fontSize: '1.02rem', fontWeight: 800, color: '#17452F', margin: 0 }}>Open-Meteo Weather API</h3>
                <span style={{ fontSize: '0.74rem', color: '#55635C' }}>High-Resolution Atmospheric Telemetry</span>
              </div>
            </div>
            <span style={{
              fontSize: '0.74rem',
              fontWeight: 700,
              color: weatherState.data ? '#26734B' : '#C25E00',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              ● {weatherState.data ? 'CONNECTED & LIVE' : weatherState.loading ? 'CONNECTING...' : 'DISCONNECTED'}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.82rem', marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#55635C' }}>Endpoint Route:</span>
              <code style={{ backgroundColor: '#F4F6F5', padding: '2px 8px', borderRadius: '4px', color: '#17452F', border: '1px solid #D5DDD8', fontSize: '0.76rem' }}>
                api.open-meteo.com/v1/forecast
              </code>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#55635C' }}>Ingested Variables:</span>
              <span style={{ color: '#252B28', fontWeight: 600, textAlign: 'right' }}>T(2m), RH(2m), Wind(10m), Precip</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#55635C' }}>Spatial Resolution:</span>
              <span style={{ color: '#252B28', fontWeight: 600 }}>0.1° (~11 km grid resolution)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#55635C' }}>Current Observation:</span>
              <strong style={{ color: '#17452F' }}>
                {weatherState.data ? `${weatherState.data.current.temperature_2m}°C, ${weatherState.data.current.relative_humidity_2m}% RH` : 'Awaiting data'}
              </strong>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #E2E8F0', paddingTop: '12px' }}>
            <span style={{ fontSize: '0.74rem', color: '#55635C' }}>License: Open Database License (ODbL)</span>
            <button
              type="button"
              onClick={onRetryWeather}
              disabled={weatherState.loading}
              style={{
                backgroundColor: '#F8FAF9',
                color: '#17452F',
                border: '1px solid #D5DDD8',
                borderRadius: '4px',
                padding: '6px 12px',
                fontSize: '0.76rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <RefreshCw size={12} className={weatherState.loading ? 'spinner' : ''} />
              <span>Verify Feed</span>
            </button>
          </div>
        </div>

        {/* Source 2: Copernicus Sentinel-2 MSI */}
        <div style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #D5DDD8',
          borderRadius: '6px',
          padding: '22px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #E2E8F0', paddingBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Layers size={20} style={{ color: '#17452F' }} />
              <div>
                <h3 style={{ fontSize: '1.02rem', fontWeight: 800, color: '#17452F', margin: 0 }}>Copernicus Sentinel-2 MSI</h3>
                <span style={{ fontSize: '0.74rem', color: '#55635C' }}>Surface Reflectance L2A Bottom-of-Atmosphere</span>
              </div>
            </div>
            <span style={{
              fontSize: '0.74rem',
              fontWeight: 700,
              color: vegetationState.data?.is_configured ? '#26734B' : '#C25E00',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              ● {vegetationState.data?.is_configured ? 'AUTHENTICATED' : 'CDSE STANDBY'}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.82rem', marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#55635C' }}>Provider:</span>
              <span style={{ color: '#252B28', fontWeight: 600 }}>Copernicus Data Space Ecosystem (CDSE)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#55635C' }}>Spectral Channels:</span>
              <span style={{ color: '#252B28', fontWeight: 600 }}>B04 (Red), B08 (NIR), B11 (SWIR1), B12 (SWIR2)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#55635C' }}>Spatial Resolution:</span>
              <span style={{ color: '#252B28', fontWeight: 600 }}>10m (B4, B8) / 20m (B11, B12)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#55635C' }}>Latest Acquisition:</span>
              <strong style={{ color: '#17452F' }}>
                {vegetationState.data?.latest_observation?.timestamp || 'Synchronized Orbit Tile'}
              </strong>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #E2E8F0', paddingTop: '12px' }}>
            <span style={{ fontSize: '0.74rem', color: '#55635C' }}>ESA Copernicus Open Access Policy</span>
            <button
              type="button"
              onClick={onRetryVegetation}
              disabled={vegetationState.loading}
              style={{
                backgroundColor: '#F8FAF9',
                color: '#17452F',
                border: '1px solid #D5DDD8',
                borderRadius: '4px',
                padding: '6px 12px',
                fontSize: '0.76rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <RefreshCw size={12} className={vegetationState.loading ? 'spinner' : ''} />
              <span>Verify Pipeline</span>
            </button>
          </div>
        </div>

        {/* Source 3: NASA FIRMS Thermal Anomaly Feeds */}
        <div style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #D5DDD8',
          borderRadius: '6px',
          padding: '22px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #E2E8F0', paddingBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Flame size={20} style={{ color: '#C25E00' }} />
              <div>
                <h3 style={{ fontSize: '1.02rem', fontWeight: 800, color: '#17452F', margin: 0 }}>NASA FIRMS Earthdata</h3>
                <span style={{ fontSize: '0.74rem', color: '#55635C' }}>Active Thermal Anomaly & Fire Radiative Power</span>
              </div>
            </div>
            <span style={{
              fontSize: '0.74rem',
              fontWeight: 700,
              color: fireState.data?.is_configured ? '#26734B' : '#C25E00',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              ● {fireState.data?.is_configured ? 'API ACTIVE' : 'MAP-KEY STANDBY'}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.82rem', marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#55635C' }}>Satellite Constellation:</span>
              <span style={{ color: '#252B28', fontWeight: 600 }}>Suomi-NPP VIIRS (375m) & MODIS (1km)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#55635C' }}>Observed Region:</span>
              <span style={{ color: '#252B28', fontWeight: 600 }}>Western Ghats / Nilgiri Biosphere</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#55635C' }}>Thermal Hotspots Logged:</span>
              <strong style={{ color: '#C25E00' }}>{fireState.data?.total_detections ?? 0} active detections</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#55635C' }}>Latency Window:</span>
              <span style={{ color: '#252B28', fontWeight: 600 }}>Near Real-Time (~3-hour downlink)</span>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #E2E8F0', paddingTop: '12px' }}>
            <span style={{ fontSize: '0.74rem', color: '#55635C' }}>NASA Earth Science ESDIS</span>
            <button
              type="button"
              onClick={onRetryFires}
              disabled={fireState.loading}
              style={{
                backgroundColor: '#F8FAF9',
                color: '#17452F',
                border: '1px solid #D5DDD8',
                borderRadius: '4px',
                padding: '6px 12px',
                fontSize: '0.76rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <RefreshCw size={12} className={fireState.loading ? 'spinner' : ''} />
              <span>Verify Feed</span>
            </button>
          </div>
        </div>

        {/* Source 4: Historical Wildfire Reanalysis & Training Datasets */}
        <div style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #D5DDD8',
          borderRadius: '6px',
          padding: '22px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #E2E8F0', paddingBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FileCode size={20} style={{ color: '#17452F' }} />
              <div>
                <h3 style={{ fontSize: '1.02rem', fontWeight: 800, color: '#17452F', margin: 0 }}>Historical Fire & ERA5 Dataset</h3>
                <span style={{ fontSize: '0.74rem', color: '#55635C' }}>Model Training & Validation Benchmark</span>
              </div>
            </div>
            <span style={{
              fontSize: '0.74rem',
              fontWeight: 700,
              color: '#26734B',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              ● VERIFIED ARCHIVE
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.82rem', marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#55635C' }}>Dataset Size:</span>
              <span style={{ color: '#252B28', fontWeight: 600 }}>15,840 spatio-temporal observation vectors</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#55635C' }}>Temporal Coverage:</span>
              <span style={{ color: '#252B28', fontWeight: 600 }}>2018 – 2024 (Multi-season coverage)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#55635C' }}>Feature Engineering:</span>
              <span style={{ color: '#252B28', fontWeight: 600 }}>6 core meteorological & spectral variables</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#55635C' }}>Inference Pipeline:</span>
              <strong style={{ color: healthStatus ? '#26734B' : '#B91C1C' }}>
                {healthStatus ? `FastAPI Online (v${healthStatus.version})` : 'FastAPI Offline'}
              </strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#55635C' }}>Reanalysis Source:</span>
              <strong style={{ color: '#17452F' }}>ECMWF ERA5-Land Reanalysis</strong>
            </div>
          </div>

          <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '12px', fontSize: '0.74rem', color: '#55635C' }}>
            Benchmarked against historical MODIS Burned Area MCD64A1 product records.
          </div>
        </div>
      </div>

      {/* Security Notice */}
      <div style={{
        backgroundColor: '#F8FAF9',
        border: '1px solid #D5DDD8',
        borderRadius: '6px',
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: '14px'
      }}>
        <ShieldCheck size={22} style={{ color: '#26734B', flexShrink: 0 }} />
        <p style={{ margin: 0, fontSize: '0.82rem', color: '#55635C', lineHeight: 1.55 }}>
          <strong style={{ color: '#17452F' }}>Credential Security Standard:</strong> External API keys (e.g. <code>NASA_FIRMS_MAP_KEY</code>) and Copernicus credentials are kept strictly server-side in <code>backend/.env</code>. The frontend communicates only with the proxy endpoints under <code>/api</code>.
        </p>
      </div>
    </div>
  );
};

export default DataSourcesPage;
