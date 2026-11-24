import React, { useState, useMemo } from 'react';
import { 
  RotateCw, 
  ChevronLeft, 
  ChevronRight, 
  Bookmark, 
  BookmarkCheck, 
  Shuffle, 
  CheckCircle2
} from 'lucide-react';

export type FlashcardTopic = 
  | 'ALL'
  | 'Wildfire Behavior'
  | 'Fire Weather'
  | 'Spectral Remote Sensing'
  | 'Machine Learning'
  | 'Conservation & Disaster Management';

export type DifficultyLevel = 'Foundational' | 'Advanced' | 'Research-Grade';

export interface Flashcard {
  id: number;
  topic: FlashcardTopic;
  difficulty: DifficultyLevel;
  conceptPrompt: string;
  frontContext: string;
  scientificAnswer: string;
  keyEquationOrTakeaway: string;
  fieldApplication: string;
  citation: string;
}

export const FLASHCARDS_DATA: Flashcard[] = [
  {
    id: 1,
    topic: 'Wildfire Behavior',
    difficulty: 'Advanced',
    conceptPrompt: 'What distinguishes Plume-Dominated (Pyroconvective) fire behavior from Wind-Driven spread?',
    frontContext: 'Coupled atmospheric interactions and boundary-layer convective energetics in extreme wildfire events.',
    scientificAnswer: 'Plume-dominated fires develop when convective heat energy from combustion overwhelms prevailing ambient winds. The towering convective column draws air inward from all radial azimuths, creating violent localized updrafts, pyrocumulonimbus (PyroCb) cloud formation, and erratic short-to-long-range firebrand spotting (ember showers) up to 5-10 km ahead of the flaming front.',
    keyEquationOrTakeaway: 'Byram Convective Number (Nc) > 1 indicates buoyant convection dominates kinetic wind energy: Nc = (2 * g * I) / (c_p * ρ * T_0 * (U - r)^3)',
    fieldApplication: 'Traditional perimeter containment tactics fail; firefighting incident commanders must establish wide secondary defensive lines and prioritize aerial suppression along spotting corridors.',
    citation: 'Byram (1959); Potter, B. E. (2012) "Atmospheric properties associated with large fires."'
  },
  {
    id: 2,
    topic: 'Fire Weather',
    difficulty: 'Foundational',
    conceptPrompt: 'How does Vapor Pressure Deficit (VPD) relate to 1-Hour and 10-Hour Fine Dead Fuel Moisture (FDFM)?',
    frontContext: 'Atmospheric evaporative demand and thermodynamic equilibrium moisture content (EMC) in forest litter.',
    scientificAnswer: 'VPD measures the difference between saturation vapor pressure (e_s) and actual vapor pressure (e_a). As air temperature rises and relative humidity drops, VPD surges exponentially. Fine dead fuels (leaf litter, twigs < 6mm) equilibrate with atmospheric moisture within 1 to 10 hours. High VPD (> 2.0 kPa) rapidly desorbs moisture from fine fuels down to critical thresholds (< 8%), where ignition readiness approaches 100%.',
    keyEquationOrTakeaway: 'VPD = e_s(T) * (1 - RH / 100), where e_s(T) = 0.61078 * exp(17.27 * T / (T + 237.3)) kPa',
    fieldApplication: 'Operational crews use real-time VPD alerts from Open-Meteo telemetry to predict peak afternoon ignition vulnerability 4-6 hours in advance.',
    citation: 'Williams et al. (2019) PNAS; Fosberg Fire Weather Index standards.'
  },
  {
    id: 3,
    topic: 'Spectral Remote Sensing',
    difficulty: 'Foundational',
    conceptPrompt: 'What optical reflectance mechanics explain the Normalized Difference Vegetation Index (NDVI)?',
    frontContext: 'Mesophyll cellular scattering in near-infrared vs. chlorophyll-a absorption in the red electromagnetic spectrum.',
    scientificAnswer: 'Healthy green vegetation absorbs strongly in the red wavelength (660-680 nm, Sentinel-2 Band 4) due to photosynthetic pigments (chlorophyll a and b), while reflecting up to 50-60% of near-infrared radiation (842 nm, Sentinel-2 Band 8) due to refractive index mismatches in spongy mesophyll cells. NDVI contrasts this sharp "red edge" reflectance difference.',
    keyEquationOrTakeaway: 'NDVI = (ρ_NIR - ρ_Red) / (ρ_NIR + ρ_Red) = (Band 8 - Band 4) / (Band 8 + Band 4)',
    fieldApplication: 'Values > 0.6 indicate vigorous dense canopy with high moisture buffer; values dropping below 0.4 indicate acute vegetation stress, defoliation, or curing.',
    citation: 'Rouse et al. (1974) NASA SP-351; ESA Sentinel-2 MSI L2A Technical Guide.'
  },
  {
    id: 4,
    topic: 'Spectral Remote Sensing',
    difficulty: 'Advanced',
    conceptPrompt: 'Why is NDMI (Normalized Difference Moisture Index) superior to NDVI for early canopy drought detection?',
    frontContext: 'Liquid water absorption bands in the short-wave infrared (SWIR-1) vs. structural chlorophyll persistence.',
    scientificAnswer: 'Chlorophyll degradation (tracked by NDVI) lags water deficit by several days to weeks because leaves retain pigmentation after initial turgor loss. NDMI pairs the NIR band (842 nm) with SWIR-1 (1610 nm, Band 11), a spectral region with strong liquid water molecular absorption. As leaf spongy mesophyll loses water, SWIR reflectance increases immediately, causing NDMI to drop well before visible leaf discoloration occurs.',
    keyEquationOrTakeaway: 'NDMI = (ρ_NIR - ρ_SWIR1) / (ρ_NIR + ρ_SWIR1) = (Band 8 - Band 11) / (Band 8 + Band 11)',
    fieldApplication: 'Negative NDMI values (< 0.0) identify desiccated forest sectors requiring pre-emptive patrol deployment before fire season peaks.',
    citation: 'Gao, B. C. (1996) Remote Sensing of Environment; Ceccato et al. (2001).'
  },
  {
    id: 5,
    topic: 'Spectral Remote Sensing',
    difficulty: 'Research-Grade',
    conceptPrompt: 'How does the Normalized Burn Ratio (NBR) and differenced dNBR quantify post-fire burn severity?',
    frontContext: 'Post-fire ash/charcoal spectral signatures in SWIR-2 (2190 nm) compared with unburned green canopy NIR.',
    scientificAnswer: 'Active combustion removes photosynthetic canopy (collapsing NIR reflectance at Band 8) and deposits black ash, charcoal, and exposed dry soil (which reflect strongly in SWIR-2 at 2190 nm, Band 12). Differenced NBR (dNBR = pre-fire NBR - post-fire NBR) separates unburned land from low, moderate, and high burn severity zones with standardized USGS thresholds.',
    keyEquationOrTakeaway: 'NBR = (Band 8 - Band 12) / (Band 8 + Band 12); dNBR = NBR_prefire - NBR_postfire * 1000',
    fieldApplication: 'USGS/USFS Burned Area Emergency Response (BAER) teams use dNBR to delineate high-erosion watersheds and prioritize emergency soil stabilization.',
    citation: 'Key & Benson (2006) FIREMON Landscape Assessment; USGS Burn Severity Mapping Guidelines.'
  },
  {
    id: 6,
    topic: 'Spectral Remote Sensing',
    difficulty: 'Advanced',
    conceptPrompt: 'What sensor capabilities give Sentinel-2 MSI a tactical advantage over MODIS for localized forest intelligence?',
    frontContext: 'Spatial, temporal, and radiometric resolution tradeoffs in orbital Earth observation architectures.',
    scientificAnswer: 'Copernicus Sentinel-2 consists of twin satellites (2A and 2B) providing a 5-day revisit at the equator and 2-3 days at mid-latitudes, capturing surface reflectance at 10m (VNIR) and 20m (red edge, SWIR) spatial resolution with 12-bit radiometric depth. In contrast, MODIS optical channels operate at 250m-1000m resolution, blending small forest compartments, ravines, and firebreaks into mixed pixels.',
    keyEquationOrTakeaway: 'Spatial Resolving Power: Sentinel-2 100 m² (0.01 ha) per pixel vs. MODIS 62,500 m² (6.25 ha) per pixel (625x spatial detail advantage).',
    fieldApplication: 'Sentinel-2 allows forest range officers to inspect individual fireline boundaries, riparian buffer strips, and localized canopy clearing.',
    citation: 'Drusch et al. (2012) "Sentinel-2: ESA\'s Optical High-Resolution Mission for GMES Operational Services."'
  },
  {
    id: 7,
    topic: 'Wildfire Behavior',
    difficulty: 'Advanced',
    conceptPrompt: 'What is Fire Radiative Power (FRP) and how is it quantified by NASA FIRMS VIIRS & MODIS instruments?',
    frontContext: 'Mid-infrared Planck blackbody emission and quantitative biomass combustion rate estimation.',
    scientificAnswer: 'FRP measures the instantaneous radiant energy output of an active fire in Megawatts (MW). Spaceborne sensors measure thermal radiance in the 3.9 µm mid-wave infrared (MWIR) channel, where thermal emission from flaming combustion (800-1200 K) peaks relative to the cooler ambient Earth background (300 K). FRP scales linearly with fuel consumption rate (kg of biomass burned per second).',
    keyEquationOrTakeaway: 'FRP = (A_pix * σ) / a * (L_4 - L_4b) MW, where L_4 is 4µm fire radiance and L_4b is background radiance',
    fieldApplication: 'FIRMS hotspots with FRP > 20 MW signify intense active flaming fires requiring rapid tanker intervention, whereas FRP < 5 MW typically represents low-intensity understory burns or residual smoldering.',
    citation: 'Wooster et al. (2003) Remote Sensing of Environment; Schroeder et al. (2014) VIIRS 375m NRT active fire product.'
  },
  {
    id: 8,
    topic: 'Machine Learning',
    difficulty: 'Research-Grade',
    conceptPrompt: 'Why does XGBoost (Extreme Gradient Boosting) excel in geospatial wildfire hazard modeling?',
    frontContext: 'Nonlinear feature interactions, missing telemetry tolerance, and second-order Taylor expansion tree splitting.',
    scientificAnswer: 'XGBoost fits additive decision trees sequentially to minimize a regularized objective function using exact first (gradient g_i) and second-order (Hessian h_i) Taylor approximations. It natively handles non-linear interactions between weather variables (e.g. wind velocity amplifying high temperature), respects geographic bounds without normalization, incorporates L1/L2 regularization to prevent overfitting on sparse fire events, and uses a default split-direction for missing satellite pixels.',
    keyEquationOrTakeaway: 'Objective: Obj^(t) = Σ [ g_i * f_t(x_i) + 0.5 * h_i * f_t(x_i)^2 ] + γ * T + 0.5 * λ * Σ w_j^2',
    fieldApplication: 'Delivers high ROC-AUC and fast sub-millisecond inference times suitable for operational real-time dashboard updates across thousands of grid sectors.',
    citation: 'Chen, T., & Guestrin, C. (2016) "XGBoost: A Scalable Tree Boosting System." KDD \'16.'
  },
  {
    id: 9,
    topic: 'Machine Learning',
    difficulty: 'Research-Grade',
    conceptPrompt: 'Why is Platt Sigmoid Scaling mathematically essential before operational decision-support deployment?',
    frontContext: 'Margin distortion, cross-entropy calibration, and posterior probability validity in tree ensembles.',
    scientificAnswer: 'Raw outputs from tree ensembles like XGBoost represent uncalibrated margin log-odds or softmax proportions. Tree splits near boundaries push predicted probabilities toward 0 or 1, distorting the empirical risk distribution. Platt calibration fits a univariate logistic regression on held-out validation margins to map scores to empirical probabilities. This ensures that when the platform issues a 70% hazard warning, approximately 70% of historical cases under matching conditions resulted in fire.',
    keyEquationOrTakeaway: 'P(Y=1 | f) = 1 / (1 + exp(A * f + B)), where parameters A and B are estimated by minimizing negative log-likelihood on cross-validation folds.',
    fieldApplication: 'Prevents "alarm fatigue" among disaster management teams by maintaining strict calibration consistency with empirical field observation records.',
    citation: 'Platt, J. (1999) "Probabilistic Outputs for Support Vector Machines"; Niculescu-Mizil & Caruana (2005) ICML.'
  },
  {
    id: 10,
    topic: 'Conservation & Disaster Management',
    difficulty: 'Advanced',
    conceptPrompt: 'What ecological considerations govern fire management in the Western Ghats Nilgiri Biosphere?',
    frontContext: 'Moist deciduous, montane shola-grassland mosaics, and wildlife migration corridors.',
    scientificAnswer: 'The Western Ghats harbor fragile ecotones where wet evergreen forests, moist deciduous woodlands, and high-altitude shola grasslands intersect. Wildfires during dry months (February-May) eradicate native bamboo (Bambusa bambos), trigger the rapid expansion of invasive alien plants (Lantana camara and Senna spectabilis), and fragment keystone elephant and tiger migratory corridors. Modern management balances prescribed counter-burning along perimeter fire lines with complete suppression in core national park sectors.',
    keyEquationOrTakeaway: 'Ecological Resilience Principle: Core climax evergreen forests have zero evolutionary fire adaptation; single intense fires cause irreversible canopy loss and moisture microclimate collapse.',
    fieldApplication: 'Prioritize resource allocation (drones, fire watchers, tanker routes) in buffer boundaries adjacent to tribal settlements and highway edges to prevent ignition migration into core biosphere zones.',
    citation: 'Kodandapani et al. (2004) "Conservation Biology"; Puyravaud et al. (2010) Environmental Monitoring and Assessment.'
  }
];

export const ForestKnowledgePage: React.FC = () => {
  const [activeTopic, setActiveTopic] = useState<FlashcardTopic>('ALL');
  const [activeDifficulty, setActiveDifficulty] = useState<'ALL' | DifficultyLevel>('ALL');
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [bookmarkedIds, setBookmarkedIds] = useState<number[]>([1, 4, 9]);
  const [showBookmarksOnly, setShowBookmarksOnly] = useState<boolean>(false);

  // Filtered cards list
  const filteredCards = useMemo(() => {
    return FLASHCARDS_DATA.filter(card => {
      const matchesTopic = activeTopic === 'ALL' || card.topic === activeTopic;
      const matchesDifficulty = activeDifficulty === 'ALL' || card.difficulty === activeDifficulty;
      const matchesBookmark = !showBookmarksOnly || bookmarkedIds.includes(card.id);
      return matchesTopic && matchesDifficulty && matchesBookmark;
    });
  }, [activeTopic, activeDifficulty, showBookmarksOnly, bookmarkedIds]);

  // Safe active card index
  const safeIdx = currentIdx < filteredCards.length ? currentIdx : 0;
  const currentCard = filteredCards[safeIdx];

  const handleNext = () => {
    setIsFlipped(false);
    if (safeIdx < filteredCards.length - 1) {
      setCurrentIdx(safeIdx + 1);
    } else {
      setCurrentIdx(0); // Loop to start
    }
  };

  const handlePrev = () => {
    setIsFlipped(false);
    if (safeIdx > 0) {
      setCurrentIdx(safeIdx - 1);
    } else {
      setCurrentIdx(filteredCards.length - 1); // Loop to end
    }
  };

  const handleShuffle = () => {
    setIsFlipped(false);
    const randomIdx = Math.floor(Math.random() * filteredCards.length);
    setCurrentIdx(randomIdx);
  };

  const toggleBookmark = (id: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setBookmarkedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const getDifficultyColor = (diff: DifficultyLevel) => {
    switch (diff) {
      case 'Foundational':
        return { bg: '#EBF3EF', text: '#17452F', border: '#C2DBCD' };
      case 'Advanced':
        return { bg: '#F0F9FF', text: '#0284C7', border: '#BAE6FD' };
      case 'Research-Grade':
        return { bg: '#FFFBEB', text: '#C25E00', border: '#FDE68A' };
    }
  };

  const TOPICS: FlashcardTopic[] = [
    'ALL',
    'Wildfire Behavior',
    'Fire Weather',
    'Spectral Remote Sensing',
    'Machine Learning',
    'Conservation & Disaster Management'
  ];

  return (
    <div className="page-container forest-knowledge-page">
      {/* 1. Official Government Environmental Portal Header */}
      <div 
        style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid var(--border-color)',
          borderTop: '4px solid #17452F',
          borderRadius: '4px',
          padding: '24px',
          marginBottom: '20px',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ maxWidth: '750px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#17452F', backgroundColor: '#EBF3EF', padding: '3px 8px', borderRadius: '4px' }}>
                Field Intelligence &amp; Research Suite
              </span>
              <span style={{ fontSize: '0.74rem', color: '#55635C' }}>
                Scientific Reference Platform
              </span>
            </div>

            <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#17452F', margin: '0 0 8px 0', letterSpacing: '-0.01em' }}>
              Forest Knowledge &amp; Geospatial Physics Flashcards
            </h1>
            <p style={{ fontSize: '0.86rem', color: '#55635C', lineHeight: 1.5, margin: 0 }}>
              Curated technical reference flashcards for environmental researchers, geospatial analysts, and forest incident commanders covering fire weather thermodynamics, Sentinel-2 spectral physics, Platt calibration mathematics, and Western Ghats conservation ecology.
            </p>
          </div>

          {/* Quick Stats Pill */}
          <div style={{
            display: 'flex',
            gap: '12px',
            backgroundColor: '#F8FAF9',
            padding: '10px 16px',
            borderRadius: '4px',
            border: '1px solid #D5DDD8'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#17452F', fontFamily: 'monospace' }}>
                {FLASHCARDS_DATA.length}
              </div>
              <div style={{ fontSize: '0.68rem', color: '#55635C', textTransform: 'uppercase', fontWeight: 600 }}>
                Total Cards
              </div>
            </div>
            <div style={{ width: '1px', backgroundColor: '#D5DDD8' }} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#C25E00', fontFamily: 'monospace' }}>
                {bookmarkedIds.length}
              </div>
              <div style={{ fontSize: '0.68rem', color: '#55635C', textTransform: 'uppercase', fontWeight: 600 }}>
                Saved
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Topic Filter Chips & Difficulty Controls */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px',
        backgroundColor: '#FFFFFF',
        padding: '14px 18px',
        borderRadius: '4px',
        border: '1px solid var(--border-color)',
        marginBottom: '20px',
        boxShadow: 'var(--shadow-sm)'
      }}>
        {/* Topic Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.74rem', color: '#55635C', fontWeight: 700, textTransform: 'uppercase', marginRight: '4px' }}>
            Topic:
          </span>
          {TOPICS.map((topic) => {
            const isActive = activeTopic === topic;
            return (
              <button
                key={topic}
                type="button"
                onClick={() => { setActiveTopic(topic); setCurrentIdx(0); setIsFlipped(false); }}
                style={{
                  backgroundColor: isActive ? '#17452F' : '#F8FAF9',
                  color: isActive ? '#FFFFFF' : '#55635C',
                  border: `1px solid ${isActive ? '#17452F' : '#D5DDD8'}`,
                  borderRadius: '4px',
                  padding: '5px 12px',
                  fontSize: '0.74rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {topic}
              </button>
            );
          })}
        </div>

        {/* Difficulty & Bookmark Toggles */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Difficulty Dropdown */}
          <select
            value={activeDifficulty}
            onChange={(e) => { setActiveDifficulty(e.target.value as any); setCurrentIdx(0); setIsFlipped(false); }}
            style={{
              backgroundColor: '#FFFFFF',
              color: '#252B28',
              border: '1px solid #D5DDD8',
              borderRadius: '4px',
              padding: '6px 12px',
              fontSize: '0.74rem',
              fontWeight: 600
            }}
          >
            <option value="ALL">All Difficulties</option>
            <option value="Foundational">Foundational</option>
            <option value="Advanced">Advanced</option>
            <option value="Research-Grade">Research-Grade</option>
          </select>

          {/* Bookmarks Only Toggle */}
          <button
            type="button"
            onClick={() => { setShowBookmarksOnly(!showBookmarksOnly); setCurrentIdx(0); setIsFlipped(false); }}
            style={{
              backgroundColor: showBookmarksOnly ? '#FFFBEB' : '#FFFFFF',
              color: showBookmarksOnly ? '#92400E' : '#55635C',
              border: `1px solid ${showBookmarksOnly ? '#FDE68A' : '#D5DDD8'}`,
              borderRadius: '4px',
              padding: '6px 12px',
              fontSize: '0.74rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Bookmark size={13} style={{ color: showBookmarksOnly ? '#C25E00' : '#55635C' }} />
            <span>Saved ({bookmarkedIds.length})</span>
          </button>
        </div>
      </div>

      {/* 3. Interactive 3D Flashcard Presentation Area */}
      {filteredCards.length > 0 && currentCard ? (
        <div style={{ maxWidth: '820px', margin: '0 auto' }}>
          {/* Progress Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.78rem', color: '#55635C', fontWeight: 600 }}>
              Card <strong style={{ color: '#17452F' }}>{safeIdx + 1}</strong> of <strong style={{ color: '#17452F' }}>{filteredCards.length}</strong>
            </span>

            {/* Visual Progress Bar */}
            <div style={{ width: '240px', height: '6px', backgroundColor: '#E2E8F0', borderRadius: '3px', overflow: 'hidden' }}>
              <div 
                style={{
                  width: `${((safeIdx + 1) / filteredCards.length) * 100}%`,
                  height: '100%',
                  backgroundColor: '#17452F',
                  transition: 'width 0.25s ease'
                }}
              />
            </div>

            <span style={{ fontSize: '0.74rem', color: '#17452F', fontWeight: 600 }}>
              {isFlipped ? 'Answer Revealed' : 'Click Card to Reveal'}
            </span>
          </div>

          {/* 3D Flip Card Container */}
          <div 
            onClick={() => setIsFlipped(!isFlipped)}
            style={{
              perspective: '1200px',
              cursor: 'pointer',
              marginBottom: '20px'
            }}
          >
            <div 
              style={{
                position: 'relative',
                width: '100%',
                minHeight: '380px',
                transformStyle: 'preserve-3d',
                transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
              }}
            >
              {/* === FRONT OF CARD === */}
              <div 
                style={{
                  position: 'absolute',
                  inset: 0,
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                  backgroundColor: '#FFFFFF',
                  border: '1.5px solid #D5DDD8',
                  borderRadius: '4px',
                  padding: '30px',
                  boxShadow: 'var(--shadow-sm)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  {/* Top Bar of Front */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        fontSize: '0.7rem',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        padding: '3px 8px',
                        borderRadius: '3px',
                        backgroundColor: '#EBF3EF',
                        color: '#17452F',
                        border: '1px solid #C2DBCD'
                      }}>
                        {currentCard.topic}
                      </span>

                      {(() => {
                        const style = getDifficultyColor(currentCard.difficulty);
                        return (
                          <span style={{
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: '3px',
                            backgroundColor: style.bg,
                            color: style.text,
                            border: `1px solid ${style.border}`
                          }}>
                            {currentCard.difficulty}
                          </span>
                        );
                      })()}
                    </div>

                    <button
                      type="button"
                      onClick={(e) => toggleBookmark(currentCard.id, e)}
                      style={{
                        backgroundColor: 'transparent',
                        border: 'none',
                        color: bookmarkedIds.includes(currentCard.id) ? '#C25E00' : '#55635C',
                        cursor: 'pointer',
                        padding: '4px'
                      }}
                      title={bookmarkedIds.includes(currentCard.id) ? "Remove bookmark" : "Bookmark card"}
                    >
                      {bookmarkedIds.includes(currentCard.id) ? (
                        <BookmarkCheck size={20} />
                      ) : (
                        <Bookmark size={20} />
                      )}
                    </button>
                  </div>

                  {/* Scientific Prompt Question */}
                  <div style={{ marginTop: '24px', marginBottom: '16px' }}>
                    <div style={{ fontSize: '0.74rem', color: '#17452F', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>
                      Core Concept Evaluation:
                    </div>
                    <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#17452F', lineHeight: 1.4, margin: 0 }}>
                      {currentCard.conceptPrompt}
                    </h3>
                  </div>

                  {/* Context Note */}
                  <p style={{ fontSize: '0.86rem', color: '#55635C', lineHeight: 1.6, margin: '14px 0 0 0' }}>
                    {currentCard.frontContext}
                  </p>
                </div>

                {/* Bottom Callout */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingTop: '16px',
                  borderTop: '1px solid #E2E8F0',
                  marginTop: '24px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.76rem', color: '#17452F', fontWeight: 600 }}>
                    <RotateCw size={13} />
                    <span>Click anywhere to flip and inspect the scientific derivation</span>
                  </div>
                  <span style={{ fontSize: '0.72rem', color: '#55635C' }}>
                    ID #{currentCard.id}
                  </span>
                </div>
              </div>

              {/* === BACK OF CARD === */}
              <div 
                style={{
                  position: 'absolute',
                  inset: 0,
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                  backgroundColor: '#F8FAF9',
                  border: '1.5px solid #17452F',
                  borderRadius: '4px',
                  padding: '30px',
                  boxShadow: 'var(--shadow-sm)',
                  transform: 'rotateY(180deg)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  {/* Top Bar of Back */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        fontSize: '0.7rem',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        padding: '3px 8px',
                        borderRadius: '3px',
                        backgroundColor: '#EBF3EF',
                        color: '#17452F',
                        border: '1px solid #C2DBCD'
                      }}>
                        Scientific Derivation &amp; Answer
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => toggleBookmark(currentCard.id, e)}
                      style={{
                        backgroundColor: 'transparent',
                        border: 'none',
                        color: bookmarkedIds.includes(currentCard.id) ? '#C25E00' : '#55635C',
                        cursor: 'pointer',
                        padding: '4px'
                      }}
                    >
                      {bookmarkedIds.includes(currentCard.id) ? (
                        <BookmarkCheck size={20} />
                      ) : (
                        <Bookmark size={20} />
                      )}
                    </button>
                  </div>

                  {/* Answer Text */}
                  <p style={{ fontSize: '0.86rem', color: '#252B28', lineHeight: 1.6, margin: '0 0 14px 0' }}>
                    {currentCard.scientificAnswer}
                  </p>

                  {/* Mathematical Formulation / Law Box */}
                  <div style={{
                    backgroundColor: '#EBF3EF',
                    border: '1px solid #C2DBCD',
                    borderRadius: '4px',
                    padding: '10px 14px',
                    marginBottom: '12px'
                  }}>
                    <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#17452F', textTransform: 'uppercase', marginBottom: '2px' }}>
                      Key Equation / Core Law:
                    </div>
                    <div style={{ fontSize: '0.80rem', color: '#17452F', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                      {currentCard.keyEquationOrTakeaway}
                    </div>
                  </div>

                  {/* Operational Field Application */}
                  <div style={{ fontSize: '0.78rem', color: '#55635C', lineHeight: 1.45 }}>
                    <strong style={{ color: '#252B28' }}>Operational Application:</strong> {currentCard.fieldApplication}
                  </div>
                </div>

                {/* Citation & Flip Button */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingTop: '12px',
                  borderTop: '1px solid #E2E8F0',
                  marginTop: '16px'
                }}>
                  <span style={{ fontSize: '0.70rem', color: '#55635C', fontStyle: 'italic' }}>
                    Ref: {currentCard.citation}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.74rem', color: '#17452F', fontWeight: 600 }}>
                    <RotateCw size={12} />
                    <span>Click to flip back</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation & Action Controls */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '14px', marginTop: '16px' }}>
            <button
              type="button"
              onClick={handlePrev}
              style={{
                backgroundColor: '#FFFFFF',
                color: '#252B28',
                border: '1px solid #D5DDD8',
                borderRadius: '4px',
                padding: '9px 16px',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.15s ease'
              }}
            >
              <ChevronLeft size={16} />
              <span>Previous</span>
            </button>

            <button
              type="button"
              onClick={() => setIsFlipped(!isFlipped)}
              style={{
                backgroundColor: '#17452F',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '4px',
                padding: '9px 22px',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              <RotateCw size={14} />
              <span>{isFlipped ? 'Flip to Concept' : 'Reveal Answer'}</span>
            </button>

            <button
              type="button"
              onClick={handleNext}
              style={{
                backgroundColor: '#FFFFFF',
                color: '#252B28',
                border: '1px solid #D5DDD8',
                borderRadius: '4px',
                padding: '9px 16px',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.15s ease'
              }}
            >
              <span>Next</span>
              <ChevronRight size={16} />
            </button>

            <button
              type="button"
              onClick={handleShuffle}
              style={{
                backgroundColor: '#F8FAF9',
                color: '#55635C',
                border: '1px solid #D5DDD8',
                borderRadius: '4px',
                padding: '9px 14px',
                fontSize: '0.82rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
              title="Shuffle cards randomly"
            >
              <Shuffle size={14} />
              <span>Shuffle</span>
            </button>
          </div>
        </div>
      ) : (
        <div style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid var(--border-color)',
          borderRadius: '4px',
          padding: '40px',
          textAlign: 'center',
          maxWidth: '600px',
          margin: '40px auto',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <CheckCircle2 size={32} style={{ color: '#17452F', marginBottom: '12px' }} />
          <h4 style={{ fontSize: '1.1rem', color: '#17452F', margin: '0 0 8px 0' }}>
            No Flashcards Found For Active Filters
          </h4>
          <p style={{ fontSize: '0.82rem', color: '#55635C', margin: '0 0 16px 0' }}>
            Try resetting your topic filter or unchecking the "Saved Bookmarks Only" option.
          </p>
          <button
            type="button"
            onClick={() => { setActiveTopic('ALL'); setActiveDifficulty('ALL'); setShowBookmarksOnly(false); }}
            style={{
              backgroundColor: '#17452F',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '4px',
              padding: '8px 16px',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Reset All Filters
          </button>
        </div>
      )}
    </div>
  );
};

export default ForestKnowledgePage;
