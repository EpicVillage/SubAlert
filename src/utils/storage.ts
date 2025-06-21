import { API, Settings, NotificationLog, Category } from '../types';
import { defaultCategories } from './categories';
import { crypto } from './crypto';

const STORAGE_KEYS = {
  APIS: 'subalert_apis',
  SETTINGS: 'subalert_settings',
  NOTIFICATIONS: 'subalert_notifications',
  CATEGORIES: 'subalert_categories'
};

export const storage = {
  getAPIs: (): API[] => {
    const data = localStorage.getItem(STORAGE_KEYS.APIS);
    return data ? JSON.parse(data) : [];
  },

  saveAPIs: (apis: API[]) => {
    localStorage.setItem(STORAGE_KEYS.APIS, JSON.stringify(apis));
  },

  getSettings: (): Settings => {
    const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    return data ? JSON.parse(data) : {
      notificationDays: 7,
      enableNotifications: false
    };
  },

  saveSettings: (settings: Settings) => {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  },

  getNotificationLogs: (): NotificationLog[] => {
    const data = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    return data ? JSON.parse(data) : [];
  },

  saveNotificationLogs: (logs: NotificationLog[]) => {
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(logs));
  },

  getCategories: (): Category[] => {
    const data = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
    return data ? JSON.parse(data) : defaultCategories;
  },

  saveCategories: (categories: Category[]) => {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
  },

  exportData: (password?: string) => {
    // Get AI settings directly from localStorage to avoid circular import
    const aiSettingsRaw = localStorage.getItem('subalert_ai_settings');
    const aiSettings = aiSettingsRaw ? JSON.parse(aiSettingsRaw) : null;
    
    const data = {
      apis: storage.getAPIs(),
      settings: storage.getSettings(),
      categories: storage.getCategories(),
      aiSettings: aiSettings,
      exportDate: new Date().toISOString()
    };
    
    const date = new Date();
    const dateStr = `${date.getDate().toString().padStart(2, '0')}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getFullYear()}`;
    
    if (password) {
      // Encrypted export
      crypto.encrypt(JSON.stringify(data, null, 2), password).then(encryptedData => {
        const exportData = {
          encrypted: true,
          data: encryptedData,
          version: '1.0'
        };
        
        const blob = new Blob([JSON.stringify(exportData)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `subalert-backup-encrypted-${dateStr}.json`;
        a.click();
        URL.revokeObjectURL(url);
      });
    } else {
      // Regular export
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `subalert-backup-${dateStr}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  },

  importData: async (file: File, password?: string): Promise<void> => {
    try {
      const text = await file.text();
      let data = JSON.parse(text);
      
      // Check if file is encrypted
      if (data.encrypted === true) {
        if (!password) {
          throw new Error('This backup file is password protected');
        }
        
        try {
          const decryptedText = await crypto.decrypt(data.data, password);
          data = JSON.parse(decryptedText);
        } catch (error) {
          throw new Error('Invalid password or corrupted file');
        }
      }
      
      // Validate the imported data structure
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid backup file format');
      }
      
      // Import APIs
      if (data.apis && Array.isArray(data.apis)) {
        storage.saveAPIs(data.apis);
      }
      
      // Import settings
      if (data.settings) {
        storage.saveSettings(data.settings);
      }
      
      // Import categories (use defaults if not present for backward compatibility)
      if (data.categories && Array.isArray(data.categories)) {
        storage.saveCategories(data.categories);
      }
      
      // Import AI settings if present
      if (data.aiSettings) {
        localStorage.setItem('subalert_ai_settings', JSON.stringify(data.aiSettings));
      }
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error('Invalid JSON format in backup file');
      }
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to import backup file: ${errorMessage}`);
    }
  }
};