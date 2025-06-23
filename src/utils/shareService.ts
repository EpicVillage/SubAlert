import CryptoJS from 'crypto-js';
import { API } from '../types';

export interface ShareConfig {
  data: Partial<API>;
  expires: number;
  version: string;
}

export interface ShareOptions {
  includeFields: {
    serviceName?: boolean;
    serviceDescription?: boolean;
    website?: boolean;
    logo?: boolean;
    email?: boolean;
    cost?: boolean;
    billingCycle?: boolean;
    expiryDate?: boolean;
    category?: boolean;
    notes?: boolean;
    apiKey?: boolean;
    websocketUrl?: boolean;
    customFields?: boolean;
  };
  expirationHours: number;
}

class ShareService {
  private readonly VERSION = '1.0';

  generatePassword(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let password = '';
    for (let i = 0; i < 16; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  filterFields(subscription: API, options: ShareOptions): Partial<API> {
    const filtered: Partial<API> = {};
    const { includeFields } = options;

    if (includeFields.serviceName) filtered.serviceName = subscription.serviceName;
    if (includeFields.serviceDescription) filtered.serviceDescription = subscription.serviceDescription;
    if (includeFields.website) filtered.website = subscription.website;
    if (includeFields.logo) filtered.logo = subscription.logo;
    if (includeFields.email) filtered.email = subscription.email;
    if (includeFields.cost) filtered.cost = subscription.cost;
    if (includeFields.billingCycle) filtered.billingCycle = subscription.billingCycle;
    if (includeFields.expiryDate) filtered.expiryDate = subscription.expiryDate;
    if (includeFields.category) filtered.category = subscription.category;
    if (includeFields.notes) filtered.notes = subscription.notes;
    if (includeFields.apiKey) filtered.apiKey = subscription.apiKey;
    if (includeFields.websocketUrl) filtered.websocketUrl = subscription.websocketUrl;
    if (includeFields.customFields) filtered.customFields = subscription.customFields;

    return filtered;
  }

  encryptData(subscription: API, options: ShareOptions): { encrypted: string; password: string } {
    const dataToShare = this.filterFields(subscription, options);
    const expirationTime = Date.now() + (options.expirationHours * 60 * 60 * 1000);
    
    const sharePackage: ShareConfig = {
      data: dataToShare,
      expires: expirationTime,
      version: this.VERSION
    };

    const password = this.generatePassword();
    const encrypted = CryptoJS.AES.encrypt(
      JSON.stringify(sharePackage),
      password
    ).toString();

    return { encrypted, password };
  }

  decryptData(encrypted: string, password: string): Partial<API> {
    try {
      const decrypted = CryptoJS.AES.decrypt(encrypted, password);
      const decryptedString = decrypted.toString(CryptoJS.enc.Utf8);
      
      if (!decryptedString) {
        throw new Error('Invalid password or corrupted data');
      }

      const sharePackage: ShareConfig = JSON.parse(decryptedString);

      // Check version compatibility
      if (sharePackage.version !== this.VERSION) {
        console.warn(`Share version mismatch: expected ${this.VERSION}, got ${sharePackage.version}`);
      }

      // Check expiration
      if (sharePackage.expires < Date.now()) {
        throw new Error('This share link has expired');
      }

      return sharePackage.data;
    } catch (error) {
      if (error instanceof Error && error.message.includes('expired')) {
        throw error;
      }
      throw new Error('Failed to decrypt data. Invalid link or password.');
    }
  }

  createShareURL(encrypted: string, password: string): string {
    // Use URL-safe base64 encoding
    const urlSafeEncrypted = encrypted.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    return `${window.location.origin}/#/share/${urlSafeEncrypted}?key=${encodeURIComponent(password)}`;
  }

  parseShareURL(url: string): { encrypted: string; password: string } | null {
    try {
      const urlObj = new URL(url);
      const match = urlObj.hash.match(/#\/share\/([^?]+)\?key=([^&]+)/);
      
      if (!match) return null;

      // Convert back from URL-safe base64
      let encrypted = match[1].replace(/-/g, '+').replace(/_/g, '/');
      // Add padding if needed
      while (encrypted.length % 4) {
        encrypted += '=';
      }

      const password = decodeURIComponent(match[2]);
      
      if (!password) return null;

      return { encrypted, password };
    } catch {
      return null;
    }
  }
}

export const shareService = new ShareService();