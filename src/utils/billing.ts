import { addMonths, addYears, isAfter, startOfToday } from 'date-fns';

export const getNextBillingDate = (
  currentDate: Date | string,
  billingCycle: 'monthly' | 'yearly' | 'one-time' | undefined
): Date | null => {
  if (!currentDate || billingCycle === 'one-time') return null;
  
  const date = typeof currentDate === 'string' ? new Date(currentDate) : currentDate;
  const today = startOfToday();
  
  // If the date is in the future, return it as is
  if (isAfter(date, today)) {
    return date;
  }
  
  // Calculate next billing date based on cycle
  let nextDate = date;
  
  if (billingCycle === 'monthly') {
    // Keep adding months until we get a future date
    while (!isAfter(nextDate, today)) {
      nextDate = addMonths(nextDate, 1);
    }
  } else if (billingCycle === 'yearly') {
    // Keep adding years until we get a future date
    while (!isAfter(nextDate, today)) {
      nextDate = addYears(nextDate, 1);
    }
  }
  
  return nextDate;
};

export const shouldShowAsRenewal = (api: any): boolean => {
  return api.subscriptionType === 'paid' && 
         api.billingCycle !== 'one-time' && 
         api.autoRenews === true;
};