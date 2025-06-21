import React, { useState } from 'react';
import { masterPassword } from '../utils/masterPassword';
import './MasterPasswordLock.css';

interface MasterPasswordLockProps {
  onUnlocked: () => void;
}

const MasterPasswordLock: React.FC<MasterPasswordLockProps> = ({ onUnlocked }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isUnlocking, setIsUnlocking] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password.trim()) {
      setError('Please enter your master password');
      return;
    }

    setIsUnlocking(true);
    setError('');

    const success = await masterPassword.unlock(password);
    
    if (success) {
      onUnlocked();
    } else {
      setError('Incorrect password');
      setIsUnlocking(false);
      setPassword('');
    }
  };

  return (
    <div className="master-password-lock">
      <div className="lock-container">
        <div className="lock-icon">🔒</div>
        <h2>SubAlert is Locked</h2>
        <p>Enter your master password to unlock</p>
        
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Master Password"
            autoFocus
            disabled={isUnlocking}
            className={error ? 'error' : ''}
          />
          
          {error && <div className="error-message">{error}</div>}
          
          <button type="submit" disabled={isUnlocking} className="unlock-button">
            {isUnlocking ? 'Unlocking...' : 'Unlock'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default MasterPasswordLock;