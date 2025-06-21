import React, { useState } from 'react';
import { API } from '../types';
import { aiProviders, aiStorage } from '../utils/ai';
import './FeatureComparison.css';

interface FeatureComparisonProps {
  api: API;
  onClose: () => void;
}

interface ComparisonResult {
  alternatives: Alternative[];
  currentService: ServiceDetails;
}

interface Alternative {
  name: string;
  cost: number;
  billingCycle: string;
  features: Feature[];
  pros: string[];
  cons: string[];
  savings: number;
  recommendation: string;
}

interface Feature {
  name: string;
  current: boolean | string;
  alternative: boolean | string;
  importance: 'high' | 'medium' | 'low';
}

interface ServiceDetails {
  name: string;
  features: string[];
  cost: number;
  billingCycle: string;
}

const FeatureComparison: React.FC<FeatureComparisonProps> = ({ api, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [comparison, setComparison] = useState<ComparisonResult | null>(null);

  const generateComparison = async () => {
    setLoading(true);
    setError(null);

    try {
      const settings = aiStorage.getSettings();
      if (!settings) {
        setError('Please configure AI settings first');
        return;
      }

      const provider = aiProviders[settings.provider as keyof typeof aiProviders];
      const apiKey = aiStorage.getApiKey();

      if (!apiKey) {
        setError('API key not found');
        return;
      }

      // Get detailed comparison from AI
      const result = await provider.getFeatureComparison(apiKey, api);
      
      // Validate the result structure
      if (!result || !result.currentService || !result.alternatives) {
        throw new Error('Invalid comparison data received from AI');
      }
      
      setComparison(result);
    } catch (err) {
      console.error('Feature comparison error:', err);
      if (err instanceof Error) {
        if (err.message.includes('JSON')) {
          setError('Failed to parse AI response. Please try again.');
        } else {
          setError(err.message);
        }
      } else {
        setError('Failed to generate comparison');
      }
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    generateComparison();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getFeatureIcon = (value: boolean | string) => {
    if (typeof value === 'boolean') {
      return value ? '✓' : '✗';
    }
    return value;
  };

  const getFeatureClass = (current: boolean | string, alternative: boolean | string) => {
    if (typeof current === 'boolean' && typeof alternative === 'boolean') {
      if (!current && alternative) return 'feature-upgrade';
      if (current && !alternative) return 'feature-downgrade';
    }
    return '';
  };

  const getSavingsClass = (savings: number) => {
    if (savings > 50) return 'savings-high';
    if (savings > 20) return 'savings-medium';
    if (savings > 0) return 'savings-low';
    return 'savings-none';
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal feature-comparison-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Feature Comparison: {api.serviceName}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-content">
          {loading && (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Analyzing alternatives and comparing features...</p>
            </div>
          )}

          {error && (
            <div className="error-container">
              <div className="error-message">
                {error}
              </div>
              <button 
                className="btn btn-primary" 
                onClick={() => {
                  setError(null);
                  generateComparison();
                }}
                style={{ marginTop: '1rem' }}
              >
                Try Again
              </button>
            </div>
          )}

          {comparison && !loading && (
            <>
              <div className="current-service-summary">
                <h3>Current Service</h3>
                <div className="service-card">
                  <h4>{comparison.currentService.name}</h4>
                  <p className="cost">${comparison.currentService.cost}/{comparison.currentService.billingCycle}</p>
                  <div className="features-list">
                    {comparison.currentService.features.map((feature, idx) => (
                      <span key={idx} className="feature-tag">{feature}</span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="alternatives-section">
                <h3>Alternative Services</h3>
                {comparison.alternatives.map((alt, index) => (
                  <div key={index} className="alternative-card">
                    <div className="alternative-header">
                      <div>
                        <h4>{alt.name}</h4>
                        <p className="cost">${alt.cost}/{alt.billingCycle}</p>
                      </div>
                      <div className={`savings-badge ${getSavingsClass(alt.savings)}`}>
                        {alt.savings > 0 ? `Save ${alt.savings}%` : 'Same cost'}
                      </div>
                    </div>

                    <div className="feature-comparison-table">
                      <table>
                        <thead>
                          <tr>
                            <th>Feature</th>
                            <th>{api.serviceName}</th>
                            <th>{alt.name}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {alt.features.map((feature, idx) => (
                            <tr key={idx} className={getFeatureClass(feature.current, feature.alternative)}>
                              <td>
                                <span className={`importance-${feature.importance}`}>
                                  {feature.name}
                                </span>
                              </td>
                              <td className="feature-value">
                                {getFeatureIcon(feature.current)}
                              </td>
                              <td className="feature-value">
                                {getFeatureIcon(feature.alternative)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="pros-cons">
                      <div className="pros">
                        <h5>Pros</h5>
                        <ul>
                          {alt.pros.map((pro, idx) => (
                            <li key={idx}>{pro}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="cons">
                        <h5>Cons</h5>
                        <ul>
                          {alt.cons.map((con, idx) => (
                            <li key={idx}>{con}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="recommendation">
                      <p>{alt.recommendation}</p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default FeatureComparison;