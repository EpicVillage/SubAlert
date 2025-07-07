import React from 'react';

interface ImportOptionsModalProps {
  onImport: (mode: 'merge' | 'replace') => void;
  onCancel: () => void;
  isEncrypted?: boolean;
}

const ImportOptionsModal: React.FC<ImportOptionsModalProps> = ({ onImport, onCancel, isEncrypted }) => {
  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h2>Import Options</h2>
          <button className="close-btn" onClick={onCancel}>×</button>
        </div>
        
        <div className="modal-content">
          <p style={{ marginBottom: '1.5rem' }}>
            How would you like to import this backup?
          </p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="option-card" style={{ 
              padding: '1rem', 
              border: '1px solid var(--border-color)', 
              borderRadius: 'var(--radius)',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onClick={() => onImport('merge')}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--primary)';
              e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-color)';
              e.currentTarget.style.backgroundColor = 'transparent';
            }}>
              <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--primary)' }}>
                🔀 Merge with existing data
              </h4>
              <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                Keep your current subscriptions and add new ones from the backup. Duplicates will be skipped.
              </p>
            </div>
            
            <div className="option-card" style={{ 
              padding: '1rem', 
              border: '1px solid var(--border-color)', 
              borderRadius: 'var(--radius)',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onClick={() => onImport('replace')}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--text-danger)';
              e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-color)';
              e.currentTarget.style.backgroundColor = 'transparent';
            }}>
              <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-danger)' }}>
                🔄 Replace all data
              </h4>
              <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                Delete all current data and replace with the backup. This cannot be undone.
              </p>
            </div>
          </div>
          
          <div className="modal-actions" style={{ marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onCancel}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportOptionsModal;