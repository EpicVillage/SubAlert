import React, { useState, useRef, useEffect } from 'react';
import { aiStorage } from '../utils/ai';

interface AIMenuProps {
  onOpenSettings: () => void;
  onOpenRecommendations: () => void;
  onClose: () => void;
}

export const AIMenu: React.FC<AIMenuProps> = ({ onOpenSettings, onOpenRecommendations, onClose }) => {
  const [isOpen] = useState(true);
  const menuRef = useRef<HTMLDivElement>(null);
  const hasApiKey = aiStorage.getSettings() !== null;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    // Small delay to prevent immediate closing
    setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);
    
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handleSettings = () => {
    onOpenSettings();
  };

  const handleRecommendations = () => {
    if (hasApiKey) {
      onOpenRecommendations();
    } else {
      onOpenSettings();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="ai-menu-container" ref={menuRef}>
      <div className="ai-menu">
        <div className="ai-menu-header">
          <h3>🤖 AI Assistant</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="ai-menu-content">
          {hasApiKey ? (
            <div className="ai-status-configured">
              <span className="status-icon">✅</span>
              <span>AI is configured</span>
            </div>
          ) : (
            <div className="ai-status-not-configured">
              <span className="status-icon">⚠️</span>
              <span>AI not configured</span>
            </div>
          )}

          <div className="ai-menu-options">
            <button 
              className="ai-menu-option"
              onClick={(e) => {
                e.stopPropagation();
                handleRecommendations();
              }}
            >
              <div className="option-icon">✨</div>
              <div className="option-content">
                <div className="option-title">Get Recommendations</div>
                <div className="option-description">
                  Analyze subscriptions for savings
                </div>
              </div>
              <div className="option-arrow">→</div>
            </button>

            <button 
              className="ai-menu-option"
              onClick={(e) => {
                e.stopPropagation();
                handleSettings();
              }}
            >
              <div className="option-icon">🔧</div>
              <div className="option-content">
                <div className="option-title">AI Settings</div>
                <div className="option-description">
                  Configure API provider & key
                </div>
              </div>
              <div className="option-arrow">→</div>
            </button>
          </div>

          <div className="ai-menu-info">
            <p>Your API key is stored locally and never sent to our servers.</p>
          </div>
        </div>
      </div>
    </div>
  );
};