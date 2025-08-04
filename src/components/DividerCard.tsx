import React, { useState, useEffect } from 'react';
import { API } from '../types';

interface DividerCardProps {
  label: string;
  api: API;
  isEditMode: boolean;
  onEdit: (api: API) => void;
  onDelete: () => void;
  isCompact?: boolean;
}

const DividerCard: React.FC<DividerCardProps> = ({ label, api, isEditMode, onEdit, onDelete, isCompact = false }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedLabel, setEditedLabel] = useState(label);

  useEffect(() => {
    setEditedLabel(label);
  }, [label]);

  const handleSave = () => {
    setIsEditing(false);
    if (editedLabel !== label) {
      onEdit({ ...api, serviceName: editedLabel });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    }
    if (e.key === 'Escape') {
      setEditedLabel(label);
      setIsEditing(false);
    }
  };

  return (
    <div className={`divider-card ${isCompact ? 'compact' : ''}`}>
      <div className="divider-line left"></div>
      
      {isEditing ? (
        <input
          type="text"
          value={editedLabel}
          onChange={(e) => setEditedLabel(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyPress}
          className="divider-label-input"
          autoFocus
          placeholder="Section name..."
        />
      ) : (
        <div className="divider-label" onDoubleClick={() => isEditMode && setIsEditing(true)}>
          {label || 'Section'}
        </div>
      )}
      
      <div className="divider-line right"></div>
      
      {isEditMode && (
        <div className="divider-actions">
          <button 
            className="divider-action-btn edit"
            onClick={() => setIsEditing(!isEditing)}
            title="Edit label"
          >
            ✏️
          </button>
          <button 
            className="divider-action-btn delete"
            onClick={onDelete}
            title="Remove divider"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
};

export default DividerCard;