import React, { useState, useEffect } from 'react';
import { aiStorage } from '../utils/ai';
import { useNotification } from '../hooks/useNotification';

interface AISettingsProps {
  onClose: () => void;
}

export const AISettings: React.FC<AISettingsProps> = ({ onClose }) => {
  const { showNotification } = useNotification();
  const [provider, setProvider] = useState<'openai' | 'anthropic'>('openai');
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);

  useEffect(() => {
    const settings = aiStorage.getSettings();
    if (settings) {
      setProvider(settings.provider);
      setApiKey(aiStorage.getApiKey() || '');
      setIsConfigured(true);
    }
  }, []);

  const handleSave = () => {
    if (!apiKey.trim()) {
      showNotification('error', 'Validation Error', 'Please enter an API key');
      return;
    }

    try {
      aiStorage.saveSettings(provider, apiKey);
      showNotification('success', 'Settings Saved', 'AI settings saved successfully');
      setIsConfigured(true);
      // Close the modal after a short delay to allow the notification to be seen
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (error) {
      showNotification('error', 'Save Failed', 'Failed to save AI settings');
    }
  };

  const handleClear = () => {
    aiStorage.clearSettings();
    setApiKey('');
    setIsConfigured(false);
    showNotification('info', 'Settings Cleared', 'AI settings have been removed');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal ai-settings-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-header-content">
            <div className="modal-icon">🤖</div>
            <div>
              <h2>AI Configuration</h2>
              <p className="modal-subtitle">Power up SubAlert with AI insights</p>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-content">
          <div className="ai-intro-section">
            <div className="ai-intro-card">
              <div className="ai-intro-icon">🔒</div>
              <div className="ai-intro-content">
                <h4>Private & Secure</h4>
                <p>Your API key is stored locally and never sent to our servers</p>
              </div>
            </div>
            <div className="ai-intro-card">
              <div className="ai-intro-icon">💡</div>
              <div className="ai-intro-content">
                <h4>Smart Analysis</h4>
                <p>Get personalized recommendations to optimize your subscriptions</p>
              </div>
            </div>
          </div>

          <div className="ai-form-section">
            <div className="form-group">
              <label className="form-label">
                <span className="label-text">Choose AI Provider</span>
                <span className="label-required">*</span>
              </label>
              <div className="provider-select-wrapper">
                <button
                  className={`provider-option ${provider === 'openai' ? 'active' : ''}`}
                  onClick={() => setProvider('openai')}
                >
                  <div className="provider-logo">
                    <span style={{ fontSize: '2rem' }}>🌐</span>
                  </div>
                  <div className="provider-details">
                    <h4>OpenAI</h4>
                    <p>GPT-3.5 / GPT-4</p>
                  </div>
                  <div className="provider-price">~$0.002/request</div>
                </button>
                <button
                  className={`provider-option ${provider === 'anthropic' ? 'active' : ''}`}
                  onClick={() => setProvider('anthropic')}
                >
                  <div className="provider-logo">
                    <span style={{ fontSize: '2rem' }}>🔷</span>
                  </div>
                  <div className="provider-details">
                    <h4>Anthropic</h4>
                    <p>Claude Haiku</p>
                  </div>
                  <div className="provider-price">~$0.0008/request</div>
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                <span className="label-text">API Key</span>
                <span className="label-required">*</span>
              </label>
              <div className="api-key-input-wrapper">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={provider === 'openai' ? 'sk-...' : 'sk-ant-...'}
                  className="api-key-input"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="toggle-visibility-btn"
                >
                  {showKey ? '🙈' : '👁️'}
                </button>
              </div>
              {isConfigured && (
                <div className="input-success-message">
                  <span>✅</span> API key is saved and encrypted
                </div>
              )}
            </div>

            <div className="setup-guide">
              <h4 className="setup-guide-title">
                {provider === 'openai' ? '🔑 Get your OpenAI API Key' : '🔑 Get your Anthropic API Key'}
              </h4>
              <div className="setup-steps">
                {provider === 'openai' ? (
                  <>
                    <div className="setup-step">
                      <div className="step-number">1</div>
                      <div className="step-content">
                        <p>Visit <a href="https://platform.openai.com" target="_blank" rel="noopener noreferrer">platform.openai.com</a></p>
                      </div>
                    </div>
                    <div className="setup-step">
                      <div className="step-number">2</div>
                      <div className="step-content">
                        <p>Sign up or log in to your account</p>
                      </div>
                    </div>
                    <div className="setup-step">
                      <div className="step-number">3</div>
                      <div className="step-content">
                        <p>Navigate to API Keys section</p>
                      </div>
                    </div>
                    <div className="setup-step">
                      <div className="step-number">4</div>
                      <div className="step-content">
                        <p>Create a new secret key</p>
                      </div>
                    </div>
                    <div className="setup-step">
                      <div className="step-number">5</div>
                      <div className="step-content">
                        <p>Copy and paste it above</p>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="setup-step">
                      <div className="step-number">1</div>
                      <div className="step-content">
                        <p>Visit <a href="https://console.anthropic.com" target="_blank" rel="noopener noreferrer">console.anthropic.com</a></p>
                      </div>
                    </div>
                    <div className="setup-step">
                      <div className="step-number">2</div>
                      <div className="step-content">
                        <p>Sign up or log in to your account</p>
                      </div>
                    </div>
                    <div className="setup-step">
                      <div className="step-number">3</div>
                      <div className="step-content">
                        <p>Go to API Keys section</p>
                      </div>
                    </div>
                    <div className="setup-step">
                      <div className="step-number">4</div>
                      <div className="step-content">
                        <p>Generate a new key</p>
                      </div>
                    </div>
                    <div className="setup-step">
                      <div className="step-number">5</div>
                      <div className="step-content">
                        <p>Copy and paste it above</p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="btn btn-secondary">
            Cancel
          </button>
          {isConfigured && (
            <button onClick={handleClear} className="btn btn-danger">
              Clear Settings
            </button>
          )}
          <button onClick={handleSave} className="btn btn-primary">
            <span>💾</span> Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
};