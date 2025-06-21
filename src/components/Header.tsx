import React from 'react';
import { useIsTouchDevice } from '../hooks/useTouch';
import { useNavigate, useLocation } from 'react-router-dom';

interface HeaderProps {
  onAddAPI: () => void;
  onOpenSettings: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  isEditMode: boolean;
  onToggleEditMode: () => void;
  onOpenCategories: () => void;
  onOpenAI: () => void;
  selectedCount?: number;
  onSelectAll?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onAddAPI, onOpenSettings, theme, onToggleTheme, isEditMode, onToggleEditMode, onOpenCategories, onOpenAI, selectedCount = 0, onSelectAll }) => {
  const isTouchDevice = useIsTouchDevice();
  const navigate = useNavigate();
  const location = useLocation();
  const isCalendarView = location.pathname === '/calendar';
  
  return (
    <header className="header">
      <div className="header-content">
        <div className="header-brand">
          <img 
            src={theme === 'dark' ? "/subalert-logo-light.png" : "/subalert-logo.png"} 
            alt="SubAlert Logo" 
            className="header-logo" 
          />
          <h1>SubAlert</h1>
        </div>
        <div className="header-actions">
          <button 
            className={`btn ${isCalendarView ? 'btn-secondary' : 'btn-primary'}`} 
            onClick={() => navigate(isCalendarView ? '/' : '/calendar')}
          >
            {isCalendarView ? '📋 List' : '📅 Calendar'}
          </button>
          {!isCalendarView && (
            <>
              <button className="btn btn-primary" onClick={onAddAPI}>
                + Add
              </button>
              <button 
                className={`btn ${isEditMode ? 'btn-primary' : 'btn-secondary'}`} 
                onClick={onToggleEditMode}
              >
                {isEditMode ? '✓ Done' : '✏️ Edit'}
              </button>
              {!isTouchDevice && isEditMode && onSelectAll && (
                <button className="btn btn-link" onClick={onSelectAll}>
                  {selectedCount > 0 ? 'Deselect All' : 'Select All'}
                </button>
              )}
            </>
          )}
          <button className="btn btn-secondary" onClick={onOpenCategories}>
            🏷️ Categories
          </button>
          <button className="btn btn-secondary" onClick={onOpenAI}>
            🤖 AI
          </button>
          <button className="theme-toggle" onClick={onToggleTheme}>
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
          <button className="btn btn-icon" onClick={onOpenSettings}>
            ⚙️
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;