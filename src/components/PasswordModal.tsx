import React, { useState } from 'react';

interface PasswordModalProps {
  title: string;
  description: string;
  confirmButtonText?: string;
  onConfirm: (password: string) => void;
  onCancel: () => void;
  showConfirmPassword?: boolean;
}

const PasswordModal: React.FC<PasswordModalProps> = ({ 
  title, 
  description, 
  confirmButtonText = 'Confirm',
  onConfirm, 
  onCancel,
  showConfirmPassword = false
}) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ password?: boolean; confirmPassword?: boolean }>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors: { password?: boolean; confirmPassword?: boolean } = {};
    
    if (!password) {
      newErrors.password = true;
    }
    
    if (showConfirmPassword && password !== confirmPassword) {
      newErrors.confirmPassword = true;
    }
    
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length === 0) {
      onConfirm(password);
    }
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="close-btn" onClick={onCancel}>×</button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div style={{ padding: '1.5rem' }}>
            <p style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>
              {description}
            </p>
            
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="input-with-button">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  className={errors.password ? 'error' : ''}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) {
                      setErrors({ ...errors, password: false });
                    }
                  }}
                  placeholder="Enter password"
                  autoFocus
                />
                <button
                  type="button"
                  className="btn-icon-small"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>
            
            {showConfirmPassword && (
              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  className={errors.confirmPassword ? 'error' : ''}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (errors.confirmPassword) {
                      setErrors({ ...errors, confirmPassword: false });
                    }
                  }}
                  placeholder="Confirm password"
                />
                {errors.confirmPassword && (
                  <span style={{ color: 'var(--danger)', fontSize: '0.75rem' }}>
                    Passwords do not match
                  </span>
                )}
              </div>
            )}
            
            <div className="modal-actions">
              <button type="button" className="btn btn-secondary" onClick={onCancel}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                {confirmButtonText}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PasswordModal;