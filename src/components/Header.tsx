import React from 'react';

interface HeaderProps {
  onAddAPI: () => void;
  onOpenSettings: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  isEditMode: boolean;
  onToggleEditMode: () => void;
  onOpenCategories: () => void;
}

const Header: React.FC<HeaderProps> = ({ onAddAPI, onOpenSettings, theme, onToggleTheme, isEditMode, onToggleEditMode, onOpenCategories }) => {
  return (
    <header className="header">
      <div className="header-content">
        <h1>SubAlert</h1>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={onAddAPI}>
            + Add
          </button>
          <button 
            className={`btn ${isEditMode ? 'btn-primary' : 'btn-secondary'}`} 
            onClick={onToggleEditMode}
          >
            {isEditMode ? '✓ Done' : '✏️ Edit'}
          </button>
          <button className="btn btn-secondary" onClick={onOpenCategories}>
            🏷️ Categories
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