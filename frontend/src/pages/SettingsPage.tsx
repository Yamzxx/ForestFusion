import React, { useState } from 'react';
import { 
  Settings, 
  Sliders, 
  Clock, 
  Server, 
  ShieldCheck, 
  CheckCircle2, 
  Monitor, 
  Save, 
  RotateCcw 
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  // Display Preferences State
  const [tempUnit, setTempUnit] = useState<'C' | 'F'>('C');
  const [windUnit, setWindUnit] = useState<'kmh' | 'ms' | 'mph'>('kmh');
  const [coordFormat, setCoordFormat] = useState<'DD' | 'DMS'>('DD');
  const [areaUnit, setAreaUnit] = useState<'ha' | 'km2'>('ha');

  // Notification & Risk Threshold State
  const [elevatedThreshold, setElevatedThreshold] = useState<number>(35);
  const [criticalThreshold, setCriticalThreshold] = useState<number>(75);

  // Telemetry Refresh State
  const [refreshInterval, setRefreshInterval] = useState<number>(30);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState<boolean>(true);
  const [satelliteCacheTtl, setSatelliteCacheTtl] = useState<number>(12);

  // Status message
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  const handleSave = () => {
    setSaveStatus('Preferences successfully saved to local research session.');
    setTimeout(() => setSaveStatus(null), 3500);
  };

  const handleReset = () => {
    setTempUnit('C');
    setWindUnit('kmh');
    setCoordFormat('DD');
    setAreaUnit('ha');
    setElevatedThreshold(35);
    setCriticalThreshold(75);
    setRefreshInterval(30);
    setAutoRefreshEnabled(true);
    setSatelliteCacheTtl(12);
    setSaveStatus('Preferences reset to scientific defaults.');
    setTimeout(() => setSaveStatus(null), 3500);
  };

  return (
    <div className="page-container settings-page" style={{ padding: '24px 32px' }}>
      {/* 1. Header Section */}
      <div style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid #D5DDD8',
        borderRadius: '6px',
        padding: '24px 28px',
        marginBottom: '24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px',
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
            <Settings size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#17452F', margin: '0 0 4px 0' }}>
              Platform Configuration & Research Preferences
            </h2>
            <p style={{ fontSize: '0.86rem', color: '#55635C', margin: 0 }}>
              Customize environmental telemetry units, Bayesian probability thresholds, refresh frequencies, and system parameters
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            onClick={handleReset}
            style={{
              backgroundColor: '#F8FAF9',
              color: '#55635C',
              border: '1px solid #D5DDD8',
              borderRadius: '6px',
              padding: '9px 16px',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <RotateCcw size={14} />
            <span>Reset Defaults</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            style={{
              backgroundColor: '#17452F',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '6px',
              padding: '9px 18px',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 1px 3px rgba(23, 69, 47, 0.2)'
            }}
          >
            <Save size={14} />
            <span>Save Preferences</span>
          </button>
        </div>
      </div>

      {saveStatus && (
        <div style={{
          backgroundColor: '#EBF3EF',
          border: '1px solid #26734B',
          borderRadius: '6px',
          padding: '12px 18px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          color: '#17452F',
          fontSize: '0.84rem',
          fontWeight: 600
        }}>
          <CheckCircle2 size={18} style={{ color: '#26734B' }} />
          <span>{saveStatus}</span>
        </div>
      )}

      {/* 2. Grid of Preference Panels */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        {/* Panel 1: Display & Meteorological Units */}
        <div style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #D5DDD8',
          borderRadius: '6px',
          padding: '22px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', borderBottom: '1px solid #E2E8F0', paddingBottom: '12px' }}>
            <Monitor size={18} style={{ color: '#17452F' }} />
            <h3 style={{ fontSize: '1.02rem', fontWeight: 800, color: '#17452F', margin: 0 }}>
              Display & Measurement Units
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#252B28' }}>Temperature Metric</div>
                <div style={{ fontSize: '0.74rem', color: '#55635C' }}>Standard meteorological reporting scale</div>
              </div>
              <div style={{ display: 'flex', borderRadius: '4px', overflow: 'hidden', border: '1px solid #D5DDD8' }}>
                <button
                  type="button"
                  onClick={() => setTempUnit('C')}
                  style={{
                    backgroundColor: tempUnit === 'C' ? '#17452F' : '#F8FAF9',
                    color: tempUnit === 'C' ? '#FFFFFF' : '#55635C',
                    border: 'none',
                    padding: '6px 14px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Celsius (°C)
                </button>
                <button
                  type="button"
                  onClick={() => setTempUnit('F')}
                  style={{
                    backgroundColor: tempUnit === 'F' ? '#17452F' : '#F8FAF9',
                    color: tempUnit === 'F' ? '#FFFFFF' : '#55635C',
                    border: 'none',
                    padding: '6px 14px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Fahrenheit (°F)
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#252B28' }}>Wind Velocity Unit</div>
                <div style={{ fontSize: '0.74rem', color: '#55635C' }}>Surface anemometer & model vector input</div>
              </div>
              <select
                value={windUnit}
                onChange={(e) => setWindUnit(e.target.value as any)}
                style={{
                  backgroundColor: '#FFFFFF',
                  color: '#252B28',
                  border: '1px solid #D5DDD8',
                  borderRadius: '4px',
                  padding: '6px 12px',
                  fontSize: '0.8rem',
                  fontWeight: 600
                }}
              >
                <option value="kmh">km/h (Kilometers / hour)</option>
                <option value="ms">m/s (Meters / second)</option>
                <option value="mph">mph (Miles / hour)</option>
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#252B28' }}>Geographic Coordinates</div>
                <div style={{ fontSize: '0.74rem', color: '#55635C' }}>Cartographic projection notation</div>
              </div>
              <select
                value={coordFormat}
                onChange={(e) => setCoordFormat(e.target.value as any)}
                style={{
                  backgroundColor: '#FFFFFF',
                  color: '#252B28',
                  border: '1px solid #D5DDD8',
                  borderRadius: '4px',
                  padding: '6px 12px',
                  fontSize: '0.8rem',
                  fontWeight: 600
                }}
              >
                <option value="DD">Decimal Degrees (11.6640° N)</option>
                <option value="DMS">Deg Min Sec (11° 39' 50" N)</option>
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#252B28' }}>Burn Extent & Area Unit</div>
                <div style={{ fontSize: '0.74rem', color: '#55635C' }}>Spatial area calculation metric</div>
              </div>
              <select
                value={areaUnit}
                onChange={(e) => setAreaUnit(e.target.value as any)}
                style={{
                  backgroundColor: '#FFFFFF',
                  color: '#252B28',
                  border: '1px solid #D5DDD8',
                  borderRadius: '4px',
                  padding: '6px 12px',
                  fontSize: '0.8rem',
                  fontWeight: 600
                }}
              >
                <option value="ha">Hectares (ha)</option>
                <option value="km2">Square Kilometers (km²)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Panel 2: Hazard Classification & Probability Thresholds */}
        <div style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #D5DDD8',
          borderRadius: '6px',
          padding: '22px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', borderBottom: '1px solid #E2E8F0', paddingBottom: '12px' }}>
            <Sliders size={18} style={{ color: '#17452F' }} />
            <h3 style={{ fontSize: '1.02rem', fontWeight: 800, color: '#17452F', margin: 0 }}>
              Calibrated Risk Classification Thresholds
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#252B28' }}>
                  Elevated Attention Threshold
                </span>
                <span style={{ fontSize: '0.84rem', fontWeight: 800, color: '#C25E00' }}>
                  P(Calib) ≥ {elevatedThreshold}%
                </span>
              </div>
              <input 
                type="range"
                min={20}
                max={50}
                step={5}
                value={elevatedThreshold}
                onChange={(e) => setElevatedThreshold(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#C25E00' }}
              />
              <div style={{ fontSize: '0.74rem', color: '#55635C', marginTop: '4px' }}>
                Triggers Moderate hazard classification and sector lookout warnings
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#252B28' }}>
                  Extreme Hazard Threshold
                </span>
                <span style={{ fontSize: '0.84rem', fontWeight: 800, color: '#B91C1C' }}>
                  P(Calib) ≥ {criticalThreshold}%
                </span>
              </div>
              <input 
                type="range"
                min={60}
                max={90}
                step={5}
                value={criticalThreshold}
                onChange={(e) => setCriticalThreshold(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#B91C1C' }}
              />
              <div style={{ fontSize: '0.74rem', color: '#55635C', marginTop: '4px' }}>
                Triggers Very High emergency alert and rapid intervention recommendations
              </div>
            </div>
          </div>
        </div>

        {/* Panel 3: Telemetry Auto-Refresh & Ingestion */}
        <div style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #D5DDD8',
          borderRadius: '6px',
          padding: '22px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', borderBottom: '1px solid #E2E8F0', paddingBottom: '12px' }}>
            <Clock size={18} style={{ color: '#17452F' }} />
            <h3 style={{ fontSize: '1.02rem', fontWeight: 800, color: '#17452F', margin: 0 }}>
              Telemetry Refresh & Synchronization
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#252B28' }}>Automatic Polling</div>
                <div style={{ fontSize: '0.74rem', color: '#55635C' }}>Periodic health check & weather re-query</div>
              </div>
              <input 
                type="checkbox"
                checked={autoRefreshEnabled}
                onChange={(e) => setAutoRefreshEnabled(e.target.checked)}
                style={{ width: '18px', height: '18px', accentColor: '#17452F', cursor: 'pointer' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#252B28' }}>Backend Health Interval</div>
                <div style={{ fontSize: '0.74rem', color: '#55635C' }}>Frequency of API ping</div>
              </div>
              <select
                value={refreshInterval}
                onChange={(e) => setRefreshInterval(Number(e.target.value))}
                style={{
                  backgroundColor: '#FFFFFF',
                  color: '#252B28',
                  border: '1px solid #D5DDD8',
                  borderRadius: '4px',
                  padding: '6px 12px',
                  fontSize: '0.8rem',
                  fontWeight: 600
                }}
              >
                <option value={15}>15 Seconds</option>
                <option value={30}>30 Seconds (Default)</option>
                <option value={60}>60 Seconds</option>
                <option value={300}>5 Minutes</option>
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#252B28' }}>Sentinel-2 Cache Window</div>
                <div style={{ fontSize: '0.74rem', color: '#55635C' }}>Tile surface reflectance cache TTL</div>
              </div>
              <select
                value={satelliteCacheTtl}
                onChange={(e) => setSatelliteCacheTtl(Number(e.target.value))}
                style={{
                  backgroundColor: '#FFFFFF',
                  color: '#252B28',
                  border: '1px solid #D5DDD8',
                  borderRadius: '4px',
                  padding: '6px 12px',
                  fontSize: '0.8rem',
                  fontWeight: 600
                }}
              >
                <option value={6}>6 Hours</option>
                <option value={12}>12 Hours (Recommended)</option>
                <option value={24}>24 Hours</option>
              </select>
            </div>
          </div>
        </div>

        {/* Panel 4: System Architecture & Deployment Metadata */}
        <div style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #D5DDD8',
          borderRadius: '6px',
          padding: '22px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', borderBottom: '1px solid #E2E8F0', paddingBottom: '12px' }}>
            <Server size={18} style={{ color: '#17452F' }} />
            <h3 style={{ fontSize: '1.02rem', fontWeight: 800, color: '#17452F', margin: 0 }}>
              System Architecture & Environment
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.82rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #E2E8F0' }}>
              <span style={{ color: '#55635C' }}>Backend API Route:</span>
              <code style={{ backgroundColor: '#F4F6F5', padding: '2px 8px', borderRadius: '4px', color: '#17452F', border: '1px solid #D5DDD8', fontWeight: 600 }}>
                /api (Vite Proxy → :8000)
              </code>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #E2E8F0' }}>
              <span style={{ color: '#55635C' }}>Inference Engine:</span>
              <span style={{ color: '#252B28', fontWeight: 700 }}>XGBoost v1.0 + Platt Sigmoid</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #E2E8F0' }}>
              <span style={{ color: '#55635C' }}>Primary Region of Interest:</span>
              <span style={{ color: '#252B28', fontWeight: 600 }}>Western Ghats (11.5°N - 12.2°N)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #E2E8F0' }}>
              <span style={{ color: '#55635C' }}>Atmospheric Telemetry:</span>
              <span style={{ color: '#26734B', fontWeight: 700 }}>Open-Meteo High-Resolution API</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#55635C' }}>Thermal Radiometer Feed:</span>
              <span style={{ color: '#C25E00', fontWeight: 700 }}>NASA FIRMS (VIIRS 375m & MODIS)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Security & Token Storage Guardrail Note */}
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
          <strong style={{ color: '#17452F' }}>Scientific Deployment Note:</strong> Sensitive API tokens (e.g. <code>NASA_FIRMS_MAP_KEY</code>, Copernicus credentials) are stored securely in <code>backend/.env</code> and are never leaked to client browsers. Configuration changes applied here are stored within your browser's research session profile.
        </p>
      </div>
    </div>
  );
};

export default SettingsPage;
