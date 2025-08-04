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
    const apis: API[] = data ? JSON.parse(data) : [];
    
    // Apply custom order if exists
    const orderData = localStorage.getItem('apiOrder');
    if (orderData) {
      try {
        const order: string[] = JSON.parse(orderData);
        const orderedApis: API[] = [];
        const apiMap = new Map<string, API>(apis.map((api: API) => [api.id, api]));
        
        // Add APIs in the saved order
        order.forEach((id: string) => {
          const api = apiMap.get(id);
          if (api) {
            orderedApis.push(api);
            apiMap.delete(id);
          }
        });
        
        // Add any remaining APIs not in the order
        apiMap.forEach((api: API) => orderedApis.push(api));
        
        return orderedApis;
      } catch (e) {
        // If order data is invalid, return APIs as is
        return apis;
      }
    }
    
    return apis;
  },

  saveAPIs: (apis: API[]) => {
    localStorage.setItem(STORAGE_KEYS.APIS, JSON.stringify(apis));
    // Update activity time for master password
    const masterPasswordEnabled = localStorage.getItem('subalert_master_password_enabled');
    if (masterPasswordEnabled === 'true') {
      localStorage.setItem('subalert_master_password_last_unlock', Date.now().toString());
    }
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
    // Update activity time for master password
    const masterPasswordEnabled = localStorage.getItem('subalert_master_password_enabled');
    if (masterPasswordEnabled === 'true') {
      localStorage.setItem('subalert_master_password_last_unlock', Date.now().toString());
    }
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
    // Update activity time for master password
    const masterPasswordEnabled = localStorage.getItem('subalert_master_password_enabled');
    if (masterPasswordEnabled === 'true') {
      localStorage.setItem('subalert_master_password_last_unlock', Date.now().toString());
    }
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

  importData: async (file: File, password?: string, mode: 'merge' | 'replace' = 'replace'): Promise<void> => {
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
        if (mode === 'merge') {
          // Merge mode: Add non-duplicate APIs
          const existingAPIs = storage.getAPIs();
          const existingIds = new Set(existingAPIs.map(api => api.id));
          
          // Also check for duplicates by service name + email combination
          const existingKeys = new Set(
            existingAPIs.map(api => `${api.serviceName.toLowerCase()}_${api.email.toLowerCase()}`)
          );
          
          const newAPIs = data.apis.filter((api: API) => {
            const key = `${api.serviceName.toLowerCase()}_${api.email.toLowerCase()}`;
            return !existingIds.has(api.id) && !existingKeys.has(key);
          });
          
          if (newAPIs.length > 0) {
            storage.saveAPIs([...existingAPIs, ...newAPIs]);
          }
        } else {
          // Replace mode: Replace all APIs
          storage.saveAPIs(data.apis);
        }
      }
      
      // Import settings (always replace for settings)
      if (data.settings) {
        storage.saveSettings(data.settings);
      }
      
      // Import categories
      if (data.categories && Array.isArray(data.categories)) {
        if (mode === 'merge') {
          // Merge categories
          const existingCategories = storage.getCategories();
          const existingIds = new Set(existingCategories.map(cat => cat.id));
          const newCategories = data.categories.filter((cat: Category) => !existingIds.has(cat.id) && cat.isCustom);
          
          if (newCategories.length > 0) {
            storage.saveCategories([...existingCategories, ...newCategories]);
          }
        } else {
          // Replace categories
          storage.saveCategories(data.categories);
        }
      }
      
      // Import AI settings if present (always replace)
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