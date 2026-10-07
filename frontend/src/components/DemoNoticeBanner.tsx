import React from 'react';
import { Info } from 'lucide-react';

export const DemoNoticeBanner: React.FC = () => {
  return (
    <div className="research-disclaimer-strip">
      <div className="disclaimer-content">
        <Info className="disclaimer-icon" size={15} />
        <span>
          <strong>Academic Research Notice:</strong> Research prototype. Model outputs represent statistical hazard estimates and are not operational emergency warnings.
        </span>
      </div>
      <div className="disclaimer-tag">Decision Support Only</div>
    </div>
  );
};
