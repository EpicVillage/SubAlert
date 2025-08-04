export interface Category {
  id: string;
  name: string;
  color: string;
  emoji?: string;
  isCustom: boolean;
}

export interface CustomField {
  name: string;
  value: string;
  isSensitive?: boolean;
}

export interface API {
  id: string;
  type?: 'subscription' | 'divider'; // Type of card, defaults to 'subscription'
  serviceName: string;
  serviceDescription?: string; // What does this service do?
  website?: string; // Service website URL
  logo?: string; // Service logo URL or base64 data
  apiKey: string;
  websocketUrl?: string; // WebSocket URL for real-time connections
  customFields?: CustomField[]; // Array of custom fields with names and values
  email: string;
  subscriptionType: 'free' | 'paid';
  cost?: number;
  expiryDate?: string;
  billingCycle?: 'monthly' | 'yearly' | 'one-time';
  autoRenews?: boolean; // Whether the subscription auto-renews
  category: string; // Now references category ID
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Settings {
  telegramBotToken?: string;
  telegramChatId?: string;
  notificationDays: number;
  enableNotifications: boolean;
}

export interface NotificationLog {
  apiId: string;
  sentAt: string;
  type: 'expiry' | 'test';
}