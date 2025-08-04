import axios from 'axios';
import { Settings } from '../types';

export const telegram = {
  sendMessage: async (settings: Settings, message: string): Promise<boolean> => {
    if (!settings.enableNotifications || !settings.telegramBotToken || !settings.telegramChatId) {
      return false;
    }

    try {
      const url = `https://api.telegram.org/bot${settings.telegramBotToken}/sendMessage`;
      await axios.post(url, {
        chat_id: settings.telegramChatId,
        text: message,
        parse_mode: 'HTML'
      });
      return true;
    } catch (error) {
      // Failed to send Telegram message
      return false;
    }
  },

  testConnection: async (botToken: string, chatId: string): Promise<boolean> => {
    try {
      const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
      await axios.post(url, {
        chat_id: chatId,
        text: '✅ SubAlerts connected successfully!',
        parse_mode: 'HTML'
      });
      return true;
    } catch (error) {
      // Telegram test failed
      return false;
    }
  },

  formatExpiryMessage: (serviceName: string, daysLeft: number, cost?: number): string => {
    let message = `⚠️ <b>Subscription Expiring Soon</b>\n\n`;
    message += `Service: <b>${serviceName}</b>\n`;
    message += `Days left: <b>${daysLeft}</b>\n`;
    if (cost) {
      message += `Cost: <b>$${cost}/month</b>\n`;
    }
    message += `\nRemember to renew your subscription!`;
    return message;
  }
};