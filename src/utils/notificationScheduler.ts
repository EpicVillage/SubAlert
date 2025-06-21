import { differenceInDays, parseISO } from 'date-fns';
import { storage } from './storage';
import { telegram } from './telegram';

export const checkAndSendNotifications = async () => {
  const settings = storage.getSettings();
  if (!settings.enableNotifications) return;

  const apis = storage.getAPIs();
  const notificationLogs = storage.getNotificationLogs();
  const today = new Date().toISOString().split('T')[0];

  for (const api of apis) {
    if (api.subscriptionType === 'paid' && api.expiryDate) {
      const daysLeft = differenceInDays(parseISO(api.expiryDate), new Date());
      
      // Check if we should send notification
      if (daysLeft > 0 && daysLeft <= settings.notificationDays) {
        // Check if we already sent a notification today for this API
        const alreadySent = notificationLogs.some(log => 
          log.apiId === api.id && 
          log.sentAt.startsWith(today)
        );

        if (!alreadySent) {
          const message = telegram.formatExpiryMessage(
            api.serviceName,
            daysLeft,
            api.cost
          );

          const sent = await telegram.sendMessage(settings, message);
          
          if (sent) {
            // Log the notification
            const newLogs = [...notificationLogs, {
              apiId: api.id,
              sentAt: new Date().toISOString(),
              type: 'expiry' as const
            }];
            storage.saveNotificationLogs(newLogs);
          }
        }
      }
    }
  }
};

// This function should be called periodically (e.g., daily)
export const setupNotificationScheduler = () => {
  // Check on app startup
  checkAndSendNotifications();

  // Check every 6 hours
  setInterval(() => {
    checkAndSendNotifications();
  }, 6 * 60 * 60 * 1000);
};