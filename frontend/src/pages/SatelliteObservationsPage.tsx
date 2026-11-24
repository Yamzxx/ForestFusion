import React, { useState, useMemo } from 'react';
import { 
  Satellite, 
  Flame, 
  Layers, 
  Search, 
  Calendar, 
  RefreshCw, 
  CheckCircle2, 
  MapPin, 
  Clock, 
  Sun, 
  Moon, 
  Activity, 
  SlidersHorizontal, 
  ChevronRight 
} from 'lucide-react';
import type { FireState, FireDetectionRecord } from '../types/fire';
import type { GeocodingLocation } from '../types/weather';
import type { VegetationState } from '../types/vegetation';
import './SatelliteObservationsPage.css';

// Active Forest Sector Presets for Western Ghats Forest Monitoring
const FOREST_SECTORS: GeocodingLocation[] = [
  { id: 101, name: 'Bandipur Core Sector A', latitude: 11.664, longitude: 76.627, country: 'India', admin1: 'Karnataka' },
  { id: 102, name: 'Nagarhole Southern Reserve', latitude: 11.986, longitude: 76.124, country: 'India', admin1: 'Karnataka' },
  { id: 103, name: 'Wayanad Altitude Range', latitude: 11.685, longitude: 76.132, country: 'India', admin1: 'Kerala' },
  { id: 104, name: 'Mudumalai Buffer Perimeter', latitude: 11.562, longitude: 76.534, country: 'India', admin1: 'Tamil Nadu' }
];

interface SatelliteObservationsPageProps {
  fireState: FireState;
  days: number;
  source: string;
  onChangeDays: (days: number) => void;
  onChangeSource: (source: string) => void;
  onRetryFire: () => void;
  selectedLocation?: GeocodingLocation;
  vegetationState?: VegetationState;
}

interface SpectralBandInfo {
  band: string;
  name: string;
  wavelength: string;
  resolution: string;
  usage: string;
  indicator: string;
  category: 'optical' | 'rededge' | 'nir' | 'swir';
}

const SENTINEL2_BANDS: SpectralBandInfo[] = [
  { 
    band: 'B02', 
    name: 'Blue', 
    wavelength: '490 nm', 
    resolution: '10 m', 
    usage: 'Atmospheric aerosol scattering correction, smoke plume delineation, surface water detection', 
    indicator: 'Optical / Smoke',
    category: 'optical'
  },
  { 
    band: 'B03', 
    name: 'Green', 
    wavelength: '560 nm', 
    resolution: '10 m', 
    usage: 'Chlorophyll peak reflectance, vegetation vigor verification, green canopy discrimination', 
    indicator: 'Canopy Health',
    category: 'optical'
  },
  { 
    band: 'B04', 
    name: 'Red', 
    wavelength: '665 nm', 
    resolution: '10 m', 
    usage: 'Maximum chlorophyll absorption band, essential denominator channel for NDVI calculation', 
    indicator: 'NDVI Critical',
    category: 'optical'
  },
  { 
    band: 'B05-B07', 
    name: 'Red Edge', 
    wavelength: '705–783 nm', 
    resolution: '20 m', 
    usage: 'Early vegetation stress detection, leaf cellular structure analysis, canopy nitrogen decline', 
    indicator: 'Vegetation Stress',
    category: 'rededge'
  },
  { 
    band: 'B08', 
    name: 'Near Infrared (NIR)', 
    wavelength: '842 nm', 
    resolution: '10 m', 
    usage: 'Mesophyll leaf scattering, biomass quantification, core channel for NDVI, NDMI, and NBR', 
    indicator: 'NDVI / NDMI / NBR',
    category: 'nir'
  },
  { 
    band: 'B11-B12', 
    name: 'Short-Wave Infrared (SWIR)', 
    wavelength: '1610–2190 nm', 
    resolution: '20 m', 
    usage: 'Canopy water absorption, leaf moisture deficit evaluation, charcoal burn scar penetration', 
    indicator: 'NDMI / NBR Critical',
    category: 'swir'
  },
];

export const SatelliteObservationsPage: React.FC<SatelliteObservationsPageProps> = ({
  fireState,
  days,
  source,
  onChangeDays,
  onChangeSource,
  onRetryFire,
  selectedLocation,
  vegetationState
}) => {
  const { data, loading } = fireState;
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [minFrp, setMinFrp] = useState<number>(0);
  const [dayNightFilter, setDayNightFilter] = useState<'ALL' | 'D' | 'N'>('ALL');
  const [selectedDetection, setSelectedDetection] = useState<FireDetectionRecord | null>(null);
  const [selectedBand, setSelectedBand] = useState<string>('B08');

  // Active sector selection
  const [activeSector, setActiveSector] = useState<GeocodingLocation>(() => {
    return selectedLocation || FOREST_SECTORS[0];
  });

  const detections = useMemo(() => data?.detections || [], [data?.detections]);

  // Filter detections based on search term, minimum FRP, and day/night status
  const filteredDetections = useMemo(() => {
    return detections.filter(d => {
      const matchesSearch = 
        !searchTerm || 
        d.acq_date.includes(searchTerm) || 
        d.satellite.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.latitude.toFixed(3).includes(searchTerm) ||
        d.longitude.toFixed(3).includes(searchTerm);
      
      const matchesFrp = (d.frp ?? 0) >= minFrp;
      const matchesDayNight = dayNightFilter === 'ALL' || d.daynight === dayNightFilter;

      return matchesSearch && matchesFrp && matchesDayNight;
    });
  }, [detections, searchTerm, minFrp, dayNightFilter]);

  const vegObservation = vegetationState?.data?.latest_observation;
  const maxFrpDetected = useMemo(() => {
    if (!detections.length) return 0;
    return Math.max(...detections.map(d => d.frp || 0));
  }, [detections]);

  const highConfidenceCount = useMemo(() => {
    return detections.filter(d => d.confidence === 'h' || (typeof d.confidence === 'number' && d.confidence >= 80)).length;
  }, [detections]);

  // Satellite and sensor status helpers
  const isFirmsConfigured = data?.is_configured ?? false;
  const isSentinelConfigured = vegetationState?.data?.is_configured ?? false;

  const ndviValue = vegObservation?.ndvi !== undefined ? vegObservation.ndvi : 0.480;
  const ndmiValue = vegObservation?.ndmi !== undefined ? vegObservation.ndmi : -0.050;
  const nbrValue = vegObservation?.nbr !== undefined ? vegObservation.nbr : 0.520;

  return (
    <div className="sat-dark-page">
      {/* 1. HERO BANNER WITH AERIAL CANOPY PHOTOGRAPH & DARK GRADIENT OVERLAY */}
      <div className="sat-dark-hero">
        <div className="sat-dark-hero-bg" />
        <div className="sat-dark-hero-overlay" />
        
        <div className="sat-dark-hero-content">
          <div className="sat-dark-hero-left">
            <div className="sat-hero-top-badge">
              <span className="sat-status-pill-subtle">
                <span className="sat-pulse-dot online" />
                COPERNICUS SENTINEL-2 MSI
              </span>
              <span className="sat-hero-category-label">
                EARTH OBSERVATION & THERMAL SENSING
              </span>
            </div>

            <h1 className="sat-dark-hero-title">
              Satellite Observations & Thermal Feeds
            </h1>

            <p className="sat-dark-hero-subtitle">
              Direct sensor downlink integration with European Space Agency (ESA) Copernicus Sentinel-2 MSI surface reflectance and NASA FIRMS VIIRS/MODIS infrared radiometer thermal anomaly detections.
            </p>

            {/* Active Forest Sector Selection Buttons */}
            <div className="sat-sector-buttons-row">
              <span className="sat-sector-label">
                <MapPin size={12} style={{ color: '#34D399' }} /> Sectors:
              </span>
              {FOREST_SECTORS.map((sector) => {
                const isActive = activeSector.name.toLowerCase().includes(sector.name.split(' ')[0].toLowerCase());
                return (
                  <button
                    key={sector.id}
                    type="button"
                    className={`sat-sector-btn ${isActive ? 'active' : ''}`}
                    onClick={() => setActiveSector(sector)}
                    title={`Focus observation coordinates on ${sector.name}`}
                  >
                    {sector.name.split(' ')[0]}
                  </button>
                );
              })}
            </div>

            {/* Monitored Sector Context Tag */}
            <div className="sat-target-sector-tag">
              <MapPin size={13} style={{ color: '#34D399' }} />
              <span>
                Target Observation Sector: <strong>{activeSector.name}</strong> ({activeSector.latitude.toFixed(4)}°N, {activeSector.longitude.toFixed(4)}°E)
              </span>
            </div>
          </div>

          <div className="sat-dark-hero-right">
            <div className="sat-hero-status-list">
              <div className="sat-status-dot-item">
                <span className={`sat-pulse-dot ${isFirmsConfigured ? 'online' : 'amber'}`} />
                <span>{isFirmsConfigured ? 'NASA FIRMS LIVE' : 'NASA FIRMS STANDBY'}</span>
              </div>

              <div className="sat-status-dot-item">
                <span className={`sat-pulse-dot ${isSentinelConfigured ? 'online' : 'standby'}`} />
                <span>{isSentinelConfigured ? 'SENTINEL-2 L2A LIVE' : 'SENTINEL-2 STANDBY'}</span>
              </div>

              <div className="sat-status-dot-item" style={{ opacity: 0.9 }}>
                <Clock size={12} style={{ color: '#34D399' }} />
                <span>LAST PASS: {vegObservation?.timestamp || 'LATEST SENTINEL TILE'}</span>
              </div>
            </div>

            <button
              type="button"
              className="sat-dark-refresh-btn"
              onClick={onRetryFire}
              disabled={loading}
              title="Query spaceborne sensors for latest orbital passes"
            >
              <RefreshCw size={13} className={loading ? 'spinner' : ''} />
              <span>Query Latest Orbital Feeds</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. SENTINEL-2 AND NASA FIRMS CARDS (DARK GLASS STYLE) */}
      <div className="sat-dark-cards-grid">
        {/* CARD 1 – COPERNICUS SENTINEL-2 MSI */}
        <div className="sat-dark-card sat-dark-card--sentinel">
          <div className="sat-dark-card-banner">
            <img src="/assets/images/sentinel_satellite.jpg" alt="Copernicus Sentinel-2 in orbit" />
            <div className="sat-dark-card-banner-overlay">
              <span className="sat-dark-banner-tag">
                <Satellite size={12} style={{ color: '#34D399' }} />
                <span>Copernicus Data Space Ecosystem</span>
              </span>
            </div>
          </div>

          <div className="sat-dark-card-body">
            <div className="sat-dark-card-header">
              <div className="sat-dark-card-title-group">
                <Satellite size={18} style={{ color: '#34D399' }} />
                <h2 className="sat-dark-card-title">Copernicus Sentinel-2 MSI</h2>
              </div>
              <span className="sat-dark-card-badge">
                10m – 20m Spatial Resolution
              </span>
            </div>

            <div className="sat-dark-metrics-grid">
              <div className="sat-dark-metric-box">
                <span className="sat-dark-metric-label">Latest Acquisition</span>
                <span className="sat-dark-metric-value" style={{ fontSize: '0.98rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Clock size={13} style={{ color: '#94A3B8' }} />
                  {vegObservation?.timestamp || 'Latest Sentinel Pass'}
                </span>
                <span className="sat-dark-metric-desc">Level-2A BOA Surface Reflectance</span>
              </div>

              <div className="sat-dark-metric-box">
                <span className="sat-dark-metric-label">Satellite Constellation</span>
                <span className="sat-dark-metric-value" style={{ fontSize: '0.98rem' }}>
                  Sentinel-2A / 2B
                </span>
                <span className="sat-dark-metric-desc">5-Day Sun-Synchronous Revisit</span>
              </div>

              <div className="sat-dark-metric-box">
                <span className="sat-dark-metric-label">Canopy NDVI Index</span>
                <span className="sat-dark-metric-value sat-val-emerald">
                  {ndviValue.toFixed(3)}
                </span>
                <span className="sat-dark-metric-desc">Photosynthetic Chlorophyll Vigor</span>
              </div>

              <div className="sat-dark-metric-box">
                <span className="sat-dark-metric-label">Canopy NDMI Moisture</span>
                <span className="sat-dark-metric-value sat-val-teal">
                  {ndmiValue.toFixed(3)}
                </span>
                <span className="sat-dark-metric-desc">Fuel Water Deficit Index</span>
              </div>
            </div>

            <div className="sat-dark-card-footer">
              <span>Provider: <strong>{vegetationState?.data?.provider || 'Copernicus Data Space Ecosystem'}</strong></span>
              <span>Processing: <strong>Orthorectified BOA</strong></span>
            </div>
          </div>
        </div>

        {/* CARD 2 – NASA FIRMS THERMAL RADIOMETERS */}
        <div className="sat-dark-card sat-dark-card--firms">
          <div className="sat-dark-card-banner">
            <img src="/assets/images/wildfire_aerial_hazard.jpg" alt="Thermal anomaly radiometer detection" />
            <div className="sat-dark-card-banner-overlay">
              <span className="sat-dark-banner-tag" style={{ border: '1px solid rgba(245, 158, 11, 0.35)' }}>
                <Flame size={12} style={{ color: '#FCD34D' }} />
                <span>NASA Earthdata FIRMS Downlink</span>
              </span>
            </div>
          </div>

          <div className="sat-dark-card-body">
            <div className="sat-dark-card-header">
              <div className="sat-dark-card-title-group">
                <Flame size={18} style={{ color: '#F59E0B' }} />
                <h2 className="sat-dark-card-title">NASA FIRMS Thermal Radiometers</h2>
              </div>
              <span className="sat-dark-card-badge">
                VIIRS 375m & MODIS 1km
              </span>
            </div>

            <div className="sat-dark-metrics-grid">
              <div className="sat-dark-metric-box">
                <span className="sat-dark-metric-label">Thermal Hotspots Detected</span>
                <span className={`sat-dark-metric-value ${detections.length > 0 ? 'sat-val-red' : 'sat-val-emerald'}`}>
                  {detections.length} <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#94A3B8' }}>hotspots</span>
                </span>
                <span className="sat-dark-metric-desc">Active infrared radiation signatures</span>
              </div>

              <div className="sat-dark-metric-box">
                <span className="sat-dark-metric-label">Temporal Window</span>
                <span className="sat-dark-metric-value" style={{ fontSize: '0.98rem' }}>
                  Past {days} Days
                </span>
                <span className="sat-dark-metric-desc">{source} Sensor Feeds</span>
              </div>

              <div className="sat-dark-metric-box">
                <span className="sat-dark-metric-label">Maximum Fire Power</span>
                <span className="sat-dark-metric-value sat-val-amber">
                  {maxFrpDetected.toFixed(1)} <span style={{ fontSize: '0.82rem' }}>MW</span>
                </span>
                <span className="sat-dark-metric-desc">Fire Radiative Power (FRP) Output</span>
              </div>

              <div className="sat-dark-metric-box">
                <span className="sat-dark-metric-label">High-Confidence Hotspots</span>
                <span className={`sat-dark-metric-value ${highConfidenceCount > 0 ? 'sat-val-red' : 'sat-val-emerald'}`}>
                  {highConfidenceCount}
                </span>
                <span className="sat-dark-metric-desc">Critical Thermal Signatures</span>
              </div>
            </div>

            <div className="sat-dark-card-footer">
              <span>Instrument: <strong>Suomi-NPP VIIRS / NOAA-20 / MODIS</strong></span>
              <span>Latency: <strong>Near Real-Time (NRT)</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. SENTINEL-2 BAND ARCHITECTURE SECTION (ORGANIZED RESPONSIVE CARD GRID) */}
      <div className="sat-dark-section">
        <div className="sat-dark-section-header">
          <div className="sat-dark-section-header-left">
            <Layers size={20} style={{ color: '#34D399' }} />
            <div>
              <h2 className="sat-dark-section-title">
                Sentinel-2 Multi-Spectral Instrument (MSI) Band Architecture
              </h2>
              <span className="sat-dark-section-subtitle">
                Multispectral channel allocation utilized for chlorophyll density, canopy water content, and burn scar severity discrimination
              </span>
            </div>
          </div>
          <span style={{ fontSize: '0.72rem', color: '#94A3B8', fontFamily: 'var(--font-mono)' }}>
            Select band to inspect spectral application
          </span>
        </div>

        {/* 6 Core Bands Responsive Grid */}
        <div className="sat-dark-band-grid">
          {SENTINEL2_BANDS.map((b) => {
            const isSelected = selectedBand === b.band;
            return (
              <div 
                key={b.band} 
                className={`sat-dark-band-card cat-${b.category} ${isSelected ? 'selected' : ''}`}
                onClick={() => setSelectedBand(b.band)}
              >
                <div className="sat-dark-band-header">
                  <span className="sat-dark-band-code">{b.band}</span>
                  <span className="sat-dark-band-res">{b.resolution} GSD</span>
                </div>

                <div className="sat-dark-band-name-row">
                  <span className="sat-dark-band-name">{b.name}</span>
                  <span className="sat-dark-band-wavelength">{b.wavelength}</span>
                </div>

                <p className="sat-dark-band-desc">{b.usage}</p>

                <div className="sat-dark-band-footer">
                  <span className={`sat-dark-band-pill sat-pill-${
                    b.indicator.includes('NDVI') ? 'ndvi' : 
                    b.indicator.includes('NDMI') ? 'ndmi' : 
                    b.indicator.includes('NBR') ? 'nbr' : 'optical'
                  }`}>
                    {b.indicator}
                  </span>
                  <ChevronRight size={14} style={{ color: isSelected ? '#34D399' : '#64748B' }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Mathematical Spectral Indices Breakdown Box */}
        <div className="sat-dark-formula-box">
          <div className="sat-dark-formula-item">
            <div className="sat-dark-formula-title">Canopy Health (NDVI)</div>
            <div className="sat-dark-formula-math">NDVI = (B08 - B04) / (B08 + B04)</div>
            <div className="sat-dark-formula-desc">
              Near-Infrared (B08) mesophyll scattering normalized against Red (B04) chlorophyll absorption. High values (&gt;0.45) denote dense, healthy forest canopy.
            </div>
          </div>

          <div className="sat-dark-formula-item">
            <div className="sat-dark-formula-title">Vegetation Moisture (NDMI)</div>
            <div className="sat-dark-formula-math">NDMI = (B08 - B11) / (B08 + B11)</div>
            <div className="sat-dark-formula-desc">
              Quantifies internal leaf fuel moisture using SWIR-1 (B11) liquid water absorption. Negative values indicate severe canopy moisture deficits and ignition risk.
            </div>
          </div>

          <div className="sat-dark-formula-item">
            <div className="sat-dark-formula-title">Burn Severity (NBR)</div>
            <div className="sat-dark-formula-math">NBR = (B08 - B12) / (B08 + B12)</div>
            <div className="sat-dark-formula-desc">
              Exploits charcoal/ash absorption in SWIR-2 (B12) against living NIR (B08) canopy to delineate post-fire perimeter burn severity and canopy scarring.
            </div>
          </div>
        </div>
      </div>

      {/* 4. FOREST INTELLIGENCE SNAPSHOTS (6 DARK GLASS CARDS) */}
      <div className="sat-dark-section">
        <div className="sat-dark-section-header">
          <div className="sat-dark-section-header-left">
            <Activity size={20} style={{ color: '#34D399' }} />
            <div>
              <h2 className="sat-dark-section-title">
                FOREST INTELLIGENCE SNAPSHOTS
              </h2>
              <span className="sat-dark-section-subtitle">
                Core satellite-derived remote sensing indices calibrated for proactive wildfire risk and canopy ecological health
              </span>
            </div>
          </div>
          <span style={{ fontSize: '0.72rem', color: '#34D399', fontFamily: 'var(--font-mono)' }}>
            6 SATELLITE METRICS
          </span>
        </div>

        <div className="sat-dark-snapshots-grid">
          {/* 1. Canopy Health – NDVI */}
          <div className="sat-dark-snapshot-card">
            <div className="sat-dark-snapshot-thumb">
              <img src="/assets/images/canopy_aerial.jpg" alt="Dense forest canopy" />
              <div className="sat-dark-snapshot-thumb-overlay">
                <span className="sat-dark-snapshot-index">01 • NDVI</span>
                <span className="sat-dark-snapshot-val-pill">{ndviValue.toFixed(3)}</span>
              </div>
            </div>
            <div className="sat-dark-snapshot-body">
              <h3 className="sat-dark-snapshot-title">Canopy Health – NDVI</h3>
              <p className="sat-dark-snapshot-desc">
                Normalized Difference Vegetation Index tracks photosynthetic vitality and chlorophyll density across forest sectors.
              </p>
              <div className="sat-dark-snapshot-footer">
                <span className="sat-status-pill-subtle" style={{ fontSize: '0.67rem', padding: '2px 7px' }}>
                  <span className="sat-pulse-dot online" style={{ width: '6px', height: '6px' }} />
                  <span>{ndviValue >= 0.4 ? 'Vigorous Canopy' : 'Canopy Stress'}</span>
                </span>
                <span style={{ fontSize: '0.68rem', color: '#94A3B8', fontFamily: 'var(--font-mono)' }}>10m Res</span>
              </div>
            </div>
          </div>

          {/* 2. Vegetation Moisture – NDMI */}
          <div className="sat-dark-snapshot-card">
            <div className="sat-dark-snapshot-thumb">
              <img src="/assets/images/vegetation_moisture.jpg" alt="Canopy foliage moisture" />
              <div className="sat-dark-snapshot-thumb-overlay">
                <span className="sat-dark-snapshot-index" style={{ color: '#38BDF8', borderColor: 'rgba(14, 165, 233, 0.3)' }}>02 • NDMI</span>
                <span className="sat-dark-snapshot-val-pill">{ndmiValue.toFixed(3)}</span>
              </div>
            </div>
            <div className="sat-dark-snapshot-body">
              <h3 className="sat-dark-snapshot-title">Vegetation Moisture – NDMI</h3>
              <p className="sat-dark-snapshot-desc">
                Normalized Difference Moisture Index detects canopy water stress and fuel flammability by tracking SWIR-1 liquid absorption.
              </p>
              <div className="sat-dark-snapshot-footer">
                <span className="sat-status-pill-subtle" style={{ color: '#38BDF8', background: 'rgba(14, 165, 233, 0.12)', borderColor: 'rgba(14, 165, 233, 0.3)', fontSize: '0.67rem', padding: '2px 7px' }}>
                  <span className="sat-pulse-dot" style={{ width: '6px', height: '6px', backgroundColor: '#38BDF8' }} />
                  <span>{ndmiValue < 0 ? 'Moisture Deficit' : 'Adequate Moisture'}</span>
                </span>
                <span style={{ fontSize: '0.68rem', color: '#94A3B8', fontFamily: 'var(--font-mono)' }}>20m Res</span>
              </div>
            </div>
          </div>

          {/* 3. Burn Severity – NBR */}
          <div className="sat-dark-snapshot-card">
            <div className="sat-dark-snapshot-thumb">
              <img src="/assets/images/dry_season_forest.jpg" alt="Dry season forest floor" />
              <div className="sat-dark-snapshot-thumb-overlay">
                <span className="sat-dark-snapshot-index">03 • NBR</span>
                <span className="sat-dark-snapshot-val-pill">{nbrValue >= 0 ? `+${nbrValue.toFixed(3)}` : nbrValue.toFixed(3)}</span>
              </div>
            </div>
            <div className="sat-dark-snapshot-body">
              <h3 className="sat-dark-snapshot-title">Burn Severity – NBR</h3>
              <p className="sat-dark-snapshot-desc">
                Normalized Burn Ratio identifies ash deposition, charcoal scarring, and post-fire canopy damage versus baseline biomass.
              </p>
              <div className="sat-dark-snapshot-footer">
                <span className="sat-status-pill-subtle" style={{ fontSize: '0.67rem', padding: '2px 7px' }}>
                  <span className="sat-pulse-dot online" style={{ width: '6px', height: '6px' }} />
                  <span>{nbrValue > 0.4 ? 'Unburned Baseline' : 'Disturbed / Scarred'}</span>
                </span>
                <span style={{ fontSize: '0.68rem', color: '#94A3B8', fontFamily: 'var(--font-mono)' }}>20m Res</span>
              </div>
            </div>
          </div>

          {/* 4. Thermal Anomalies – NASA FIRMS */}
          <div className="sat-dark-snapshot-card">
            <div className="sat-dark-snapshot-thumb">
              <img src="/assets/images/wildfire_aerial_hazard.jpg" alt="Active wildfire hotspot" />
              <div className="sat-dark-snapshot-thumb-overlay">
                <span className="sat-dark-snapshot-index" style={{ color: '#FCD34D', borderColor: 'rgba(245, 158, 11, 0.3)' }}>04 • THERMAL</span>
                <span className="sat-dark-snapshot-val-pill" style={{ backgroundColor: detections.length > 0 ? 'rgba(239, 68, 68, 0.65)' : 'rgba(16, 185, 129, 0.35)' }}>
                  {detections.length} Hotspots
                </span>
              </div>
            </div>
            <div className="sat-dark-snapshot-body">
              <h3 className="sat-dark-snapshot-title">Thermal Anomalies – NASA FIRMS</h3>
              <p className="sat-dark-snapshot-desc">
                Spaceborne infrared radiometers detect mid-infrared radiation emitted by active wildfire flame fronts and smoldering biomass.
              </p>
              <div className="sat-dark-snapshot-footer">
                <span className="sat-status-pill-subtle" style={{ 
                  color: detections.length > 0 ? '#FCD34D' : '#34D399', 
                  background: detections.length > 0 ? 'rgba(245, 158, 11, 0.12)' : 'rgba(16, 185, 129, 0.12)', 
                  borderColor: detections.length > 0 ? 'rgba(245, 158, 11, 0.3)' : 'rgba(16, 185, 129, 0.3)',
                  fontSize: '0.67rem', 
                  padding: '2px 7px' 
                }}>
                  <span className={`sat-pulse-dot ${detections.length > 0 ? 'amber' : 'online'}`} style={{ width: '6px', height: '6px' }} />
                  <span>{detections.length > 0 ? `${detections.length} Signatures Detected` : 'Zero Hotspots'}</span>
                </span>
                <span style={{ fontSize: '0.68rem', color: '#94A3B8', fontFamily: 'var(--font-mono)' }}>375m/1km</span>
              </div>
            </div>
          </div>

          {/* 5. Satellite Coverage – Sentinel-2 */}
          <div className="sat-dark-snapshot-card">
            <div className="sat-dark-snapshot-thumb">
              <img src="/assets/images/sentinel_satellite.jpg" alt="Sentinel-2 Constellation" />
              <div className="sat-dark-snapshot-thumb-overlay">
                <span className="sat-dark-snapshot-index">05 • COVERAGE</span>
                <span className="sat-dark-snapshot-val-pill">5-Day Revisit</span>
              </div>
            </div>
            <div className="sat-dark-snapshot-body">
              <h3 className="sat-dark-snapshot-title">Satellite Coverage – Sentinel-2</h3>
              <p className="sat-dark-snapshot-desc">
                Twin Sentinel-2A and Sentinel-2B satellites provide comprehensive 290 km swath multispectral coverage with 5-day equatorial revisit.
              </p>
              <div className="sat-dark-snapshot-footer">
                <span className="sat-status-pill-subtle" style={{ fontSize: '0.67rem', padding: '2px 7px' }}>
                  <span className="sat-pulse-dot online" style={{ width: '6px', height: '6px' }} />
                  <span>Constellation Nominal</span>
                </span>
                <span style={{ fontSize: '0.68rem', color: '#94A3B8', fontFamily: 'var(--font-mono)' }}>2A + 2B</span>
              </div>
            </div>
          </div>

          {/* 6. Observation Timeline – Multi-Week */}
          <div className="sat-dark-snapshot-card">
            <div className="sat-dark-snapshot-thumb">
              <img src="/assets/images/environmental_mist.jpg" alt="Forest environmental landscape" />
              <div className="sat-dark-snapshot-thumb-overlay">
                <span className="sat-dark-snapshot-index">06 • TIMELINE</span>
                <span className="sat-dark-snapshot-val-pill">{days}d Window</span>
              </div>
            </div>
            <div className="sat-dark-snapshot-body">
              <h3 className="sat-dark-snapshot-title">Observation Timeline – Multi-Week</h3>
              <p className="sat-dark-snapshot-desc">
                Multi-temporal observation synthesis compares current canopy metrics against seasonal phenological baselines to spot drying trends.
              </p>
              <div className="sat-dark-snapshot-footer">
                <span className="sat-status-pill-subtle" style={{ fontSize: '0.67rem', padding: '2px 7px' }}>
                  <span className="sat-pulse-dot online" style={{ width: '6px', height: '6px' }} />
                  <span>Telemetry Synced</span>
                </span>
                <span style={{ fontSize: '0.68rem', color: '#94A3B8', fontFamily: 'var(--font-mono)' }}>Temporal</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 5. ACTIVE WILDFIRE OBSERVATIONS & ANOMALY DETECTIONS LOG (DARK TABLE) */}
      <div className="sat-dark-section">
        <div className="sat-dark-section-header">
          <div className="sat-dark-section-header-left">
            <Flame size={20} style={{ color: '#F59E0B' }} />
            <div>
              <h2 className="sat-dark-section-title">
                Satellite Thermal Anomaly Detections Log ({filteredDetections.length} of {detections.length})
              </h2>
              <span className="sat-dark-section-subtitle">
                Spaceborne infrared radiometer observations and fire radiative energy telemetry across monitored coordinates
              </span>
            </div>
          </div>

          {/* Quick Filters */}
          <div className="sat-dark-filter-bar">
            {/* Search Box */}
            <div className="sat-dark-input-group">
              <Search size={14} style={{ color: '#94A3B8' }} />
              <input 
                type="text" 
                placeholder="Search date, satellite, coords..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ width: '160px' }}
              />
            </div>

            {/* Timeframe Selector */}
            <div className="sat-dark-input-group">
              <Calendar size={14} style={{ color: '#94A3B8' }} />
              <select
                value={days}
                onChange={(e) => onChangeDays(Number(e.target.value))}
              >
                <option value={1}>Past 24 Hours (1 Day)</option>
                <option value={7}>Past 7 Days</option>
                <option value={14}>Past 14 Days</option>
                <option value={30}>Past 30 Days</option>
              </select>
            </div>

            {/* Instrument Selector */}
            <div className="sat-dark-input-group">
              <select
                value={source}
                onChange={(e) => onChangeSource(e.target.value)}
              >
                <option value="VIIRS_SNPP_NRT">Suomi-NPP VIIRS (375m)</option>
                <option value="VIIRS_NOAA20_NRT">NOAA-20 VIIRS (375m)</option>
                <option value="MODIS_NRT">Terra & Aqua MODIS (1km)</option>
              </select>
            </div>

            {/* Minimum FRP Filter */}
            <div className="sat-dark-input-group">
              <SlidersHorizontal size={14} style={{ color: '#94A3B8' }} />
              <span style={{ fontSize: '0.74rem', color: '#94A3B8' }}>Min FRP:</span>
              <input
                type="number"
                min={0}
                max={500}
                value={minFrp}
                onChange={(e) => setMinFrp(Math.max(0, Number(e.target.value) || 0))}
                style={{ width: '42px', fontWeight: 700, color: '#34D399' }}
              />
              <span style={{ fontSize: '0.74rem', color: '#94A3B8' }}>MW</span>
            </div>

            {/* Day/Night Filter */}
            <div className="sat-dark-daynight-toggle">
              {(['ALL', 'D', 'N'] as const).map(dn => (
                <button
                  key={dn}
                  type="button"
                  className={`sat-dark-daynight-btn ${dayNightFilter === dn ? 'active' : ''}`}
                  onClick={() => setDayNightFilter(dn)}
                >
                  {dn === 'D' && <Sun size={12} />}
                  {dn === 'N' && <Moon size={12} />}
                  <span>{dn === 'ALL' ? 'All Hours' : dn === 'D' ? 'Day' : 'Night'}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Detections Data Table */}
        {loading ? (
          <div style={{ padding: '44px', textAlign: 'center', color: '#94A3B8', fontSize: '0.86rem' }}>
            <RefreshCw size={26} className="spinner" style={{ color: '#34D399', marginBottom: '10px' }} />
            <div>Querying NASA FIRMS spaceborne orbital archives...</div>
          </div>
        ) : filteredDetections.length > 0 ? (
          <div className="sat-dark-table-wrap">
            <table className="sat-dark-table">
              <thead>
                <tr>
                  <th>Date & Time (UTC)</th>
                  <th>Coordinates (Lat / Long)</th>
                  <th>Brightness Temp</th>
                  <th>FRP (Radiative Power)</th>
                  <th>Confidence</th>
                  <th>Satellite / Sensor</th>
                  <th>Orbit Pass</th>
                </tr>
              </thead>
              <tbody>
                {filteredDetections.map((det, idx) => {
                  const frpVal = det.frp ?? 0;
                  const isHighFrp = frpVal >= 15;
                  const isHighConf = det.confidence === 'h' || (typeof det.confidence === 'number' && det.confidence >= 80);
                  const isSelected = selectedDetection === det;

                  return (
                    <tr 
                      key={det.id || idx} 
                      onClick={() => setSelectedDetection(isSelected ? null : det)}
                      className={isSelected ? 'selected' : ''}
                    >
                      <td style={{ fontWeight: 600, color: '#FFFFFF' }}>
                        {det.acq_date} <span style={{ color: '#94A3B8', fontSize: '0.74rem', marginLeft: '4px' }}>{det.acq_time} UTC</span>
                      </td>
                      <td style={{ color: '#34D399', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                        {det.latitude.toFixed(4)}°N, {det.longitude.toFixed(4)}°E
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>
                        {det.brightness ? `${det.brightness.toFixed(1)} K` : 'N/A'}
                      </td>
                      <td>
                        <span style={{
                          fontWeight: 700,
                          color: isHighFrp ? '#F87171' : '#FCD34D',
                          fontFamily: 'var(--font-mono)'
                        }}>
                          {frpVal.toFixed(1)} MW
                        </span>
                      </td>
                      <td>
                        <span style={{
                          fontSize: '0.7rem',
                          padding: '2px 7px',
                          borderRadius: '4px',
                          fontWeight: 700,
                          backgroundColor: isHighConf ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                          color: isHighConf ? '#F87171' : '#FCD34D',
                          border: `1px solid ${isHighConf ? 'rgba(239, 68, 68, 0.35)' : 'rgba(245, 158, 11, 0.35)'}`,
                          fontFamily: 'var(--font-mono)'
                        }}>
                          {typeof det.confidence === 'string' ? (det.confidence === 'h' ? 'High' : det.confidence === 'n' ? 'Nominal' : 'Low') : `${det.confidence}%`}
                        </span>
                      </td>
                      <td style={{ color: '#CBD5E1' }}>
                        {det.satellite || det.instrument || 'VIIRS'}
                      </td>
                      <td>
                        <span style={{
                          fontSize: '0.7rem',
                          padding: '2px 7px',
                          borderRadius: '4px',
                          fontWeight: 600,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          backgroundColor: det.daynight === 'D' ? 'rgba(245, 158, 11, 0.12)' : 'rgba(14, 165, 233, 0.12)',
                          color: det.daynight === 'D' ? '#FCD34D' : '#38BDF8',
                          border: `1px solid ${det.daynight === 'D' ? 'rgba(245, 158, 11, 0.3)' : 'rgba(14, 165, 233, 0.3)'}`
                        }}>
                          {det.daynight === 'D' ? <Sun size={10} /> : <Moon size={10} />}
                          <span>{det.daynight === 'D' ? 'Daytime' : 'Nighttime'}</span>
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ padding: '38px', textAlign: 'center', color: '#94A3B8', fontSize: '0.86rem' }}>
            <CheckCircle2 size={26} style={{ color: '#34D399', marginBottom: '8px' }} />
            <div style={{ fontWeight: 700, color: '#F1F5F9' }}>No thermal anomalies detected in the selected spatial window.</div>
            <div style={{ fontSize: '0.76rem', marginTop: '4px', color: '#94A3B8' }}>
              Broaden your temporal window (e.g. 14 or 30 days) or switch radiometer instruments (VIIRS NOAA-20 / MODIS) to inspect regional thermal activity.
            </div>
          </div>
        )}

        {/* Selected Anomaly Inspector Modal / Drawer */}
        {selectedDetection && (
          <div className="sat-dark-anomaly-drawer">
            <div>
              <div className="sat-dark-anomaly-title">
                Selected Hotspot Anomaly Telemetry
              </div>
              <div className="sat-dark-anomaly-info">
                Coordinates: {selectedDetection.latitude.toFixed(5)}°N, {selectedDetection.longitude.toFixed(5)}°E &nbsp;•&nbsp; Timestamp: {selectedDetection.acq_date} {selectedDetection.acq_time} UTC &nbsp;•&nbsp; Sensor: {selectedDetection.satellite || selectedDetection.instrument}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <span style={{ fontSize: '0.8rem', color: '#CBD5E1' }}>
                Radiative Power: <strong style={{ color: '#F87171', fontFamily: 'var(--font-mono)' }}>{(selectedDetection.frp ?? 0).toFixed(1)} MW</strong>
              </span>
              <button
                type="button"
                className="sat-dark-anomaly-dismiss-btn"
                onClick={() => setSelectedDetection(null)}
              >
                Dismiss Detail
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SatelliteObservationsPage;
