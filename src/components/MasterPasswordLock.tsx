import React, { useState, useEffect } from 'react';
import { masterPassword } from '../utils/masterPassword';
import { biometric } from '../utils/biometric';
import { useNotification } from '../hooks/useNotification';
import './MasterPasswordLock.css';

interface MasterPasswordLockProps {
  onUnlocked: () => void;
}

const MasterPasswordLock: React.FC<MasterPasswordLockProps> = ({ onUnlocked }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { showNotification } = useNotification();

  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
    
    const checkBiometric = async () => {
      const available = await biometric.isAvailable();
      setBiometricAvailable(available);
      setBiometricEnabled(biometric.isEnabled());
    };
    
    checkBiometric();
  }, []);

  const handleBiometricAuth = async () => {
    setIsAuthenticating(true);
    
    try {
      const success = await biometric.authenticate();
      if (success) {
        biometric.updateLastAuth();
        masterPassword.updateLastActivity();
        
        // When using biometric, we just unlock without decrypting
        // The data should already be decrypted in localStorage
        masterPassword.updateLastUnlock();
        
        // Small delay to ensure localStorage is updated
        setTimeout(() => {
          onUnlocked();
        }, 100);
      } else {
        showNotification('error', 'Authentication Failed', 'Please try again or use your password.');
      }
    } catch (error) {
      showNotification('error', 'Not Available', 'Biometric authentication is not available.');
    }
    
    setIsAuthenticating(false);
  };

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
      // Small delay to ensure localStorage is updated
      setTimeout(() => {
        onUnlocked();
      }, 100);
    } else {
      setError('Incorrect password');
      setIsUnlocking(false);
      setPassword('');
    }
  };

  return (
    <div className="master-password-lock">
      <div className="lock-container">
        {biometricEnabled && biometricAvailable && isMobile ? (
          <>
            <div className="lock-icon fingerprint-icon" onClick={handleBiometricAuth}>
              <span style={{ fontSize: '60px' }}>👆</span>
            </div>
            <h2>SubAlert is Locked</h2>
            <p>Tap the fingerprint to unlock</p>
            {isAuthenticating && (
              <div className="authenticating-text">Authenticating...</div>
            )}
            <div className="divider-or">OR</div>
          </>
        ) : (
          <>
            <div className="lock-icon">🔒</div>
            <h2>SubAlert is Locked</h2>
            <p>Enter your master password to unlock</p>
          </>
        )}
        
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Master Password"
            autoFocus={!isMobile || !biometricEnabled}
            disabled={isUnlocking}
            className={error ? 'error' : ''}
          />
          
          {error && <div className="error-message">{error}</div>}
          
          <button type="submit" disabled={isUnlocking} className="unlock-button">
            {isUnlocking ? 'Unlocking...' : 'Unlock'}
          </button>
          
          {biometricEnabled && biometricAvailable && !isMobile && (
            <button 
              type="button" 
              className="biometric-unlock-btn"
              onClick={handleBiometricAuth}
              disabled={isAuthenticating}
            >
              {isAuthenticating ? 'Authenticating...' : '🔓 Unlock with Biometric'}
            </button>
          )}
        </form>
      </div>
    </div>
  );
};

export default MasterPasswordLock;