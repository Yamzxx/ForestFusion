import React from 'react';

interface StatCardBadge {
  text: string;
  variant?: 'model' | 'observed' | 'neutral' | 'warning' | 'danger';
}

interface StatCardProps {
  title: string;
  value: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  badge?: StatCardBadge;
  footnote?: React.ReactNode;
  variant?: 'default' | 'emerald' | 'amber' | 'crimson' | 'cyan';
  valueColor?: string;
  className?: string;
  interactive?: boolean;
  backgroundImage?: string;
  overlayGradient?: string;
  onClick?: () => void;
  children?: React.ReactNode;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  badge,
  footnote,
  variant = 'default',
  valueColor,
  className = '',
  interactive = false,
  backgroundImage,
  overlayGradient,
  onClick,
  children
}) => {
  const variantClass = `stat-card-${variant}`;
  const interactiveClass = interactive ? 'stat-card-interactive' : '';

  const backgroundStyle: React.CSSProperties = backgroundImage ? {
    backgroundImage: `${overlayGradient || 'linear-gradient(135deg, rgba(255, 255, 255, 0.96) 0%, rgba(255, 255, 255, 0.93) 100%)'}, url(${backgroundImage})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    position: 'relative'
  } : {};

  return (
    <div 
      className={`stat-card ${variantClass} ${interactiveClass} ${className}`}
      style={backgroundStyle}
      onClick={onClick}
    >
      <div className="stat-card-header">
        <span className="stat-card-title">{title}</span>
        {badge && (
          <span className={`stat-badge stat-badge-${badge.variant || 'neutral'}`}>
            {badge.text}
          </span>
        )}
      </div>

      <div className="stat-card-body">
        <div className="stat-card-main">
          <div 
            className="stat-card-value" 
            style={valueColor ? { color: valueColor } : undefined}
          >
            {value}
          </div>
          {icon && <div className="stat-card-icon-wrap">{icon}</div>}
        </div>

        {subtitle && <div className="stat-card-subtitle">{subtitle}</div>}
        {children}
      </div>

      {footnote && (
        <div className="stat-card-footnote">
          <span>{footnote}</span>
        </div>
      )}
    </div>
  );
};
