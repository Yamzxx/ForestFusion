import React from 'react';
import { Activity, Clock, ShieldCheck } from 'lucide-react';
import type { RecentObservation } from '../types';

interface ObservationsPanelProps {
  observations: RecentObservation[];
}

export const ObservationsPanel: React.FC<ObservationsPanelProps> = ({ observations }) => {
  return (
    <div className="observations-card">
      <div className="panel-header">
        <div className="panel-header-title">
          <Activity className="panel-header-icon" />
          <div>
            <h3>Recent System Observations</h3>
            <span className="panel-subtitle">Ingestion logs & telemetry stream</span>
          </div>
        </div>
        <span className="demo-badge-pill">
          <Clock className="pill-icon" /> DEMO LOGS
        </span>
      </div>

      <div className="observations-list">
        {observations.map((obs) => (
          <div key={obs.id} className={`observation-item severity-${obs.severity}`}>
            <div className="obs-header">
              <span className="obs-zone">{obs.zoneName}</span>
              <span className="obs-time">{obs.timestamp}</span>
            </div>
            <p className="obs-message">{obs.message}</p>
            <div className="obs-meta">
              <span className="obs-type">{obs.type}</span>
              <span className="obs-demo-tag">[DEMO MOCK EVENT]</span>
            </div>
          </div>
        ))}
      </div>

      <div className="observations-footer">
        <ShieldCheck className="footer-icon" />
        <span>Live satellite pass stream awaiting Sentinel-2 GEE pipeline binding.</span>
      </div>
    </div>
  );
};
