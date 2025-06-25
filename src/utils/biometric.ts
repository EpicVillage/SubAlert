// Biometric authentication for mobile PWA
export const biometric = {
  // Check if biometric authentication is available
  isAvailable: async (): Promise<boolean> => {
    // Check if we're on HTTPS (required for WebAuthn)
    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
      console.log('Biometric auth requires HTTPS');
      return false;
    }

    // Check if Web Authentication API is available
    if (!window.PublicKeyCredential) {
      return false;
    }

    // Check if the device supports platform authenticator (biometric)
    try {
      const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      return available;
    } catch {
      return false;
    }
  },

  // Register biometric authentication
  register: async (): Promise<boolean> => {
    try {
      // Generate a random challenge
      const challenge = new Uint8Array(32);
      window.crypto.getRandomValues(challenge);

      // Create credential options
      const createCredentialOptions: CredentialCreationOptions = {
        publicKey: {
          challenge: challenge,
          rp: {
            name: 'SubAlert',
            // Don't specify id to use the default (current origin)
          },
          user: {
            id: new TextEncoder().encode('subalert-user'),
            name: 'SubAlert User',
            displayName: 'SubAlert User',
          },
          pubKeyCredParams: [
            { alg: -7, type: 'public-key' }, // ES256
            { alg: -257, type: 'public-key' }, // RS256
          ],
          authenticatorSelection: {
            authenticatorAttachment: 'platform',
            userVerification: 'preferred', // Use 'preferred' for faster auth
          },
          timeout: 10000, // Reduce timeout to 10 seconds
          attestation: 'none',
        },
      };

      // Create credential
      const credential = await navigator.credentials.create(createCredentialOptions);
      
      if (credential && credential instanceof PublicKeyCredential) {
        // Store credential ID for future authentication
        // Convert ArrayBuffer to base64 for storage
        const credentialIdArray = new Uint8Array(credential.rawId);
        const credentialIdBase64 = btoa(String.fromCharCode.apply(null, Array.from(credentialIdArray)));
        
        localStorage.setItem('subalert_biometric_id', credentialIdBase64);
        localStorage.setItem('subalert_biometric_enabled', 'true');
        localStorage.setItem('subalert_biometric_domain', window.location.hostname);
        console.log('Biometric credential registered successfully for domain:', window.location.hostname);
        return true;
      }
      
      return false;
    } catch (error) {
      // Biometric registration failed
      return false;
    }
  },

  // Authenticate with biometric
  authenticate: async (): Promise<boolean> => {
    try {
      // Check if we're on HTTPS first
      if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
        console.log('Biometric auth requires HTTPS - current protocol:', window.location.protocol);
        return false;
      }

      const credentialId = localStorage.getItem('subalert_biometric_id');
      if (!credentialId) {
        console.log('No biometric credential found');
        return false;
      }

      // Generate a random challenge
      const challenge = new Uint8Array(32);
      window.crypto.getRandomValues(challenge);

      // Create assertion options
      const getCredentialOptions: CredentialRequestOptions = {
        publicKey: {
          challenge: challenge,
          allowCredentials: [{
            id: Uint8Array.from(atob(credentialId), c => c.charCodeAt(0)),
            type: 'public-key',
            transports: ['internal'],
          }],
          userVerification: 'preferred', // Change to 'preferred' for faster auth
          timeout: 10000, // Reduce timeout to 10 seconds
        },
      };

      // Get credential
      const assertion = await navigator.credentials.get(getCredentialOptions);
      
      return !!assertion;
    } catch (error) {
      console.error('Biometric authentication error:', error);
      // If the error is because the credential doesn't exist on this domain, clear it
      if (error instanceof Error && error.name === 'NotAllowedError') {
        console.log('Credential not valid for this domain, clearing...');
        biometric.disable();
      }
      return false;
    }
  },

  // Check if biometric is enabled
  isEnabled: (): boolean => {
    const enabled = localStorage.getItem('subalert_biometric_enabled') === 'true';
    if (!enabled) return false;
    
    // Check if we're on the same domain where biometric was registered
    const registeredDomain = localStorage.getItem('subalert_biometric_domain');
    if (registeredDomain && registeredDomain !== window.location.hostname) {
      console.log('Biometric was registered on different domain:', registeredDomain, 'current:', window.location.hostname);
      // Don't automatically disable, just return false
      return false;
    }
    
    return true;
  },

  // Check if re-registration is needed
  needsReRegistration: (): boolean => {
    const enabled = localStorage.getItem('subalert_biometric_enabled') === 'true';
    if (!enabled) return false;
    
    const registeredDomain = localStorage.getItem('subalert_biometric_domain');
    return registeredDomain !== window.location.hostname;
  },

  // Disable biometric authentication
  disable: (): void => {
    localStorage.removeItem('subalert_biometric_id');
    localStorage.removeItem('subalert_biometric_enabled');
    localStorage.removeItem('subalert_last_auth');
    localStorage.removeItem('subalert_biometric_domain');
  },

  // Check if authentication is needed (e.g., after 5 minutes of inactivity)
  needsAuthentication: (): boolean => {
    if (!biometric.isEnabled()) {
      return false;
    }

    const lastAuth = localStorage.getItem('subalert_last_auth');
    if (!lastAuth) {
      return true;
    }

    const lastAuthTime = parseInt(lastAuth);
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000;

    return (now - lastAuthTime) > fiveMinutes;
  },

  // Update last authentication time
  updateLastAuth: (): void => {
    localStorage.setItem('subalert_last_auth', Date.now().toString());
  },
};