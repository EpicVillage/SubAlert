import React, { useState } from 'react';
import { Category } from '../types';
import './BulkActionsToolbar.css';

interface BulkActionsToolbarProps {
  selectedCount: number;
  totalCount?: number;
  categories: Category[];
  onDelete: () => void;
  onCategoryChange: (categoryId: string) => void;
  onExport: () => void;
  onClearSelection: () => void;
  onSelectAll?: () => void;
}

const BulkActionsToolbar: React.FC<BulkActionsToolbarProps> = ({
  selectedCount,
  totalCount,
  categories,
  onDelete,
  onCategoryChange,
  onExport,
  onClearSelection,
  onSelectAll
}) => {
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);

  if (selectedCount === 0) return null;

  return (
    <div className="bulk-actions-toolbar">
      <div className="bulk-actions-info">
        <span className="selected-count">{selectedCount} selected</span>
        <div>
          {onSelectAll && totalCount && selectedCount !== totalCount && (
            <button className="btn-link" onClick={onSelectAll}>
              Select All
            </button>
          )}
          <button className="btn-link" onClick={onClearSelection}>
            Clear
          </button>
        </div>
      </div>
      
      <div className="bulk-actions-buttons">
        <div className="category-dropdown">
          <button 
            className="btn btn-secondary"
            onClick={() => setShowCategoryMenu(!showCategoryMenu)}
          >
            📁 Move to Category
          </button>
          {showCategoryMenu && (
            <div className="category-dropdown-menu">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  className="category-option"
                  onClick={() => {
                    onCategoryChange(cat.id);
                    setShowCategoryMenu(false);
                  }}
                >
                  {cat.emoji} {cat.name}
                </button>
              ))}
            </div>
          )}
        </div>
        
        <button className="btn btn-secondary" onClick={onExport}>
          📤 Export Selected
        </button>
        
        <button className="btn btn-danger" onClick={onDelete}>
          🗑️ Delete Selected
        </button>
      </div>
    </div>
  );
};

export default BulkActionsToolbar;