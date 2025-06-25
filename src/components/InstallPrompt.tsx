import React, { useState, useEffect } from 'react';
import './InstallPrompt.css';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const InstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallButton, setShowInstallButton] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSPrompt, setShowIOSPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    const checkIfInstalled = () => {
      // Check if running in standalone mode
      if (window.matchMedia('(display-mode: standalone)').matches) {
        setIsInstalled(true);
        return;
      }
      
      // Check if it's installed on iOS
      if ((window.navigator as any).standalone) {
        setIsInstalled(true);
        return;
      }
    };

    checkIfInstalled();

    // Detect iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    // Show iOS install prompt if not installed
    if (isIOSDevice && !isInstalled) {
      const hasSeenIOSPrompt = localStorage.getItem('hasSeenIOSInstallPrompt');
      if (!hasSeenIOSPrompt) {
        setShowIOSPrompt(true);
      }
    }

    // Listen for beforeinstallprompt event (Android/Desktop Chrome)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowInstallButton(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listen for app installed event
    const handleAppInstalled = () => {
      setShowInstallButton(false);
      setDeferredPrompt(null);
      setIsInstalled(true);
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [isInstalled]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }
      
      setDeferredPrompt(null);
      setShowInstallButton(false);
    } catch (error) {
      console.error('Error installing app:', error);
    }
  };

  const handleIOSClose = () => {
    setShowIOSPrompt(false);
    localStorage.setItem('hasSeenIOSInstallPrompt', 'true');
  };

  // Don't show anything if already installed
  if (isInstalled) {
    return null;
  }

  // iOS Install Instructions
  if (isIOS && showIOSPrompt) {
    return (
      <div className="ios-install-prompt">
        <div className="ios-install-content">
          <button className="ios-close-btn" onClick={handleIOSClose}>×</button>
          <div className="ios-install-icon">📱</div>
          <h3>Install SubAlert</h3>
          <p>Install this app on your iPhone:</p>
          <ol>
            <li>Tap the share button <span className="ios-share-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            </span></li>
            <li>Scroll down and tap "Add to Home Screen"</li>
            <li>Tap "Add" in the top right</li>
          </ol>
          <button className="ios-got-it-btn" onClick={handleIOSClose}>Got it!</button>
        </div>
      </div>
    );
  }

  // Android/Desktop Install Button
  if (showInstallButton && deferredPrompt) {
    return (
      <div className="install-prompt-banner">
        <div className="install-prompt-content">
          <div className="install-prompt-text">
            <strong>Install SubAlert</strong>
            <span>Add to your home screen for quick access</span>
          </div>
          <button className="install-button" onClick={handleInstallClick}>
            Install
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default InstallPrompt;