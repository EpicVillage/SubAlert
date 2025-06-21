import { crypto } from './crypto';

const MASTER_PASSWORD_HASH = 'subalert_master_password_hash';
const MASTER_PASSWORD_SALT = 'subalert_master_password_salt';
const MASTER_PASSWORD_ENABLED = 'subalert_master_password_enabled';
const MASTER_PASSWORD_LAST_UNLOCK = 'subalert_master_password_last_unlock';
const MASTER_PASSWORD_LOCK_TIMEOUT = 'subalert_master_password_lock_timeout';
const ENCRYPTED_DATA_KEY = 'subalert_encrypted_data';

export type LockTimeout = 'immediately' | '1min' | '5min' | '15min' | '30min' | '1hour' | 'never';

const timeoutMilliseconds: Record<LockTimeout, number> = {
  'immediately': 0,
  '1min': 60 * 1000,
  '5min': 5 * 60 * 1000,
  '15min': 15 * 60 * 1000,
  '30min': 30 * 60 * 1000,
  '1hour': 60 * 60 * 1000,
  'never': Infinity,
};

export const masterPassword = {
  // Check if master password is enabled
  isEnabled: (): boolean => {
    return localStorage.getItem(MASTER_PASSWORD_ENABLED) === 'true';
  },

  // Check if app needs to be unlocked
  needsUnlock: (): boolean => {
    if (!masterPassword.isEnabled()) return false;
    
    const timeout = masterPassword.getLockTimeout();
    if (timeout === 'never') return false;
    
    const lastUnlock = localStorage.getItem(MASTER_PASSWORD_LAST_UNLOCK);
    if (!lastUnlock) return true;
    
    const elapsed = Date.now() - parseInt(lastUnlock);
    return elapsed > timeoutMilliseconds[timeout];
  },

  // Set up master password
  setup: async (password: string): Promise<boolean> => {
    try {
      // Generate salt
      const salt = crypto.generateSalt();
      
      // Hash password
      const hash = await crypto.hashPassword(password, salt);
      
      // Store hash and salt
      localStorage.setItem(MASTER_PASSWORD_HASH, hash);
      localStorage.setItem(MASTER_PASSWORD_SALT, salt);
      localStorage.setItem(MASTER_PASSWORD_ENABLED, 'true');
      localStorage.setItem(MASTER_PASSWORD_LOCK_TIMEOUT, '5min');
      
      // Encrypt existing data
      await masterPassword.encryptAllData(password);
      
      // Update last unlock time
      masterPassword.updateLastUnlock();
      
      return true;
    } catch (error) {
      console.error('Failed to setup master password:', error);
      return false;
    }
  },

  // Verify master password
  verify: async (password: string): Promise<boolean> => {
    try {
      const storedHash = localStorage.getItem(MASTER_PASSWORD_HASH);
      const salt = localStorage.getItem(MASTER_PASSWORD_SALT);
      
      if (!storedHash || !salt) return false;
      
      const hash = await crypto.hashPassword(password, salt);
      return hash === storedHash;
    } catch (error) {
      console.error('Failed to verify master password:', error);
      return false;
    }
  },

  // Unlock app with password
  unlock: async (password: string): Promise<boolean> => {
    const isValid = await masterPassword.verify(password);
    if (isValid) {
      masterPassword.updateLastUnlock();
      
      // Decrypt data if needed
      const encryptedData = localStorage.getItem(ENCRYPTED_DATA_KEY);
      if (encryptedData) {
        await masterPassword.decryptAllData(password);
      }
    }
    return isValid;
  },

  // Update last unlock time
  updateLastUnlock: (): void => {
    localStorage.setItem(MASTER_PASSWORD_LAST_UNLOCK, Date.now().toString());
  },

  // Get lock timeout setting
  getLockTimeout: (): LockTimeout => {
    const timeout = localStorage.getItem(MASTER_PASSWORD_LOCK_TIMEOUT);
    return (timeout as LockTimeout) || '5min';
  },

  // Set lock timeout
  setLockTimeout: (timeout: LockTimeout): void => {
    localStorage.setItem(MASTER_PASSWORD_LOCK_TIMEOUT, timeout);
  },

  // Disable master password
  disable: async (password: string): Promise<boolean> => {
    const isValid = await masterPassword.verify(password);
    if (!isValid) return false;
    
    // Decrypt all data before disabling
    await masterPassword.decryptAllData(password);
    
    // Remove master password data
    localStorage.removeItem(MASTER_PASSWORD_HASH);
    localStorage.removeItem(MASTER_PASSWORD_SALT);
    localStorage.removeItem(MASTER_PASSWORD_ENABLED);
    localStorage.removeItem(MASTER_PASSWORD_LAST_UNLOCK);
    localStorage.removeItem(MASTER_PASSWORD_LOCK_TIMEOUT);
    localStorage.removeItem(ENCRYPTED_DATA_KEY);
    
    return true;
  },

  // Encrypt all data
  encryptAllData: async (password: string): Promise<void> => {
    const dataToEncrypt = {
      apis: localStorage.getItem('subalert_apis'),
      settings: localStorage.getItem('subalert_settings'),
      categories: localStorage.getItem('subalert_categories'),
      aiSettings: localStorage.getItem('subalert_ai_settings'),
    };
    
    const encrypted = await crypto.encrypt(JSON.stringify(dataToEncrypt), password);
    localStorage.setItem(ENCRYPTED_DATA_KEY, encrypted);
    
    // Clear unencrypted data
    localStorage.removeItem('subalert_apis');
    localStorage.removeItem('subalert_settings');
    localStorage.removeItem('subalert_categories');
    localStorage.removeItem('subalert_ai_settings');
  },

  // Decrypt all data
  decryptAllData: async (password: string): Promise<void> => {
    const encryptedData = localStorage.getItem(ENCRYPTED_DATA_KEY);
    if (!encryptedData) return;
    
    try {
      const decrypted = await crypto.decrypt(encryptedData, password);
      const data = JSON.parse(decrypted);
      
      // Restore decrypted data
      if (data.apis) localStorage.setItem('subalert_apis', data.apis);
      if (data.settings) localStorage.setItem('subalert_settings', data.settings);
      if (data.categories) localStorage.setItem('subalert_categories', data.categories);
      if (data.aiSettings) localStorage.setItem('subalert_ai_settings', data.aiSettings);
    } catch (error) {
      console.error('Failed to decrypt data:', error);
      throw error;
    }
  },

  // Change master password
  change: async (currentPassword: string, newPassword: string): Promise<boolean> => {
    const isValid = await masterPassword.verify(currentPassword);
    if (!isValid) return false;
    
    // Decrypt with old password
    await masterPassword.decryptAllData(currentPassword);
    
    // Setup with new password
    return await masterPassword.setup(newPassword);
  },
  
  updateLastActivity: () => {
    localStorage.setItem(MASTER_PASSWORD_LAST_UNLOCK, Date.now().toString());
  },
};