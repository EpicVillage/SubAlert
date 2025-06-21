import { API, Category } from '../types';
import { parseISO, format } from 'date-fns';
import { shouldShowAsRenewal } from './billing';
import { getCategoryById } from './categories';

interface ICalOptions {
  includeReminders?: boolean;
  reminderDays?: number[];
  selectedApis?: string[];
  selectedCategories?: string[];
}

export class ICalGenerator {
  private lines: string[] = [];
  
  constructor() {
    this.lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//SubAlert//Subscription Calendar//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      `X-WR-CALNAME:SubAlert Subscriptions`,
      `X-WR-CALDESC:Subscription renewal dates from SubAlert`
    ];
  }
  
  public generateICalFile(apis: API[], categories: Category[], options: ICalOptions = {}): string {
    const {
      includeReminders = true,
      reminderDays = [7, 3, 1],
      selectedApis,
      selectedCategories
    } = options;
    
    // Filter APIs based on options
    let filteredApis = apis;
    
    if (selectedApis && selectedApis.length > 0) {
      filteredApis = filteredApis.filter(api => selectedApis.includes(api.id));
    }
    
    if (selectedCategories && selectedCategories.length > 0) {
      filteredApis = filteredApis.filter(api => selectedCategories.includes(api.category));
    }
    
    // Generate events for each API
    filteredApis.forEach(api => {
      if (api.expiryDate) {
        const category = getCategoryById(categories, api.category);
        
        if (shouldShowAsRenewal(api)) {
          // For auto-renewing subscriptions, create recurring event
          this.addRecurringEvent(api, category, includeReminders, reminderDays);
        } else {
          // For non-renewing subscriptions, create single event
          this.addSingleEvent(api, category, 'expiry', includeReminders, reminderDays);
        }
      }
    });
    
    this.lines.push('END:VCALENDAR');
    return this.lines.join('\r\n');
  }
  
  private addRecurringEvent(
    api: API, 
    category: Category | undefined,
    includeReminders: boolean,
    reminderDays: number[]
  ) {
    const expiryDate = parseISO(api.expiryDate!);
    const uid = `${api.id}-renewal@subalert.app`;
    const now = new Date();
    
    this.lines.push('BEGIN:VEVENT');
    this.lines.push(`UID:${uid}`);
    this.lines.push(`DTSTAMP:${this.formatDate(now)}Z`);
    this.lines.push(`DTSTART;VALUE=DATE:${format(expiryDate, 'yyyyMMdd')}`);
    
    // Set recurrence rule based on billing cycle
    if (api.billingCycle === 'monthly') {
      this.lines.push('RRULE:FREQ=MONTHLY');
    } else if (api.billingCycle === 'yearly') {
      this.lines.push('RRULE:FREQ=YEARLY');
    }
    
    this.lines.push(`SUMMARY:${api.serviceName} - Renewal`);
    
    // Build description
    const description = this.buildDescription(api, category, 'renewal');
    this.lines.push(`DESCRIPTION:${this.escapeText(description)}`);
    
    // Add category as location (for color coding in some calendar apps)
    if (category) {
      this.lines.push(`LOCATION:${category.name}`);
      this.lines.push(`CATEGORIES:${category.name}`);
    }
    
    // Add reminders
    if (includeReminders && api.subscriptionType === 'paid') {
      reminderDays.forEach(days => {
        this.addReminder(days);
      });
    }
    
    this.lines.push('END:VEVENT');
  }
  
  private addSingleEvent(
    api: API,
    category: Category | undefined,
    type: 'renewal' | 'expiry',
    includeReminders: boolean,
    reminderDays: number[]
  ) {
    const eventDate = parseISO(api.expiryDate!);
    const uid = `${api.id}-${type}@subalert.app`;
    const now = new Date();
    
    this.lines.push('BEGIN:VEVENT');
    this.lines.push(`UID:${uid}`);
    this.lines.push(`DTSTAMP:${this.formatDate(now)}Z`);
    this.lines.push(`DTSTART;VALUE=DATE:${format(eventDate, 'yyyyMMdd')}`);
    this.lines.push(`SUMMARY:${api.serviceName} - ${type === 'expiry' ? 'Expires' : 'Renewal'}`);
    
    // Build description
    const description = this.buildDescription(api, category, type);
    this.lines.push(`DESCRIPTION:${this.escapeText(description)}`);
    
    // Add category
    if (category) {
      this.lines.push(`LOCATION:${category.name}`);
      this.lines.push(`CATEGORIES:${category.name}`);
    }
    
    // Add reminders
    if (includeReminders) {
      reminderDays.forEach(days => {
        this.addReminder(days);
      });
    }
    
    this.lines.push('END:VEVENT');
  }
  
  private buildDescription(api: API, category: Category | undefined, type: string): string {
    const parts: string[] = [];
    
    parts.push(`Subscription: ${api.serviceName}`);
    parts.push(`Type: ${type === 'renewal' ? 'Auto-renewal' : 'Expiry'}`);
    
    if (category) {
      parts.push(`Category: ${category.name}`);
    }
    
    if (api.subscriptionType === 'paid' && api.cost) {
      parts.push(`Cost: $${api.cost}/${api.billingCycle}`);
    }
    
    parts.push(`Email: ${api.email}`);
    
    if (api.website) {
      parts.push(`Website: ${api.website}`);
    }
    
    if (api.notes) {
      parts.push(`\\nNotes: ${api.notes}`);
    }
    
    return parts.join('\\n');
  }
  
  private addReminder(daysBefore: number) {
    this.lines.push('BEGIN:VALARM');
    this.lines.push('ACTION:DISPLAY');
    this.lines.push(`TRIGGER:-P${daysBefore}D`);
    this.lines.push(`DESCRIPTION:${daysBefore} day${daysBefore > 1 ? 's' : ''} before renewal`);
    this.lines.push('END:VALARM');
  }
  
  private formatDate(date: Date): string {
    return format(date, "yyyyMMdd'T'HHmmss");
  }
  
  private escapeText(text: string): string {
    return text
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '');
  }
}

export const generateICalFile = (apis: API[], categories: Category[], options?: ICalOptions): Blob => {
  const generator = new ICalGenerator();
  const icalContent = generator.generateICalFile(apis, categories, options);
  return new Blob([icalContent], { type: 'text/calendar;charset=utf-8' });
};