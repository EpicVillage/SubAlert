import React, { useState } from 'react';
import { biometric } from '../utils/biometric';
import { useNotification } from '../hooks/useNotification';

interface BiometricLockProps {
  onAuthenticated: () => void;
}

const BiometricLock: React.FC<BiometricLockProps> = ({ onAuthenticated }) => {
  const { showNotification } = useNotification();
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const handleAuthenticate = async () => {
    setIsAuthenticating(true);

    try {
      const success = await biometric.authenticate();
      if (success) {
        biometric.updateLastAuth();
        onAuthenticated();
      } else {
        showNotification('error', 'Authentication Failed', 'Please try again.');
      }
    } catch (error) {
      showNotification('error', 'Not Available', 'Biometric authentication is not available on this device.');
    }

    setIsAuthenticating(false);
  };

  return (
    <div className="biometric-lock-overlay">
      <div className="biometric-lock-container">
        <div className="biometric-lock-icon fingerprint-icon" onClick={handleAuthenticate}>
          <svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C9.38 2 7.25 4.13 7.25 6.75C7.25 9.32 9.26 11.4 11.88 11.49C11.96 11.48 12.04 11.48 12.1 11.49C12.12 11.49 12.13 11.49 12.15 11.49C12.16 11.49 12.16 11.49 12.17 11.49C14.73 11.4 16.74 9.32 16.75 6.75C16.75 4.13 14.62 2 12 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M17.08 14.15C14.29 12.29 9.74 12.29 6.93 14.15C5.66 15 4.96 16.15 4.96 17.38C4.96 18.61 5.66 19.75 6.92 20.59C8.32 21.53 10.16 22 12 22C13.84 22 15.68 21.53 17.08 20.59C18.34 19.74 19.04 18.6 19.04 17.36C19.03 16.13 18.34 14.99 17.08 14.15Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <h2>SubAlert is Locked</h2>
        <p>Tap the fingerprint to unlock</p>
        
        {isAuthenticating && (
          <div className="authenticating-text">Authenticating...</div>
        )}
      </div>
    </div>
  );
};

export default BiometricLock;