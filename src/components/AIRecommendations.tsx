import React, { useState } from 'react';
import { API } from '../types';
import { aiProviders, aiStorage } from '../utils/ai';
import { useNotification } from '../hooks/useNotification';

interface AIRecommendationsProps {
  apis: API[];
  onClose: () => void;
}

export const AIRecommendations: React.FC<AIRecommendationsProps> = ({ apis, onClose }) => {
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<string>('');
  const [monthlyBudget, setMonthlyBudget] = useState<string>('');

  const getRecommendations = async () => {
    const settings = aiStorage.getSettings();
    if (!settings) {
      showNotification('warning', 'Configuration Required', 'Please configure AI settings first');
      return;
    }

    setLoading(true);
    setRecommendations('');

    try {
      const apiKey = aiStorage.getApiKey();
      if (!apiKey) {
        throw new Error('API key not found');
      }

      const provider = aiProviders[settings.provider as keyof typeof aiProviders];
      const budget = monthlyBudget ? parseFloat(monthlyBudget) : undefined;
      
      const result = await provider.getRecommendations(apiKey, apis, budget);
      setRecommendations(result);
    } catch (error) {
      console.error('AI recommendation error:', error);
      const isLocalhost = window.location.hostname === 'localhost';
      const errorMessage = isLocalhost 
        ? 'AI features require deployment. CORS prevents local API calls.' 
        : 'Failed to get recommendations. Check your API key.';
      showNotification('error', 'AI Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalCost = () => {
    return apis
      .filter(api => api.subscriptionType === 'paid')
      .reduce((total, api) => {
        const cost = api.cost || 0;
        if (api.billingCycle === 'yearly') {
          return total + (cost / 12);
        }
        return total + cost;
      }, 0);
  };

  const totalMonthlyCost = calculateTotalCost();

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal ai-recommendations-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-header-content">
            <div className="modal-icon">✨</div>
            <div>
              <h2>AI Recommendations</h2>
              <p className="modal-subtitle">Optimize your subscriptions with AI insights</p>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-content">
          {apis.length === 0 ? (
            <div className="empty-state-modern">
              <div className="empty-icon">📊</div>
              <h3>No Subscriptions Yet</h3>
              <p>Add some subscriptions first to get AI-powered recommendations!</p>
            </div>
          ) : (
            <>
              <div className="cost-overview">
                <div className="cost-card total-cost-card">
                  <div className="cost-label">Monthly Cost</div>
                  <div className="cost-value">${totalMonthlyCost.toFixed(2)}</div>
                  <div className="cost-meta">{apis.filter(a => a.subscriptionType === 'paid').length} subscriptions</div>
                </div>
                <div className="cost-card budget-card">
                  <div className="cost-label">Target Budget</div>
                  <div className="budget-input-wrapper">
                    <span className="currency-symbol">$</span>
                    <input
                      type="number"
                      value={monthlyBudget}
                      onChange={(e) => setMonthlyBudget(e.target.value)}
                      placeholder="0.00"
                      className="budget-input"
                    />
                  </div>
                  <div className="cost-meta">Optional</div>
                </div>
              </div>

              <button
                onClick={getRecommendations}
                disabled={loading}
                className="analyze-button"
              >
                {loading ? (
                  <>
                    <span className="loading-spinner"></span>
                    <span>Analyzing your subscriptions...</span>
                  </>
                ) : (
                  <>
                    <span className="button-icon">🤖</span>
                    <span>Get AI Recommendations</span>
                  </>
                )}
              </button>

              {recommendations && (
                <div className="recommendations-results">
                  <div className="results-header">
                    <h3>
                      <span className="results-icon">💡</span>
                      AI Analysis Results
                    </h3>
                    <span className="results-badge">Personalized for you</span>
                  </div>
                  <div className="results-content">
                    {recommendations.split('\n').map((line, index) => {
                      // Style different types of content
                      if (line.trim().startsWith('-') || line.trim().startsWith('•')) {
                        return (
                          <div key={index} className="result-item">
                            <span className="result-bullet">→</span>
                            <span>{line.replace(/^[-•]\s*/, '')}</span>
                          </div>
                        );
                      } else if (line.trim().match(/^\d+\./)) {
                        return (
                          <div key={index} className="result-numbered">
                            {line}
                          </div>
                        );
                      } else if (line.trim() === '') {
                        return <div key={index} className="result-spacer" />;
                      } else if (line.includes(':') && line.indexOf(':') < 30) {
                        const [label, ...rest] = line.split(':');
                        return (
                          <div key={index} className="result-labeled">
                            <strong>{label}:</strong>{rest.join(':')}
                          </div>
                        );
                      } else {
                        return <p key={index} className="result-paragraph">{line}</p>;
                      }
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {apis.length > 0 && (
          <div className="modal-footer">
            <button onClick={onClose} className="btn btn-secondary">
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};