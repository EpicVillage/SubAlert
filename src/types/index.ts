export interface Category {
  id: string;
  name: string;
  color: string;
  emoji?: string;
  isCustom: boolean;
}

export interface API {
  id: string;
  serviceName: string;
  serviceDescription?: string; // What does this service do?
  apiKey: string;
  email: string;
  subscriptionType: 'free' | 'paid';
  cost?: number;
  expiryDate?: string;
  billingCycle?: 'monthly' | 'yearly' | 'one-time';
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