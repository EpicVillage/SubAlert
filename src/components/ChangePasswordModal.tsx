import React, { useState } from 'react';

interface ChangePasswordModalProps {
  onConfirm: (currentPassword: string, newPassword: string) => void;
  onCancel: () => void;
}

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ onConfirm, onCancel }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors: { [key: string]: string } = {};
    
    if (!currentPassword) {
      newErrors.current = 'Current password is required';
    }
    
    if (!newPassword) {
      newErrors.new = 'New password is required';
    } else if (newPassword.length < 6) {
      newErrors.new = 'Password must be at least 6 characters';
    }
    
    if (newPassword !== confirmPassword) {
      newErrors.confirm = 'Passwords do not match';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    onConfirm(currentPassword, newPassword);
  };

  return (
    <div className="modal-backdrop">
      <div className="modal password-modal">
        <h2>Change Master Password</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="currentPassword">Current Password</label>
            <input
              type="password"
              id="currentPassword"
              value={currentPassword}
              onChange={(e) => {
                setCurrentPassword(e.target.value);
                setErrors({ ...errors, current: '' });
              }}
              className={errors.current ? 'error' : ''}
            />
            {errors.current && <span className="error-text">{errors.current}</span>}
          </div>
          
          <div className="form-group">
            <label htmlFor="newPassword">New Password</label>
            <input
              type="password"
              id="newPassword"
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                setErrors({ ...errors, new: '' });
              }}
              className={errors.new ? 'error' : ''}
            />
            {errors.new && <span className="error-text">{errors.new}</span>}
          </div>
          
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm New Password</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setErrors({ ...errors, confirm: '' });
              }}
              className={errors.confirm ? 'error' : ''}
            />
            {errors.confirm && <span className="error-text">{errors.confirm}</span>}
          </div>
          
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onCancel}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Change Password
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangePasswordModal;