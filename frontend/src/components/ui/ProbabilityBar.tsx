import React from 'react';

interface ProbabilityBarProps {
  value: number; // 0.0 to 1.0 (or percentage 0 to 100)
  height?: number;
  showLabels?: boolean;
  showThresholds?: boolean;
  className?: string;
}

export const ProbabilityBar: React.FC<ProbabilityBarProps> = ({
  value,
  height = 10,
  showLabels = false,
  showThresholds = true,
  className = ''
}) => {
  // Normalize value to 0-100 range
  const percent = value > 1 ? Math.min(100, Math.max(0, value)) : Math.min(100, Math.max(0, value * 100));

  // Determine bar color based on calibrated probability thresholds
  let barColor = '#10b981'; // Muted Emerald
  if (percent >= 75) {
    barColor = '#dc2626'; // Controlled Red
  } else if (percent >= 50) {
    barColor = '#ea580c'; // Muted Orange
  } else if (percent >= 35) {
    barColor = '#d97706'; // Natural Amber
  }

  return (
    <div className={`probability-bar-container ${className}`}>
      <div 
        className="probability-track"
        style={{ height: `${height}px`, borderRadius: '2px', backgroundColor: 'rgba(255, 255, 255, 0.08)' }}
      >
        <div
          className="probability-fill"
          style={{
            width: `${percent}%`,
            backgroundColor: barColor,
            borderRadius: '2px',
            transition: 'width 0.3s ease'
          }}
        />

        {showThresholds && (
          <>
            {/* 35% Attention Threshold Marker */}
            <div 
              className="threshold-marker threshold-35" 
              title="35% Elevated Attention Threshold" 
              style={{ left: '35%' }}
            />
            {/* 75% Very High Threshold Marker */}
            <div 
              className="threshold-marker threshold-75" 
              title="75% Very High Hazard Threshold" 
              style={{ left: '75%' }}
            />
          </>
        )}
      </div>

      {showLabels && (
        <div className="probability-labels">
          <span className="prob-label-start">0% Low</span>
          <span className="prob-label-threshold" style={{ left: '35%' }}>35% Attention</span>
          <span className="prob-label-threshold" style={{ left: '75%' }}>75% Extreme</span>
          <span className="prob-label-end">100%</span>
        </div>
      )}
    </div>
  );
};
