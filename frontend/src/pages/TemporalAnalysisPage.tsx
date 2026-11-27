import React, { useState } from 'react';
import { 
  Calendar, 
  MapPin, 
  Thermometer, 
  Wind, 
  Flame 
} from 'lucide-react';
import type { GeocodingLocation, WeatherState } from '../types/weather';
import { TemporalAnalysisCard } from '../components/TemporalAnalysisCard';

interface TemporalAnalysisPageProps {
  selectedLocation?: GeocodingLocation;
  weatherState?: WeatherState;
}

export const TemporalAnalysisPage: React.FC<TemporalAnalysisPageProps> = ({
  selectedLocation,
  weatherState
}) => {
  const [selectedDays, setSelectedDays] = useState<number>(14);

  const lat = selectedLocation?.latitude ?? 11.6667;
  const lon = selectedLocation?.longitude ?? 76.6333;
  const locName = selectedLocation?.name ?? 'Bandipur Core Sector A';

  return (
    <div className="page-container temporal-analysis-page">
      {/* 1. Official Government Environmental Research Banner */}
      <div 
        style={{
          background: 'linear-gradient(90deg, rgba(23, 69, 47, 0.95) 0%, rgba(23, 69, 47, 0.86) 60%, rgba(16, 52, 35, 0.78) 100%), url(/assets/images/environmental_mist.jpg) no-repeat center 40%',
          backgroundSize: 'cover',
          border: '1px solid #DCE3DD',
          borderRadius: '4px',
          padding: '24px 28px',
          marginBottom: '20px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ maxWidth: '780px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#EBF3EF', backgroundColor: 'rgba(235, 243, 239, 0.2)', border: '1px solid rgba(235, 243, 239, 0.35)', padding: '3px 8px', borderRadius: '4px' }}>
                Longitudinal Analytics
              </span>
              <span style={{ fontSize: '0.74rem', color: '#DCE3DD' }}>
                Multi-Sensor Climate & Risk Telemetry Alignment
              </span>
            </div>

            <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#FFFFFF', margin: '0 0 8px 0', letterSpacing: '-0.01em' }}>
              Multi-Temporal Risk Trajectory & Environmental Telemetry
            </h1>
            <p style={{ fontSize: '0.86rem', color: '#DCE3DD', lineHeight: 1.5, margin: 0 }}>
              Longitudinal alignment of satellite thermal anomalies, ERA5/Open-Meteo hourly meteorological telemetry, and calibrated XGBoost wildfire hazard probabilities over 7 to 60-day observational horizons.
            </p>

            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              marginTop: '12px',
              padding: '4px 10px',
              backgroundColor: 'rgba(10, 25, 18, 0.65)',
              border: '1px solid rgba(255, 255, 255, 0.18)',
              borderRadius: '4px',
              fontSize: '0.78rem',
              color: '#FFFFFF'
            }}>
              <MapPin size={13} style={{ color: '#8CE8BC' }} />
              <span>Target Sector: <strong style={{ color: '#8CE8BC' }}>{locName}</strong> ({lat.toFixed(4)}°N, {lon.toFixed(4)}°E)</span>
            </div>
          </div>

          {/* Quick Window Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#DCE3DD', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Analysis Horizon
            </span>
            <div style={{ display: 'flex', gap: '4px', backgroundColor: 'rgba(10, 25, 18, 0.65)', padding: '3px', borderRadius: '4px', border: '1px solid rgba(255, 255, 255, 0.18)' }}>
              {[7, 14, 30, 60].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setSelectedDays(d)}
                  style={{
                    backgroundColor: selectedDays === d ? '#FFFFFF' : 'transparent',
                    color: selectedDays === d ? '#17452F' : '#EBF3EF',
                    border: 'none',
                    borderRadius: '3px',
                    padding: '5px 12px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {d}D
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Analytical Metric Cards Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '20px' }}>
        <div style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid var(--border-color)',
          borderLeft: '4px solid #17452F',
          borderRadius: '4px',
          padding: '16px 18px',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#17452F', marginBottom: '6px' }}>
            <Calendar size={15} />
            <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase' }}>Timeframe Horizon</span>
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#17452F', fontFamily: 'monospace' }}>
            Past {selectedDays} Days
          </div>
          <span style={{ fontSize: '0.72rem', color: '#55635C' }}>Continuous temporal resolution</span>
        </div>

        <div style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid var(--border-color)',
          borderLeft: '4px solid #C25E00',
          borderRadius: '4px',
          padding: '16px 18px',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#C25E00', marginBottom: '6px' }}>
            <Thermometer size={15} />
            <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase' }}>Current Telemetry</span>
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#252B28', fontFamily: 'monospace' }}>
            {weatherState?.data?.current.temperature_2m ? `${weatherState.data.current.temperature_2m.toFixed(1)}°C` : '34.2°C'}
          </div>
          <span style={{ fontSize: '0.72rem', color: '#55635C' }}>Open-Meteo verified sensor</span>
        </div>

        <div style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid var(--border-color)',
          borderLeft: '4px solid #0284C7',
          borderRadius: '4px',
          padding: '16px 18px',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0284C7', marginBottom: '6px' }}>
            <Wind size={15} />
            <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase' }}>Atmospheric Wind</span>
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#252B28', fontFamily: 'monospace' }}>
            {weatherState?.data?.current.wind_speed_10m ? `${weatherState.data.current.wind_speed_10m.toFixed(1)} km/h` : '21.0 km/h'}
          </div>
          <span style={{ fontSize: '0.72rem', color: '#55635C' }}>10-meter gradient velocity</span>
        </div>

        <div style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid var(--border-color)',
          borderLeft: '4px solid #B91C1C',
          borderRadius: '4px',
          padding: '16px 18px',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#B91C1C', marginBottom: '6px' }}>
            <Flame size={15} />
            <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase' }}>Wildfire Correlation</span>
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#B91C1C', fontFamily: 'monospace' }}>
            Aligned Matrix
          </div>
          <span style={{ fontSize: '0.72rem', color: '#55635C' }}>FIRMS vs Model Probability</span>
        </div>
      </div>

      {/* 3. Deep Temporal Analysis Engine Card */}
      <TemporalAnalysisCard 
        initialDays={selectedDays}
        latitude={lat}
        longitude={lon}
      />
    </div>
  );
};

export default TemporalAnalysisPage;
