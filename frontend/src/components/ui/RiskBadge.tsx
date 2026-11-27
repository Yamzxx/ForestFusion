import React from 'react';

export type RiskLevelType = 'Low' | 'Moderate' | 'High' | 'Very High' | 'Extreme' | string;

interface RiskBadgeProps {
  level: RiskLevelType;
  size?: 'sm' | 'md' | 'lg';
  showDot?: boolean;
  className?: string;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({
  level,
  size = 'md',
  showDot = true,
  className = ''
}) => {
  const normalized = (level || 'LOW').toUpperCase();

  let dotClass = 'success';
  let label = level || 'Low';

  if (normalized.includes('VERY HIGH') || normalized.includes('EXTREME')) {
    dotClass = 'danger';
  } else if (normalized.includes('HIGH')) {
    dotClass = 'warning';
  } else if (normalized.includes('MODERATE')) {
    dotClass = 'moderate';
  }

  const sizeClass = size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-sm font-semibold' : 'text-xs font-medium';

  return (
    <span className={`status-indicator risk-tag-${dotClass} ${sizeClass} ${className}`}>
      {showDot && <span className={`status-dot ${dotClass}`} />}
      <span className="risk-tag-text">{label}</span>
    </span>
  );
};
