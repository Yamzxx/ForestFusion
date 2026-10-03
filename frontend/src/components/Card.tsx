import React, { type ReactNode } from 'react';

interface MetricCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: ReactNode;
  trend?: string;
  badgeText?: string;
  badgeType?: 'info' | 'warning' | 'success' | 'danger';
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  badgeText = 'DEMO DATA',
  badgeType = 'info'
}) => {
  return (
    <div className="metric-card">
      <div className="card-header-row">
        <span className="card-title">{title}</span>
        <div className="card-icon-box">{icon}</div>
      </div>
      
      <div className="card-body">
        <div className="card-value">{value}</div>
        <div className="card-footer-row">
          <span className="card-subtitle">{subtitle}</span>
          {trend && <span className="card-trend">{trend}</span>}
        </div>
      </div>

      <div className={`card-demo-badge badge-${badgeType}`}>
        {badgeText}
      </div>
    </div>
  );
};
