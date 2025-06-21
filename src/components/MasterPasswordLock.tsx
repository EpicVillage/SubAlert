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
              <svg width="80" height="80" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M256 48C203.2 48 160 91.2 160 144c0 8.8 7.2 16 16 16s16-7.2 16-16c0-35.2 28.8-64 64-64s64 28.8 64 64v32c0 53-43 96-96 96-8.8 0-16 7.2-16 16s7.2 16 16 16c70.6 0 128-57.4 128-128v-32c0-52.8-43.2-96-96-96z" fill="currentColor"/>
                <path d="M224 160v112c0 8.8 7.2 16 16 16s16-7.2 16-16V160c0-8.8-7.2-16-16-16s-16 7.2-16 16z" fill="currentColor"/>
                <path d="M256 320c-70.6 0-128 57.4-128 128v16c0 8.8 7.2 16 16 16s16-7.2 16-16v-16c0-53 43-96 96-96s96 43 96 96v16c0 8.8 7.2 16 16 16s16-7.2 16-16v-16c0-70.6-57.4-128-128-128z" fill="currentColor"/>
                <path d="M256 384c-35.3 0-64 28.7-64 64v16c0 8.8 7.2 16 16 16s16-7.2 16-16v-16c0-17.7 14.3-32 32-32s32 14.3 32 32v16c0 8.8 7.2 16 16 16s16-7.2 16-16v-16c0-35.3-28.7-64-64-64z" fill="currentColor"/>
                <path d="M96 256c0-88.4 71.6-160 160-160 8.8 0 16-7.2 16-16s-7.2-16-16-16C149.9 64 64 149.9 64 256c0 8.8 7.2 16 16 16s16-7.2 16-16z" fill="currentColor"/>
                <path d="M416 240c-8.8 0-16 7.2-16 16 0 88.4-71.6 160-160 160-8.8 0-16 7.2-16 16s7.2 16 16 16c106.1 0 192-85.9 192-192 0-8.8-7.2-16-16-16z" fill="currentColor"/>
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