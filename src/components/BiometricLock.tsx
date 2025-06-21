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

  const handleDisableBiometric = () => {
    biometric.disable();
    onAuthenticated();
  };

  return (
    <div className="biometric-lock-overlay">
      <div className="biometric-lock-container">
        <div className="biometric-lock-icon">
          🔒
        </div>
        <h2>SubAlert is Locked</h2>
        <p>Use biometric authentication to unlock</p>
        
        <button 
          className="btn btn-primary biometric-unlock-btn"
          onClick={handleAuthenticate}
          disabled={isAuthenticating}
        >
          {isAuthenticating ? 'Authenticating...' : '🔓 Unlock with Biometric'}
        </button>
        
        <button 
          className="btn btn-link"
          onClick={handleDisableBiometric}
        >
          Disable Biometric Lock
        </button>
      </div>
    </div>
  );
};

export default BiometricLock;