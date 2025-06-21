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
              <svg width="80" height="80" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.81 4.47C17.73 4.43 17.65 4.39 17.58 4.34C15.66 2.42 13.02 1.38 10.18 1.38C8.59 1.38 7.11 1.74 5.82 2.4C5.11 2.72 4.76 3.51 4.97 4.24C5.09 4.65 5.36 4.98 5.71 5.17C5.95 5.3 6.22 5.36 6.49 5.36C6.65 5.36 6.8 5.33 6.95 5.27C7.96 4.77 9.05 4.5 10.18 4.5C14.27 4.5 17.61 7.84 17.61 11.93C17.61 12.07 17.61 12.22 17.6 12.36C17.58 12.88 17.97 13.33 18.49 13.36C18.51 13.36 18.52 13.36 18.54 13.36C19.04 13.36 19.46 12.97 19.48 12.46C19.49 12.28 19.5 12.11 19.5 11.93C19.5 8.91 18.39 6.15 16.57 4.05C16.56 4.05 16.56 4.05 16.55 4.05C16.47 3.97 16.38 3.88 16.29 3.8C16.28 3.8 16.28 3.8 16.28 3.79C16.19 3.71 16.11 3.63 16.02 3.55C15.74 3.28 15.45 3.03 15.14 2.79L15.13 2.78C15 2.66 14.87 2.55 14.73 2.43L17.81 4.47Z"/>
                <path d="M12.06 7.19C11.55 7.16 11.04 7.56 11 8.08C10.97 8.59 11.37 9.04 11.88 9.08C13.89 9.24 15.49 10.85 15.65 12.86C15.68 13.35 16.08 13.72 16.56 13.72C16.58 13.72 16.6 13.72 16.62 13.71C17.14 13.68 17.53 13.23 17.5 12.71C17.27 9.78 14.99 7.5 12.06 7.27V7.19Z"/>
                <path d="M9.03001 12.96C9.02001 12.42 9.38001 11.96 9.87001 11.86C10.38 11.76 10.88 12.08 11.02 12.57C11.38 13.79 12.51 14.64 13.76 14.64C14.27 14.64 14.69 15.05 14.69 15.57C14.69 16.08 14.28 16.5 13.76 16.5C11.43 16.5 9.46001 14.78 9.08001 12.48C9.05001 12.3 9.04001 12.13 9.04001 11.95C9.04001 10.43 10.27 9.2 11.79 9.2C11.8 9.2 11.81 9.2 11.82 9.2C12.34 9.23 12.75 9.68 12.72 10.2C12.69 10.71 12.29 11.1 11.78 11.08C11.78 11.08 11.78 11.08 11.77 11.08C11.35 11.08 11 11.42 11 11.85C11 11.86 11 11.88 11 11.89C11 11.96 11 12.04 11.01 12.11L9.03001 12.96Z"/>
                <path d="M16.92 19.67C15.3 21.17 13.13 22.08 10.77 22.08C6.45001 22.08 2.94001 18.57 2.94001 14.25C2.94001 13.19 3.14001 12.19 3.51001 11.26C3.70001 10.78 4.23001 10.54 4.71001 10.72C5.20001 10.91 5.45001 11.44 5.26001 11.92C4.97001 12.66 4.82001 13.44 4.82001 14.25C4.82001 17.53 7.49001 20.2 10.77 20.2C12.73 20.2 14.53 19.46 15.86 18.15C16.21 17.8 16.78 17.8 17.13 18.15C17.48 18.5 17.48 19.07 17.13 19.42L16.92 19.67Z"/>
                <path d="M11.77 6.05C11.76 5.53 11.35 5.13 10.83 5.13H10.82C10.3 5.14 9.89001 5.55 9.90001 6.07C9.91001 6.58 10.31 6.98 10.82 6.98H10.83C11.35 6.97 11.76 6.56 11.76 6.05H11.77Z"/>
                <path d="M21.92 12.16C21.74 11.67 21.21 11.42 20.72 11.6C20.23 11.78 19.98 12.31 20.16 12.8C20.45 13.58 20.6 14.4 20.6 15.24C20.6 18.31 18.22 20.84 15.18 21.15C13.96 21.28 12.73 21.03 11.65 20.44C11.2 20.19 10.64 20.36 10.39 20.82C10.14 21.27 10.31 21.83 10.76 22.08C12.17 22.85 13.77 23.17 15.36 22.99C19.28 22.56 22.42 19.13 22.42 15.15C22.42 14 22.23 12.88 21.86 11.83L21.92 12.16Z"/>
              </svg>
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