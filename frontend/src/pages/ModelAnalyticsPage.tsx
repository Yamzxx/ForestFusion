import React, { useState } from 'react';
import { 
  BarChart3, 
  Scale, 
  Sparkles, 
  Database, 
  Layers, 
  CheckCircle2, 
  Info,
  Sliders,
  Cpu
} from 'lucide-react';
import { ModelComparisonCard } from '../components/ModelComparisonCard';
import { CalibrationDiagnosticCard } from '../components/CalibrationDiagnosticCard';
import { ShapExplainabilityCard } from '../components/ShapExplainabilityCard';
import { DatasetAnalysisCard } from '../components/DatasetAnalysisCard';
import { BaselineModelCard } from '../components/BaselineModelCard';

export const ModelAnalyticsPage: React.FC = () => {
  const [activeSection, setActiveSection] = useState<'comparison' | 'calibration' | 'shap' | 'dataset' | 'baseline'>('comparison');

  return (
    <div className="page-container model-analytics-page">
      {/* Page Header */}
      <div className="analytics-header-panel">
        <div className="analytics-header-left">
          <Cpu className="analytics-header-icon" />
          <div>
            <h2>Model Analytics & Calibration Diagnostics</h2>
            <p className="analytics-subtitle">
              Scientific evaluation of XGBoost tree ensembles, Platt probability calibration, and TreeSHAP attribution
            </p>
          </div>
        </div>

        {/* Section Switcher Tabs */}
        <div className="analytics-nav-tabs">
          <button 
            type="button" 
            className={`tab-btn ${activeSection === 'comparison' ? 'active' : ''}`}
            onClick={() => setActiveSection('comparison')}
          >
            <BarChart3 size={14} className="inline-icon" /> Model Evaluation
          </button>

          <button 
            type="button" 
            className={`tab-btn ${activeSection === 'calibration' ? 'active' : ''}`}
            onClick={() => setActiveSection('calibration')}
          >
            <Scale size={14} className="inline-icon" /> Platt Calibration
          </button>

          <button 
            type="button" 
            className={`tab-btn ${activeSection === 'shap' ? 'active' : ''}`}
            onClick={() => setActiveSection('shap')}
          >
            <Sparkles size={14} className="inline-icon" /> TreeSHAP Analysis
          </button>

          <button 
            type="button" 
            className={`tab-btn ${activeSection === 'dataset' ? 'active' : ''}`}
            onClick={() => setActiveSection('dataset')}
          >
            <Database size={14} className="inline-icon" /> Dataset Engineering
          </button>

          <button 
            type="button" 
            className={`tab-btn ${activeSection === 'baseline' ? 'active' : ''}`}
            onClick={() => setActiveSection('baseline')}
          >
            <Sliders size={14} className="inline-icon" /> Baseline Model
          </button>
        </div>
      </div>

      {/* Notice Banner */}
      <div className="analytics-methodology-note">
        <Info size={14} className="inline-icon" />
        <span>
          <strong>Evaluation Standard:</strong> Metrics are generated on held-out temporal cross-validation datasets. If an experimental metric is not computed by the backend, it is explicitly reported as "Not evaluated" rather than synthetic estimations.
        </span>
      </div>

      {/* Active Section Content */}
      <div className="analytics-content-view">
        {activeSection === 'comparison' && (
          <ModelComparisonCard 
            initialTemperature={34.0}
            initialHumidity={22.0}
            initialWindSpeed={21.0}
          />
        )}

        {activeSection === 'calibration' && (
          <CalibrationDiagnosticCard />
        )}

        {activeSection === 'shap' && (
          <ShapExplainabilityCard 
            initialTemperature={34.0}
            initialHumidity={22.0}
            initialWindSpeed={21.0}
          />
        )}

        {activeSection === 'dataset' && (
          <DatasetAnalysisCard />
        )}

        {activeSection === 'baseline' && (
          <BaselineModelCard 
            initialTemperature={32.0}
            initialHumidity={25.0}
            initialWindSpeed={18.0}
          />
        )}
      </div>
    </div>
  );
};

export default ModelAnalyticsPage;
