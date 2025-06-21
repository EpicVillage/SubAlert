import React from 'react';
import './ExportOptionsModal.css';

interface ExportOptionsModalProps {
  selectedCount: number;
  onExportWithPassword: () => void;
  onExportWithoutPassword: () => void;
  onClose: () => void;
}

const ExportOptionsModal: React.FC<ExportOptionsModalProps> = ({
  selectedCount,
  onExportWithPassword,
  onExportWithoutPassword,
  onClose
}) => {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="export-options-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Export Options</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        
        <div className="export-options-content">
          <p className="export-options-message">
            Export {selectedCount} selected subscription{selectedCount > 1 ? 's' : ''}
          </p>
          
          <div className="export-options-grid">
            <button 
              className="export-option-card"
              onClick={onExportWithoutPassword}
            >
              <div className="export-option-icon">📄</div>
              <h3>Regular Export</h3>
              <p>Export as plain JSON file</p>
            </button>
            
            <button 
              className="export-option-card primary"
              onClick={onExportWithPassword}
            >
              <div className="export-option-icon">🔒</div>
              <h3>Password Protected</h3>
              <p>Encrypt with password</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportOptionsModal;