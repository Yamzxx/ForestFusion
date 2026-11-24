import React, { useState } from 'react';
import { 
  Trees, 
  Flame, 
  Radio, 
  Compass, 
  Wind, 
  ChevronDown, 
  ChevronUp, 
  BookOpen, 
  Sparkles,
  Info
} from 'lucide-react';

interface KnowledgeCardItem {
  id: string;
  tag: string;
  title: string;
  subtitle: string;
  summary: string;
  image: string;
  imageAlt: string;
  icon: React.ReactNode;
  accent: 'emerald' | 'amber' | 'cyan' | 'sage';
  details: {
    heading: string;
    points: { label: string; desc: string }[];
    takeaway: string;
  };
}

const KNOWLEDGE_ITEMS: KnowledgeCardItem[] = [
  {
    id: 'forest-health',
    tag: 'SPECTRAL BIOMASS',
    title: 'Forest Health & Canopy Vigour',
    subtitle: 'NDVI, NDMI & NBR Multispectral Analysis',
    summary: 'Satellite spectral band ratios quantify photosynthetic activity, moisture stress, and burn scar severity across forest sectors.',
    image: '/assets/images/canopy_aerial.jpg',
    imageAlt: 'Western Ghats dense tropical rainforest canopy aerial view',
    icon: <Trees size={18} />,
    accent: 'emerald',
    details: {
      heading: 'Multispectral Index Reference',
      points: [
        {
          label: 'NDVI (Normalized Difference Veg. Index)',
          desc: '(NIR - Red) / (NIR + Red). Quantifies chlorophyll density. Values > 0.6 indicate dense, healthy tropical canopy.'
        },
        {
          label: 'NDMI (Normalized Difference Moisture Index)',
          desc: '(NIR - SWIR1) / (NIR + SWIR1). Evaluates internal leaf liquid water content. Negative values signal acute fuel desiccation.'
        },
        {
          label: 'NBR (Normalized Burn Ratio)',
          desc: '(NIR - SWIR2) / (NIR + SWIR2). Identifies burned surface patches and tracks long-term post-fire ecological succession.'
        }
      ],
      takeaway: 'Baseline spectral analysis enables automated detection of canopy drying weeks before wildfire susceptibility spikes.'
    }
  },
  {
    id: 'wildfire-intelligence',
    tag: 'HAZARD MODELING',
    title: 'Wildfire Risk & Platt Calibration',
    subtitle: 'Empirical Probability & Risk Thresholds',
    summary: 'Machine learning prediction models calibrated via Platt sigmoid scaling to translate raw logit outputs into true statistical probabilities.',
    image: '/assets/images/environmental_mist.jpg',
    imageAlt: 'Misty mountain forest ridge with environmental observation telemetry',
    icon: <Flame size={18} />,
    accent: 'amber',
    details: {
      heading: 'Risk Calibration & Classification Matrix',
      points: [
        {
          label: 'Low Risk (< 35%)',
          desc: 'High ambient humidity and adequate fuel moisture prevent active ember propagation. Routine forest guard monitoring.'
        },
        {
          label: 'Moderate Risk (35% – 55%)',
          desc: 'Elevated evaporative demand; leaf litter ignition possible under wind gusts. Standby for sector lookout towers.'
        },
        {
          label: 'High & Extreme Risk (> 55% / > 75%)',
          desc: 'Critical fuel desiccation and high VPD. High probability of rapid crown spread. Priority deployment of rapid response crews.'
        }
      ],
      takeaway: 'Calibration ensures that a 60% prediction corresponds to an empirical 6-out-of-10 wildfire ignition rate under matching conditions.'
    }
  },
  {
    id: 'satellite-monitoring',
    tag: 'COPERNICUS INGEST',
    title: 'Sentinel-2 & Thermal Detection',
    subtitle: 'Multispectral & VIIRS Constellation',
    summary: 'Harmonized Earth observation pipeline combining 10-meter optical surface imagery with real-time satellite thermal hotspot detection.',
    image: '/assets/images/sentinel_satellite.jpg',
    imageAlt: 'Sentinel-2 satellite observation view over dense forest reserve and river basin',
    icon: <Radio size={18} />,
    accent: 'cyan',
    details: {
      heading: 'Constellation Specifications',
      points: [
        {
          label: 'Sentinel-2 MSI (Optical)',
          desc: '13 spectral bands (10m–60m resolution) with a 5-day revisit cycle. Used for computing cloud-masked vegetation health.'
        },
        {
          label: 'NASA FIRMS VIIRS (Thermal)',
          desc: '375m spatial resolution thermal anomaly sensor capturing Fire Radiative Power (MW) and brightness temperature in Kelvin.'
        },
        {
          label: 'Atmospheric Correction',
          desc: 'L2A bottom-of-atmosphere surface reflectance processing removes aerosol backscatter and cirrus interference.'
        }
      ],
      takeaway: 'Dual-sensor synergy delivers both preventive fuel dryness monitoring and immediate verification of active ground ignitions.'
    }
  },
  {
    id: 'wildlife-conservation',
    tag: 'BIOSPHERE PRESERVATION',
    title: 'Wildlife Corridors & Habitat Protection',
    subtitle: 'Nilgiri & Western Ghats Biodiversity',
    summary: 'Safeguarding elephant migratory paths, keystone species, and contiguous old-growth sanctuaries from catastrophic fire boundary breach.',
    image: '/assets/images/elephant_forest.jpg',
    imageAlt: 'Indian wild elephant walking through dense bamboo forest in Nilgiri reserve',
    icon: <Compass size={18} />,
    accent: 'sage',
    details: {
      heading: 'Ecological Conservation Priorities',
      points: [
        {
          label: 'Elephant Corridor Preservation',
          desc: 'Bandipur–Mudumalai–Wayanad migratory pathways connect Asia’s largest wild elephant population. Wildfires fragment these vital corridors.'
        },
        {
          label: 'Endemic Biodiversity',
          desc: 'The Nilgiri Biosphere protects over 5,000 plant species and vulnerable fauna including Nilgiri Tahr, Bengal tigers, and Lion-tailed macaques.'
        },
        {
          label: 'Firebreak Management',
          desc: 'Early predictive risk maps guide selective counter-burning and controlled perimeter breaks to preserve core wildlife nesting zones.'
        }
      ],
      takeaway: 'Predictive intelligence shifts forest management from reactive suppression to proactive ecological sanctuary protection.'
    }
  },
  {
    id: 'environmental-telemetry',
    tag: 'METEOROLOGICAL TELEMETRY',
    title: 'Atmospheric Physics & Fuel Dynamics',
    subtitle: 'VPD, Relative Humidity & Microclimates',
    summary: 'Continuous meteorological tracking capturing microclimates, thermal winds, and vapor pressure deficits that govern fire behavior.',
    image: '/assets/images/spotted_deer.jpg',
    imageAlt: 'Spotted deer stag standing alert among ancient moss-covered forest trees',
    icon: <Wind size={18} />,
    accent: 'emerald',
    details: {
      heading: 'Environmental Drivers of Fire Spread',
      points: [
        {
          label: 'Relative Humidity (< 30% threshold)',
          desc: 'Low humidity rapidly extracts moisture from 1-hour dead fine fuel (grass and dried leaves), raising ignition readiness.'
        },
        {
          label: 'Vapor Pressure Deficit (VPD)',
          desc: 'The atmospheric suction force pulling moisture from living canopy trees. High VPD primes forests for explosive crown fire spread.'
        },
        {
          label: 'Valley & Ridge Wind Gusts',
          desc: 'Thermal updrafts along mountain ridges accelerate fire propagation upslope and carry burning embers kilometers ahead.'
        }
      ],
      takeaway: 'Real-time telemetry feeds the XGBoost model to continuously re-evaluate local risk as atmospheric conditions shift.'
    }
  }
];

export const KnowledgeFlashCards: React.FC = () => {
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);

  const toggleCard = (id: string) => {
    setExpandedCardId(prev => (prev === id ? null : id));
  };

  return (
    <section className="knowledge-section-card" aria-labelledby="knowledge-section-heading">
      <div className="knowledge-section-header">
        <div className="knowledge-title-group">
          <div className="knowledge-title-badge">
            <BookOpen size={16} className="knowledge-badge-icon" />
            <span>KNOWLEDGE BASE & EDUCATIONAL REFERENCE</span>
          </div>
          <h3 id="knowledge-section-heading">Forest Intelligence, Ecology & Spectral Monitoring</h3>
          <p className="knowledge-section-subtitle">
            Scientific reference modules explaining satellite vegetation indices, calibrated hazard physics, and wildlife conservation across Nilgiri and Western Ghats reserves.
          </p>
        </div>
        <div className="knowledge-mode-indicator">
          <Sparkles size={14} className="knowledge-sparkle-icon" />
          <span>Interactive Reference Guide</span>
        </div>
      </div>

      <div className="knowledge-cards-grid">
        {KNOWLEDGE_ITEMS.map((item) => {
          const isExpanded = expandedCardId === item.id;
          return (
            <article 
              key={item.id} 
              className={`knowledge-card ${isExpanded ? 'expanded' : ''} accent-${item.accent}`}
            >
              {/* Card Image Thumbnail Header with Subtle Vignette */}
              <div className="knowledge-card-image-wrap">
                <img 
                  src={item.image} 
                  alt={item.imageAlt}
                  className="knowledge-card-image"
                  loading="lazy"
                />
                <div className="knowledge-image-overlay" />
                <div className="knowledge-tag-pill">
                  {item.icon}
                  <span>{item.tag}</span>
                </div>
              </div>

              {/* Card Main Body */}
              <div className="knowledge-card-body">
                <h4 className="knowledge-card-title">{item.title}</h4>
                <div className="knowledge-card-subtitle">{item.subtitle}</div>
                <p className="knowledge-card-summary">{item.summary}</p>

                {/* Expandable Scientific Details */}
                {isExpanded && (
                  <div className="knowledge-expanded-panel">
                    <div className="knowledge-detail-heading">
                      <Info size={14} />
                      <span>{item.details.heading}</span>
                    </div>
                    <ul className="knowledge-points-list">
                      {item.details.points.map((pt, idx) => (
                        <li key={idx} className="knowledge-point-item">
                          <span className="knowledge-point-label">{pt.label}:</span>
                          <span className="knowledge-point-desc"> {pt.desc}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="knowledge-takeaway-box">
                      <strong className="takeaway-tag">KEY INSIGHT:</strong> {item.details.takeaway}
                    </div>
                  </div>
                )}

                {/* Interactive Action Button */}
                <div className="knowledge-card-footer">
                  <button
                    type="button"
                    className="knowledge-toggle-btn"
                    onClick={() => toggleCard(item.id)}
                    aria-expanded={isExpanded}
                    aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${item.title}`}
                  >
                    <span>{isExpanded ? 'Hide Technical Details' : 'Explore Scientific Details'}</span>
                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
};
